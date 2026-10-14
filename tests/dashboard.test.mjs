import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPracticeDashboard,DASHBOARD_RANGES,localDayKey} from '../dashboard.js';

const midday=(day)=>new Date(2026,9,day,12,0,0);
const entry=(kind,day,payload)=>({kind,created_at:midday(day).toISOString(),payload});
const drill=(day,sessionId,seconds,ratingPct,drillId='picking-reset')=>
 entry('drill',day,{sessionId,seconds,ratingPct,drillId,key:'C',bpm:70});

test('empty and invalid history yields 14 calendar days with honest empty stats',()=>{
 assert.deepEqual(DASHBOARD_RANGES,[7,14,30]);
 const report=buildPracticeDashboard([],midday(13));
 assert.equal(report.days.length,14);
 assert.equal(report.days[0].key,'2026-09-30');
 assert.equal(report.today.key,'2026-10-13');
 assert.equal(report.summary.weekMinutes,0);
 assert.equal(report.summary.weekDays,0);
 assert.equal(report.summary.streak,0);
 assert.equal(report.summary.averageQuality,null);
 assert.equal(report.summary.highQualityRate,null);
 assert.equal(report.summary.topCategory,null);
 assert.ok(report.days.every(day=>day.drills===0&&day.sessions===0&&day.practiced===false));
 assert.equal(buildPracticeDashboard([],midday(13),7).days.length,7);
 assert.equal(buildPracticeDashboard([],midday(13),30).days.length,30);
 assert.equal(buildPracticeDashboard([],midday(13),999).days.length,14);
 assert.equal(localDayKey('not a date'),null);
});

test('completed session recaps do NOT double-count existing timed drills',()=>{
 const records=[
  drill(13,'session-a',1800,80),
  drill(13,'session-a',2700,100,'jazz-251'),
  entry('session',13,{sessionId:'session-a',durationMinutes:75,drillsCompleted:2,plannedMinutes:90})
 ];
 const stats=buildPracticeDashboard(records,midday(13));
 assert.equal(stats.today.seconds,4500);
 assert.equal(stats.today.minutes,75);
 assert.equal(stats.today.drills,2);
 assert.equal(stats.today.sessions,1);
 assert.equal(stats.summary.weekMinutes,75);
 assert.equal(stats.summary.weekDrills,2);
 assert.equal(stats.summary.weekSessions,1);
 assert.equal(stats.summary.weekDays,1);
 assert.equal(stats.summary.averageQuality,90);
 assert.equal(stats.summary.highQualityRate,50);
 assert.equal(stats.summary.ratedCount,2);
 assert.equal(stats.summary.topCategory,'Jazz vocabulary');
});

test('legacy sessions supply time only if no matching timed exercises are present anywhere',()=>{
 const records=[
  entry('session',12,{sessionId:'old',durationMinutes:40}),
  drill(12,'late-summary',900,70),
  entry('session',13,{sessionId:'late-summary',durationMinutes:15}),
  entry('song',13,{songId:'fly-me',notes:'No time should be added'}),
  entry('session',13,{sessionId:'untimed',durationMinutes:20})
 ];
 const stats=buildPracticeDashboard(records,midday(13));
 assert.equal(stats.days.at(-2).minutes,55);
 assert.equal(stats.today.minutes,20);
 assert.equal(stats.summary.weekMinutes,75);
 assert.equal(stats.summary.weekSessions,3);
 assert.equal(stats.summary.weekDrills,1);
 assert.equal(stats.summary.weekDays,2);
});

test('recent versus previous seven-day comparison uses local calendar days',()=>{
 const records=[
  drill(6,'previous',3600,70), // exactly 7 calendar days before today
  drill(7,'recent',1800,90),
  drill(13,'recent2',3600,100)
 ];
 const stats=buildPracticeDashboard(records,midday(13),7);
 assert.equal(stats.summary.weekMinutes,90);
 assert.equal(stats.summary.priorWeekMinutes,60);
 assert.equal(stats.summary.weekDifference,30);
 assert.equal(stats.days.length,7);
 assert.equal(stats.days[0].key,'2026-10-07');
 assert.equal(stats.summary.weekDays,2);
});

test('streak continues from yesterday when today has not been practiced',()=>{
 const records=[drill(10,'a',300,70),drill(11,'b',300,80),drill(12,'c',300,90)];
 assert.equal(buildPracticeDashboard(records,midday(13)).summary.streak,3);
 assert.equal(buildPracticeDashboard(records.concat(drill(13,'d',300,100)),midday(13)).summary.streak,4);
 assert.equal(buildPracticeDashboard([drill(9,'x',300,100)],midday(13)).summary.streak,0);
});

test('historical rating words are not fabricated as percentages, zero is valid',()=>{
 const records=[
  entry('drill',13,{drillId:'picking-reset',seconds:600,rating:'clean'}),
  drill(13,'z',600,0),
  drill(13,'y',600,100),
  entry('drill',13,{drillId:'muting-one',seconds:600,ratingPct:'80'})
 ];
 const stats=buildPracticeDashboard(records,midday(13));
 assert.equal(stats.summary.weekMinutes,40);
 assert.equal(stats.summary.averageQuality,50);
 assert.equal(stats.summary.ratedCount,2);
 assert.equal(stats.summary.highQualityRate,50);
 assert.equal(stats.today.attempts.length,4);
});

test('drill categories, song titles, BPM and self-rated quality enrich selected-day detail',()=>{
 const records=[
  drill(13,'x',600,90,'muting-vibrato-g'),
  entry('drill',13,{drillId:'song:autumn-leaves',seconds:1200,ratingPct:80,key:'Bb',bpm:65}),
  entry('drill',13,{drillId:'harmony-251',seconds:300,ratingPct:100,key:'Db',bpm:72})
 ];
 const d=buildPracticeDashboard(records,midday(13)).today;
 assert.equal(d.drills,3);
 assert.equal(d.minutes,35);
 assert.ok(d.attempts.some(a=>a.title==='Autumn Leaves'&&a.category==='Repertoire'&&a.key==='Bb'));
 assert.ok(d.attempts.some(a=>a.title==='ii–V–I harmony'&&a.category==='Jazz vocabulary'));
 assert.ok(d.attempts.some(a=>a.category==='Muting & precision'));
 assert.ok(d.attempts.every(a=>a.quality!==null));
});

test('local date helpers respect calendar boundaries, including daylight transitions',()=>{
 for(const d of [new Date(2026,2,7,22),new Date(2026,2,8,12),new Date(2026,2,9,12)]){
  assert.equal(localDayKey(d),[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'));
 }
 const records=[{kind:'drill',created_at:new Date(2026,2,8,0,30).toISOString(),
  payload:{seconds:1800,drillId:'ear-guide',ratingPct:90}}];
 const stats=buildPracticeDashboard(records,new Date(2026,2,9,12));
 assert.equal(stats.days.at(-2).minutes,30);
});

test('input records remain untouched and malformed records do not inflate time',()=>{
 const records=[
  drill(13,'valid',60,80),
  entry('drill',13,{drillId:'ear-guide',seconds:Infinity,ratingPct:130}),
  entry('session',13,{sessionId:'bad',durationMinutes:'not a number'}),
  {kind:'drill',created_at:'garbage',payload:{seconds:3600}},
  entry('song',13,{minutes:120}),
  drill(14,'future',1000,100)
 ];
 const original=JSON.stringify(records);
 const stats=buildPracticeDashboard(records,midday(13));
 assert.equal(stats.summary.weekMinutes,1);
 assert.equal(stats.summary.ratedCount,1);
 assert.equal(stats.summary.weekDrills,2);
 assert.equal(JSON.stringify(records),original);
});
