const KEY='guitar-practice-lab-v1';
export const uid=()=>globalThis.crypto?.randomUUID?.()||('gpl-'+Date.now()+'-'+Math.random().toString(36).slice(2));
export function defaultState(){return {version:1,records:[],active:null,settings:{theme:'dark',defaultBpm:70,selectedMode:'technique',selectedSong:'autumn-leaves',selectedKey:'auto',diagram:'tab',labels:'note',position:'low',subdivision:'quarter',meter:'4/4'},cloud:{url:'',key:''}};}
export function loadState(){try{const raw=localStorage.getItem(KEY);if(!raw)return defaultState();const parsed=JSON.parse(raw);const d=defaultState();return {...d,...parsed,settings:{...d.settings,...(parsed.settings||{})},cloud:{...d.cloud,...(parsed.cloud||{})},records:Array.isArray(parsed.records)?parsed.records:[]};}catch{return defaultState();}}
export function saveState(s){try{localStorage.setItem(KEY,JSON.stringify(s));return true;}catch(e){console.error('Saving practice data failed',e);return false;}}
export function createRecord(kind,payload){return {id:uid(),kind,payload,created_at:new Date().toISOString()};}
export function addRecord(state,kind,payload){const r=createRecord(kind,payload);state.records.push(r);saveState(state);return r;}
export function mergeRecords(state,incoming=[]){const ids=new Set(state.records.map(r=>r.id));let added=0;for(const r of incoming){if(r?.id&&r?.kind&&r?.created_at&&!ids.has(r.id)){state.records.push({id:r.id,kind:r.kind,payload:r.payload||{},created_at:r.created_at});ids.add(r.id);added++;}}if(added){state.records.sort((a,b)=>a.created_at.localeCompare(b.created_at));saveState(state);}return added;}
export function downloadText(filename,contents,type='text/plain'){const blob=new Blob([contents],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function validRatingPercent(payload){
 const value=payload?.ratingPct;
 return Number.isInteger(value)&&value>=0&&value<=100&&value%10===0?value:null;
}
export function isHighQualityDrill(payload){
 const pct=validRatingPercent(payload);
 // Older 3-level feedback is preserved exactly; 'clean' is never assigned
 // a fabricated numeric equivalent.
 return pct===null?payload?.rating==='clean':pct>=90;
}
export function ratingDisplay(payload){
 const pct=validRatingPercent(payload);
 return pct===null?(payload?.rating?String(payload.rating)+' (legacy)':'—'):pct+'%';
}
function csvCell(v){return '"'+String(v??'').replaceAll('"','""')+'"';}
export function exportCsv(state){const headers=['date','kind','exercise','song','key','tempo_bpm','minutes','rating','rating_percent','issue','notes'];const rows=state.records.map(r=>{
 const p=r.payload||{};return [r.created_at,r.kind,p.drillId||'',p.songId||'',p.key||'',p.bpm??p.tempo??'',p.seconds?Math.round(p.seconds/60*100)/100:p.durationMinutes??'',p.rating||'',validRatingPercent(p)??'',p.issue||'',p.notes||''].map(csvCell).join(',');});return [headers.join(','),...rows].join('\r\n');}
export function importedSnapshot(state, snapshot){const rows=snapshot?.records;if(!Array.isArray(rows))throw new Error('This file does not contain a practice records array.');if(rows.length>100000)throw new Error('Import is too large.');return mergeRecords(state,rows);}
export function weeklyReport(state,days=7){
 const since=Date.now()-days*86400000;
 const records=state.records.filter(r=>Date.parse(r.created_at)>=since);
 const sessions=records.filter(r=>r.kind==='session');
 const drills=records.filter(r=>r.kind==='drill');
 const songs=records.filter(r=>r.kind==='song');
 const duration=sessions.reduce((a,r)=>a+(Number(r.payload?.durationMinutes)||0),0);
 const keys=[...new Set(sessions.map(r=>r.payload?.key).filter(Boolean))];
 const legacy={clean:0,almost:0,retry:0};
 const issues={},byDrill={},scores=[];
 for(const r of drills){
  const p=r.payload||{},pct=validRatingPercent(p);
  if(pct!==null)scores.push(pct);
  else if(p.rating in legacy)legacy[p.rating]++;
  if(p.issue&&p.issue!=='none')issues[p.issue]=(issues[p.issue]||0)+1;
  const id=p.drillId||'unknown';
  (byDrill[id]??=[]).push({bpm:Number(p.bpm),pct,legacy:p.rating||'',key:p.key||'',subdivision:p.subdivision||'quarter',position:p.position||'low'});
 }
 const mean=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
 const high=scores.filter(n=>n>=90).length;
 const top=Object.entries(byDrill).map(([name,attempts])=>{
  const qualified=attempts.filter(x=>(x.pct!==null?x.pct>=90:x.legacy==='clean')&&Number.isFinite(x.bpm)&&x.bpm>0);
  const peak=qualified.length?Math.max(...qualified.map(x=>x.bpm)):null;
  const ratings=attempts.filter(x=>x.pct!==null).map(x=>x.pct);
  const avg=ratings.length?Math.round(ratings.reduce((a,b)=>a+b,0)/ratings.length):null;
  const distinct=new Set(attempts.map(x=>x.key+' / '+x.subdivision+' / '+x.position));
  return name+': '+attempts.length+' attempt(s), '+(avg===null?'no percentage rating yet':'avg '+avg+'% across '+ratings.length+' rated attempt(s)')+
   (peak===null?'':'; best qualifying tempo '+peak+' BPM')+
   '; contexts '+[...distinct].join(', ');
 });
 const notes=sessions.filter(s=>s.payload?.notes).slice(-6).map(s=>'- '+(s.payload.key||'—')+': '+s.payload.notes);
 return [
 '# Guitar Practice Lab — weekly review',
 'Generated: '+new Date().toLocaleDateString()+'. Period: last '+days+' days.',
 'Completed sessions: '+sessions.length+'; practice minutes reported: '+duration+'; drills logged: '+drills.length+'; song entries: '+songs.length+'.',
 'Keys practiced: '+(keys.join(', ')||'none recorded')+'.',
 'Self-assessed execution quality (10% steps): '+(mean===null?'no numeric ratings yet':mean+'% average across '+scores.length+' rated drills')+'. '+high+' rated at 90–100%.',
 'Historical 3-level ratings (not converted into percentages): clean '+legacy.clean+', mostly clean '+legacy.almost+', needs work '+legacy.retry+'.',
 'Reported issues: '+(Object.entries(issues).sort((a,b)=>b[1]-a[1]).map(([n,c])=>n+' ('+c+')').join(', ')||'none')+'.',
 '## Drill data',...(top.length?top.map(x=>'- '+x):['- No drills recorded.']),
 '## Session notes',...(notes.length?notes:['- No session notes.']),
 '## What I want ChatGPT to do',
 'Identify two actionable priorities for next week. Recommend small changes to the 45-minute plan based on the recorded data. Treat percentages as subjective quality estimates, not measured accuracy. Do not equate legacy clean/mostly-clean/needs-work labels to numeric percentages or compare different keys/subdivisions/positions as interchangeable.'
 ].join('\n');
}
export class CloudSync{
 constructor({state,onUpdate,onStatus}){this.state=state;this.onUpdate=onUpdate;this.onStatus=onStatus;this.client=null;this.user=null;this.busy=false;this.lastError='';this.configId='';}
 status(msg,kind='info'){this.onStatus?.(msg,kind);}
 get configured(){return Boolean(this.state.cloud?.url&&this.state.cloud?.key);}
 async init(){if(!this.configured){this.status('Local only — cloud not configured');return;}const cfgId=this.state.cloud.url+'|'+this.state.cloud.key;if(this.client&&this.configId===cfgId)return;try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const url=this.state.cloud.url.trim(),key=this.state.cloud.key.trim();if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url))throw Error('Use the complete https://…supabase.co Project URL.');
  this.client=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});this.configId=cfgId;
  this.client.auth.onAuthStateChange((_event,session)=>{this.user=session?.user||null;this.status(this.user?'Signed in — ready to sync':'Cloud configured — sign in required');this.onUpdate?.();if(this.user)setTimeout(()=>this.sync(),150);});
  const {data,error}=await this.client.auth.getSession();if(error)throw error;this.user=data.session?.user||null;this.status(this.user?'Cloud connected':'Cloud configured — sign in required');this.onUpdate?.();if(this.user)await this.sync();
 }catch(e){this.lastError=String(e.message||e);this.status('Cloud connection error: '+this.lastError,'error');}}
 async signIn(email){if(!this.client)await this.init();if(!this.client)throw Error('Configure the cloud connection first.');
  if(!/^\S+@\S+\.\S+$/.test(email))throw Error('Enter a valid email address.');
  const target=location.origin+location.pathname;
  const {error}=await this.client.auth.signInWithOtp({email,options:{emailRedirectTo:target}});if(error)throw error;
  this.status('Sign-in link requested. Check your email (including spam).');
 }
 async signOut(){if(!this.client)return;const {error}=await this.client.auth.signOut();if(error)throw error;this.user=null;this.status('Signed out. Local records remain on this device.');this.onUpdate?.();}
 async publishOptedInFeedback(){
  if(!this.user||!this.client)return;
  const consented=this.state.records.filter(r=>r.kind==='drill'&&r.payload?.publicFeedbackConsent===true
    &&typeof r.payload?.appFeedback==='string'&&r.payload.appFeedback.trim()
    &&typeof r.payload?.publicFeedbackId==='string');
  if(!consented.length)return;
  let submitted=0;
  for(let start=0;start<consented.length;start+=75){
   const batch=consented.slice(start,start+75),ids=batch.map(r=>r.payload.publicFeedbackId);
   const {data,error}=await this.client.from('app_feedback_queue').select('id').in('id',ids);
   if(error)throw Error('Run supabase-feedback-queue.sql in your Supabase SQL Editor: '+error.message);
   const existing=new Set((data||[]).map(row=>row.id));
   const rows=batch.filter(r=>!existing.has(r.payload.publicFeedbackId)).map(r=>({
    id:r.payload.publicFeedbackId,user_id:this.user.id,
    drill_id:String(r.payload.drillId||'general').slice(0,160),
    category:['general','instructions','diagram','fingering','timing','other'].includes(r.payload.appFeedbackType)?r.payload.appFeedbackType:'general',
    message:r.payload.appFeedback.trim().slice(0,1200),publication_consent:true,created_at:r.created_at
   }));
   if(rows.length){
    const {error:insertError}=await this.client.from('app_feedback_queue').insert(rows);
    if(insertError&&insertError.code!=='23505')throw insertError;
    submitted+=rows.length;
   }
  }
  if(submitted)this.status('Practice cloud saved · '+submitted+' development suggestion(s) submitted','success');
 }
 async sync(){if(this.busy||!this.user||!this.client)return;this.busy=true;this.status('Syncing…');try{
  const remote=[];let from=0;for(let page=0;page<100;page++){const {data,error}=await this.client.from('practice_records').select('id,kind,payload,created_at').order('created_at',{ascending:true}).range(from,from+499);if(error)throw error;remote.push(...(data||[]));if(!data||data.length<500)break;from+=500;}
  const remoteIds=new Set(remote.map(r=>r.id));const received=mergeRecords(this.state,remote);
  const missing=this.state.records.filter(r=>!remoteIds.has(r.id));for(let i=0;i<missing.length;i+=150){const batch=missing.slice(i,i+150).map(r=>({...r,user_id:this.user.id}));const {error}=await this.client.from('practice_records').upsert(batch,{onConflict:'id'});if(error)throw error;}
  this.status(`Cloud saved · ${received} record(s) received${missing.length?', '+missing.length+' uploaded':''}`,'success');if(received)this.onUpdate?.();
  try{await this.publishOptedInFeedback();}catch(e){this.status('Practice cloud saved; public feedback pending: '+String(e.message||e),'error');}
 }catch(e){this.lastError=String(e.message||e);this.status('Offline or sync failed: '+this.lastError,'error');}finally{this.busy=false;}}
}
