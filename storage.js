const KEY='guitar-practice-lab-v1';
export const uid=()=>globalThis.crypto?.randomUUID?.()||('gpl-'+Date.now()+'-'+Math.random().toString(36).slice(2));
export function defaultState(){return {version:1,records:[],active:null,settings:{theme:'dark',defaultBpm:70,selectedMode:'technique',selectedSong:'autumn-leaves',selectedKey:'auto',diagram:'tab',labels:'note',position:'low',subdivision:'quarter',meter:'4/4'},cloud:{url:'',key:''}};}
export function loadState(){try{const raw=localStorage.getItem(KEY);if(!raw)return defaultState();const parsed=JSON.parse(raw);const d=defaultState();return {...d,...parsed,settings:{...d.settings,...(parsed.settings||{})},cloud:{...d.cloud,...(parsed.cloud||{})},records:Array.isArray(parsed.records)?parsed.records:[]};}catch{return defaultState();}}
export function saveState(s){try{localStorage.setItem(KEY,JSON.stringify(s));return true;}catch(e){console.error('Saving practice data failed',e);return false;}}
export function createRecord(kind,payload){return {id:uid(),kind,payload,created_at:new Date().toISOString()};}
export function addRecord(state,kind,payload){const r=createRecord(kind,payload);state.records.push(r);saveState(state);return r;}
export function mergeRecords(state,incoming=[]){const ids=new Set(state.records.map(r=>r.id));let added=0;for(const r of incoming){if(r?.id&&r?.kind&&r?.created_at&&!ids.has(r.id)){state.records.push({id:r.id,kind:r.kind,payload:r.payload||{},created_at:r.created_at});ids.add(r.id);added++;}}if(added){state.records.sort((a,b)=>a.created_at.localeCompare(b.created_at));saveState(state);}return added;}
export function downloadText(filename,contents,type='text/plain'){const blob=new Blob([contents],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function csvCell(v){return '"'+String(v??'').replaceAll('"','""')+'"';}
export function exportCsv(state){const headers=['date','kind','exercise','song','key','tempo_bpm','minutes','rating','issue','notes'];const rows=state.records.map(r=>{
 const p=r.payload||{};return [r.created_at,r.kind,p.drillId||'',p.songId||'',p.key||'',p.bpm??p.tempo??'',p.seconds?Math.round(p.seconds/60*100)/100:p.durationMinutes??'',p.rating||'',p.issue||'',p.notes||''].map(csvCell).join(',');});return [headers.join(','),...rows].join('\r\n');}
export function importedSnapshot(state, snapshot){const rows=snapshot?.records;if(!Array.isArray(rows))throw new Error('This file does not contain a practice records array.');if(rows.length>100000)throw new Error('Import is too large.');return mergeRecords(state,rows);}
export function weeklyReport(state,days=7){
 const since=Date.now()-days*86400000;const records=state.records.filter(r=>Date.parse(r.created_at)>=since);const sessions=records.filter(r=>r.kind==='session');const drills=records.filter(r=>r.kind==='drill');const songs=records.filter(r=>r.kind==='song');
 const duration=sessions.reduce((a,r)=>a+(Number(r.payload?.durationMinutes)||0),0);const keys=[...new Set(sessions.map(r=>r.payload?.key).filter(Boolean))];
 const countRatings={clean:0,almost:0,retry:0};const issues={};const tempos={};
 for(const r of drills){const p=r.payload||{};if(p.rating in countRatings)countRatings[p.rating]++;if(p.issue&&p.issue!=='none')issues[p.issue]=(issues[p.issue]||0)+1;if(!tempos[p.drillId])tempos[p.drillId]=[];tempos[p.drillId].push({bpm:p.bpm, rating:p.rating,key:p.key});}
 const sortedIssues=Object.entries(issues).sort((a,b)=>b[1]-a[1]);
 const topTempos=Object.entries(tempos).map(([name,entries])=>{const clean=entries.filter(e=>e.rating==='clean').map(e=>Number(e.bpm)).filter(Number.isFinite);return clean.length?`${name}: best clean ${Math.max(...clean)} BPM (${entries.length} attempts, keys: ${[...new Set(entries.map(e=>e.key))].join(', ')})`:`${name}: ${entries.length} attempts, no clean rating yet`;});
 return [
  '# Guitar Practice Lab — weekly review',
  `Generated: ${new Date().toLocaleDateString()}. Period: last ${days} days.`,
  `Completed sessions: ${sessions.length}; planned practice minutes completed/reported: ${duration}; drills logged: ${drills.length}; song entries: ${songs.length}.`,
  `Keys practiced: ${keys.join(', ')||'none recorded'}.`,
  `Self-ratings: clean ${countRatings.clean}, mostly clean ${countRatings.almost}, needs work ${countRatings.retry}.`,
  `Reported issues: ${sortedIssues.map(([i,n])=>`${i} (${n})`).join(', ')||'none'}.`,
  '## Drill data',...(topTempos.length?topTempos.map(s=>'- '+s):['- No drills recorded.']),
  '## Session notes',...(sessions.filter(s=>s.payload?.notes).slice(-6).map(s=>'- '+s.payload.key+': '+s.payload.notes)||[]),
  '## What I want ChatGPT to do',
  'Identify two actionable priorities for next week. Recommend small changes to the 45-minute plan based on the recorded data. Avoid comparing tempos across different subdivisions, keys or exercises as if they were equivalent; recognize that precision ratings are self-reported.',
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
 async sync(){if(this.busy||!this.user||!this.client)return;this.busy=true;this.status('Syncing…');try{
  const remote=[];let from=0;for(let page=0;page<100;page++){const {data,error}=await this.client.from('practice_records').select('id,kind,payload,created_at').order('created_at',{ascending:true}).range(from,from+499);if(error)throw error;remote.push(...(data||[]));if(!data||data.length<500)break;from+=500;}
  const remoteIds=new Set(remote.map(r=>r.id));const received=mergeRecords(this.state,remote);
  const missing=this.state.records.filter(r=>!remoteIds.has(r.id));for(let i=0;i<missing.length;i+=150){const batch=missing.slice(i,i+150).map(r=>({...r,user_id:this.user.id}));const {error}=await this.client.from('practice_records').upsert(batch,{onConflict:'id'});if(error)throw error;}
  this.status(`Cloud saved · ${received} record(s) received${missing.length?', '+missing.length+' uploaded':''}`,'success');if(received)this.onUpdate?.();
 }catch(e){this.lastError=String(e.message||e);this.status('Offline or sync failed: '+this.lastError,'error');}finally{this.busy=false;}}
}
