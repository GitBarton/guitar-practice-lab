// Local-first daily practice analytics. Uses existing records; does not modify or upload them.
import {DRILL_BY_ID,SONGS,CATEGORIES} from './data.js';
import {validRatingPercent} from './storage.js';

export const DASHBOARD_RANGES=[7,14,30];
const DAY_SECONDS=86400;
const categoryLabels=Object.fromEntries(CATEGORIES.map(([key,label])=>[key,label]));
const repertoireNames=Object.fromEntries(SONGS.map(song=>[song.id,song.title]));

export function localDayKey(dateValue){
 const date=dateValue instanceof Date?dateValue:new Date(dateValue);
 if(!Number.isFinite(date.getTime()))return null;
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
function minutes(seconds){return Math.round(seconds/60);}
function safeSeconds(value){
 const n=Number(value);
 return Number.isFinite(n)&&n>0?Math.min(n,DAY_SECONDS):0;
}
function drillDetails(payload={}){
 const id=String(payload.drillId||'');
 if(id.startsWith('song:'))return {title:repertoireNames[id.slice(5)]||'Song practice',category:'Repertoire'};
 if(id==='harmony-251')return {title:'ii–V–I harmony',category:'Jazz vocabulary'};
 const known=DRILL_BY_ID[id];
 return {title:known?.title||'Practice drill',category:categoryLabels[known?.category]||'Other'};
}
function blankDay(date){
 return {
  key:localDayKey(date),
  weekday:date.toLocaleDateString(undefined,{weekday:'short'}),
  dateLabel:date.toLocaleDateString(undefined,{month:'short',day:'numeric'}),
  fullLabel:date.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}),
  seconds:0,minutes:0,drills:0,sessions:0,qualitySum:0,qualityCount:0,avgQuality:null,
  attempts:[],categorySeconds:{},practiced:false
 };
}
function addPractice(day,seconds){
 day.seconds+=seconds;
 day.practiced=day.seconds>0;
}
function emptyAnalytics(){
 return {days:[],today:null,summary:{todayMinutes:0,weekMinutes:0,priorWeekMinutes:0,weekDifference:0,weekSessions:0,weekDrills:0,weekDays:0,streak:0,averageQuality:null,ratedCount:0,highQualityRate:null,topCategory:null,categoryBreakdown:[]}};
}

/**
 * Calendar-day dashboard. Times are attributed to the local day of the exercise log.
 * Recorded drill seconds are authoritative; completed-session durations are included
 * ONLY if their sessionId has no timed drills anywhere in the history. This prevents
 * counting exercise time again when the session recap is saved, even on the next day.
 * Legacy three-level ratings are not transformed into fabricated percentages.
 */
export function buildPracticeDashboard(records=[],now=new Date(),range=14){
 const today=now instanceof Date?new Date(now.getTime()):new Date(now);
 if(!Number.isFinite(today.getTime()))return emptyAnalytics();
 const period=DASHBOARD_RANGES.includes(Number(range))?Number(range):14;
 const items=Array.isArray(records)?records:[];
 const dateByOffset=offset=>new Date(today.getFullYear(),today.getMonth(),today.getDate()+offset,12);
 const allDays=Array.from({length:30},(_,i)=>blankDay(dateByOffset(i-29)));
 const lookup=new Map(allDays.map(day=>[day.key,day]));
 const fullPracticeDays=new Set();
 const sessionsWithTimedDrills=new Set(items.filter(r=>r?.kind==='drill'&&safeSeconds(r.payload?.seconds)>0&&r.payload?.sessionId).map(r=>String(r.payload.sessionId)));

 for(const record of items){
  if(record?.kind!=='drill'&&record?.kind!=='session')continue;
  const dayKey=localDayKey(record.created_at);
  if(!dayKey)continue;
  const day=lookup.get(dayKey);
  const payload=record.payload||{};
  if(record.kind==='drill'){
   const seconds=safeSeconds(payload.seconds);
   if(seconds>0)fullPracticeDays.add(dayKey);
   if(!day)continue;
   day.drills++;
   addPractice(day,seconds);
   const detail=drillDetails(payload);
   if(seconds){
    day.categorySeconds[detail.category]=(day.categorySeconds[detail.category]||0)+seconds;
   }
   const rating=validRatingPercent(payload);
   if(rating!==null){day.qualityCount++;day.qualitySum+=rating;}
   const bpm=Number(payload.bpm);
   day.attempts.push({title:detail.title,category:detail.category,seconds,minutes:minutes(seconds),quality:rating,
    key:typeof payload.key==='string'?payload.key.slice(0,16):null,bpm:Number.isFinite(bpm)&&bpm>=30&&bpm<=300?Math.round(bpm):null});
  }else{
   // Backfill a legacy recap only when no underlying timed drill is available.
   const sessionId=payload.sessionId==null?null:String(payload.sessionId);
   const seconds=sessionId&&sessionsWithTimedDrills.has(sessionId)?0:safeSeconds(Number(payload.durationMinutes)*60);
   if(seconds>0)fullPracticeDays.add(dayKey);
   if(!day)continue;
   day.sessions++;
   addPractice(day,seconds);
  }
 }
 for(const day of allDays){
  day.minutes=minutes(day.seconds);
  day.avgQuality=day.qualityCount?Math.round(day.qualitySum/day.qualityCount):null;
  // Most recent attempts first, preserving their original log order when timestamps match.
  day.attempts.reverse();
 }
 const recent=allDays.slice(-7),prior=allDays.slice(-14,-7);
 const sum=(days,field)=>days.reduce((total,day)=>total+day[field],0);
 const seconds=sum(recent,'seconds'),previousSeconds=sum(prior,'seconds');
 const categorySeconds={};
 for(const day of recent)for(const [name,value] of Object.entries(day.categorySeconds)){
  categorySeconds[name]=(categorySeconds[name]||0)+value;
 }
 const categories=Object.entries(categorySeconds).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
   .map(([name,seconds])=>({name,minutes:minutes(seconds),seconds}));
 const qualityCount=sum(recent,'qualityCount'),qualitySum=sum(recent,'qualitySum');
 const highQualityCount=recent.reduce((total,day)=>total+day.attempts.filter(d=>d.quality!==null&&d.quality>=90).length,0);
 // Streak includes today when practiced; otherwise allows yesterday as last active day.
 let streak=0;
 const start=fullPracticeDays.has(localDayKey(dateByOffset(0)))?0:-1;
 for(let offset=start;offset>=-365;offset--){
  if(!fullPracticeDays.has(localDayKey(dateByOffset(offset))))break;
  streak++;
 }
 return {
  days:allDays.slice(-period),
  today:allDays.at(-1),
  summary:{
   todayMinutes:allDays.at(-1).minutes,
   weekMinutes:minutes(seconds),
   priorWeekMinutes:minutes(previousSeconds),
   weekDifference:minutes(seconds)-minutes(previousSeconds),
   weekSessions:sum(recent,'sessions'),
   weekDrills:sum(recent,'drills'),
   weekDays:recent.filter(day=>day.practiced).length,
   streak,
   averageQuality:qualityCount?Math.round(qualitySum/qualityCount):null,
   ratedCount:qualityCount,
   highQualityRate:qualityCount?Math.round(highQualityCount/qualityCount*100):null,
   topCategory:categories[0]?.name||null,
   categoryBreakdown:categories
  }
 };
}
