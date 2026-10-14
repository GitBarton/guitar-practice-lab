import {APP_VERSION,KEYS,CATEGORIES,SONGS,DRILLS,DRILL_BY_ID,REFERENCES,REFERENCE_BY_ID,RELEASE_NOTES,SESSION_DURATIONS,SESSION_MODES,stageCount,currentStage,clampedStageIndex,makeSession} from './data.js';
import {CAGED_REGIONS,positionForMode} from './mode-positions.js';
import {harmonizeSelectedMode} from './modal-harmony.js';
import {buildExample,renderTabSvg,renderFretboardSvg,shellShapes,chordDiagramSvg,progressionFor,enclosureGuide,enclosureInstructions,escapeHtml as e,pitchName,keyPc,INTERVALS,buildNotePath} from './music.js';
import {ARTIST_PROFILES,VOCAB_STUDIES,vocabularyNotes} from './vocabulary.js';
import {renderStaffTabSvg} from './staff-notation.js';
import {referenceStudyNotes} from './reference-studies.js';
import {SongTrackPlayer,songClock} from './song-audio.js';
import {MODE_FAMILIES,MODE_DEFINITIONS,scaleFor,diatonicSevenths,scaleTabTargets} from './theory-lab.js';
import {OPEN_STRING_PITCHES,PITCH_CHOICES,pitchFrequency,registerTempoTap,ReferencePitchPlayer} from './reference-pitch.js';
import {referencePentatonicBox,referencePentatonicSkip,referenceDominant7} from './reference-patterns.js';
import {completeSongLibrary,manualSongs,newCustomSong,SONG_METERS,CUSTOM_SONG_KIND} from './manual-songs.js';
import {buildTwoFiveOne,clampHarmonyTempo} from './harmony.js';
import {ChordBacking} from './backing-audio.js';
import {loadState,saveState,addRecord,uid,weeklyReport,downloadText,exportCsv,importedSnapshot,validRatingPercent,isHighQualityDrill,ratingDisplay,CloudSync} from './storage.js';
const state=loadState();
// Public URL/key defaults survive browser-site-data deletion. The private auth session does not.
const allSongs=()=>completeSongLibrary(state.records);
const publishedCloud=window.GPL_CONFIG||{};
if((!state.cloud?.url||!state.cloud?.key)&&(publishedCloud.supabaseUrl||publishedCloud.supabaseKey)){
 state.cloud={url:state.cloud?.url||publishedCloud.supabaseUrl||'',key:state.cloud?.key||publishedCloud.supabaseKey||''};
 saveState(state);
}
document.body.dataset.theme=state.settings.theme;
const songTrackPlayer=new SongTrackPlayer(()=>updateSongTrackUI());
const referencePitch=new ReferencePitchPlayer();
let selectedHomePitch=45,homeTempoTaps=[];
const harmonySettings=Object.assign({key:'C',mode:'major',tempo:72,barsPerChord:2,volume:.7,reverb:.42,click:false},state.settings.harmony||{});
let harmonyPosition=null,harmonyStarted=0,harmonyElapsed=0;
const harmonyBacking=new ChordBacking(position=>{harmonyPosition=position;updateHarmonyUI();});
let showRating=false,diagramStep=-1,ratingPercent=80,cloudMessage='Local only · records saved in this browser',cloudKind='info';let toastTimeout=0;
const $=id=>document.getElementById(id);
const safe=(s)=>e(s??'');
const categoryTitle=cat=>CATEGORIES.find(c=>c[0]===cat)?.[1]||cat;
let selectedDrillCategory='all',drillSearchText='';
let pentatonicBox=1,dominantRootString='E';
const categoryCount=cat=>cat==='all'?DRILLS.length:DRILLS.filter(d=>d.category===cat).length;
const iconPaths={home:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',play:'<path d="m8 5 11 7-11 7z"/>',pause:'<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>',music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',library:'<path d="M4 5h5v16H4zM10 3h5v18h-5zM16 7h4v14h-4z"/>',book:'<path d="M12 7c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V6c-4-1-7-1-10 1zM12 7v14"/>',chart:'<path d="M4 20V10h4v10zM10 20V4h4v16zM16 20v-7h4v7z"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',check:'<path d="m4 12 5 5L20 6"/>',chevron:'<path d="m9 18 6-6-6-6"/>',minus:'<path d="M5 12h14"/>',plus:'<path d="M12 5v14M5 12h14"/>',cloud:'<path d="M4 16a4 4 0 0 1 1-8 7 7 0 0 1 13 2 4 4 0 0 1 1 8H5"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3"/>',refresh:'<path d="M20 11a8 8 0 0 0-14-5L3 9m0-5v5h5M4 13a8 8 0 0 0 14 5l3-3m0 5v-5h-5"/>',headphones:'<path d="M3 15V12a9 9 0 0 1 18 0v3M3 15h5v6H5a2 2 0 0 1-2-2v-4zm18 0h-5v6h3a2 2 0 0 0 2-2v-4z"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',upload:'<path d="M12 21V9m-5 5 5-5 5 5M4 6V3h16v3"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'};
const ic=(name)=>`<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24">${iconPaths[name]||iconPaths.target}</svg></span>`;
const btn=(action,label,cls='')=>`<button type="button" class="btn ${cls}" data-action="${action}">${label}</button>`;
const tag=(s,special=false)=>`<span class="pill${special?' special':''}">${safe(s)}</span>`;
const rect=(title,description,action)=>`<a class="list-row" href="${action}"><span class="row-main"><div class="row-title">${safe(title)}</div><div class="row-desc">${safe(description)}</div></span>${ic('chevron')}</a>`;
const nav=[['today','Today','home'],['modes','Modes & Harmony','music'],['vocabulary','Jazz Masters','music'],['practice','Practice','play'],['songs','Songs','music'],['harmony','ii–V–I Zone','music'],['drills','Drills','library'],['references','References','book'],['progress','Progress','chart']];
let currentHash='';
function route(){const parts=decodeURIComponent(location.hash.replace(/^#/,'')||'today').split('/');return {page:parts[0],id:parts.slice(1).join('/')};}
function setRoute(r){if(location.hash==='#'+r){render();return;}location.hash=r;}
function pageHeader(eyebrow,title,subtitle,right=''){return `<div class="page-head"><div><div class="eyebrow">${safe(eyebrow)}</div><h1>${safe(title)}</h1><p>${safe(subtitle)}</p></div>${right}</div>`;}
function countSessions(){return state.records.filter(r=>r.kind==='session'&&!r.payload?.isFree).length;}
function lastSeven(){const since=Date.now()-7*86400000;return state.records.filter(r=>Date.parse(r.created_at)>=since);}
function latestSong(songId){return state.records.filter(r=>r.kind==='song'&&r.payload?.songId===songId).sort((a,b)=>b.created_at.localeCompare(a.created_at))[0]?.payload;}
function todayKey(){return state.settings.selectedKey==='auto'?KEYS[countSessions()%KEYS.length]:state.settings.selectedKey;}
function showToast(msg){const el=$('toast');if(!el)return;clearTimeout(toastTimeout);el.textContent=msg;el.className='visible';toastTimeout=setTimeout(()=>{el.className='';},3200);}
const cloud=new CloudSync({state,onUpdate:()=>render(),onStatus:(m,k)=>{cloudMessage=m;cloudKind=k;const msg=$('cloud-status');if(msg){msg.textContent=m;msg.className='status '+k;}const side=$('sidebar-status');if(side){side.textContent=m;}}});
function shell(content){const r=route(),active=['today','practice','songs','harmony','modes','vocabulary','drills','references','progress'].includes(r.page)?r.page:(r.page==='drill'?'drills':r.page==='song'?'songs':r.page==='reference'?'references':'today');
 const navHTML=nav.map(([href,text,icon])=>`<a href="#${href}" class="nav-item ${active===href?'active':''}" ${active===href?'aria-current="page"':''}><span class="nav-ic">${ic(icon)}</span>${text}</a>`).join('');
 return `<div class="shell"><aside class="sidebar"><a href="#today" class="brand route-link"><span class="brand-mark"><img class="brand-guitar" src="./icon.svg" alt="" width="48" height="48" /></span><div><div class="brand-title">Guitar Practice Lab</div><div class="brand-small">Music · Precision · Flow</div></div></a><nav class="nav" aria-label="Main navigation">${navHTML}</nav><div class="side-bottom"><div class="small"><span class="sync-pip ${cloud.user?'good':''}"></span>Practice data</div><p id="sidebar-status">${safe(cloudMessage)}</p><a href="#settings">${ic('settings')} &nbsp; Settings & cloud</a></div></aside><div class="main-wrap"><div class="topbar"><div><span class="eyebrow">Practice Workspace</span></div><div class="top-right">${state.active?tag('Session in progress',true):''}<a href="#releases" class="pill release-link" title="View release notes">v${APP_VERSION} · What's new</a><a class="btn small ghost" href="#settings">${ic('settings')}<span class="desktop-only">Settings</span></a></div></div><main class="page" id="main-content">${content}</main></div></div>`;
}
function render(){document.body.dataset.theme=state.settings.theme;const r=route();if(r.page!=='today')referencePitch.stop();let html='';
 switch(r.page){case 'today':html=renderToday();break;case 'practice':html=renderPractice();break;case 'drills':html=renderDrills();break;case 'drill':html=renderDrillDetail(r.id);break;case 'songs':html=renderSongs();break;case 'harmony':html=renderHarmony();break;case 'modes':html=renderModesLab();break;case 'vocabulary':html=renderVocabularyLab();break;case 'song':html=renderSongDetail(r.id);break;case 'references':html=renderReferences();break;case 'reference':html=renderReferenceDetail(r.id);break;case 'progress':html=renderProgress();break;case 'releases':html=renderReleases();break;case 'settings':html=renderSettings();break;default:html=renderToday();}
 $('app').innerHTML=shell(html);updateClock();updateSongTrackUI();if(r.page==='drills')filterDrills();}
function queueOverview(s){return `<div class="list">${s.entries.map((entry,i)=>{const d=DRILL_BY_ID[entry.id];return `<div class="step-row ${entry.done?'done':''}"><div class="step-n">${entry.done?'✓':i+1}</div><div class="step-info"><div class="step-name">${safe(d?.title||'Song practice')}</div><div class="step-min">${safe(d?.category?categoryTitle(d.category):'Repertoire')} · ${entry.minutes} min</div></div><span class="small muted">${entry.minutes}:00</span></div>`;}).join('')}</div>`;}
function renderHomeMusicTools(){
 const selected=PITCH_CHOICES.find(p=>p.midi===selectedHomePitch)||PITCH_CHOICES[5];
 const frequency=pitchFrequency(selected.midi).toFixed(2);
 return `<section class="home-music-tools" aria-label="Quick music tools">
  <div class="card home-music-card">
   <div class="home-music-head"><div><div class="eyebrow">Tune by ear</div><h2>Reference pitch</h2></div><span class="home-music-icon" aria-hidden="true">${ic('music')}</span></div>
   <div class="home-pitch-current"><strong id="home-pitch-note">${safe(selected.label)}</strong><span id="home-pitch-hz">${frequency} Hz</span></div>
   <div class="home-string-buttons" role="group" aria-label="Guitar open-string reference pitches">
     ${OPEN_STRING_PITCHES.map(p=>`<button type="button" class="home-string-button ${selectedHomePitch===p.midi?'active':''}" data-action="home-pitch:${p.midi}" aria-pressed="${selectedHomePitch===p.midi}" title="Hear string ${p.string}: ${safe(p.id)}"><strong>${safe(p.id)}</strong><small>${safe(p.label)}</small></button>`).join('')}
   </div>
   <div class="home-pitch-controls"><div class="form-group"><label for="home-chromatic-note">Chromatic pitch (A4 = 440 Hz)</label>
      <select id="home-chromatic-note" data-home-pitch-select aria-label="Select chromatic reference note">${PITCH_CHOICES.map(p=>`<option value="${p.midi}" ${selectedHomePitch===p.midi?'selected':''}>${safe(p.label)}</option>`).join('')}</select></div>
      <button type="button" class="btn ${referencePitch.playing?'warn':'primary'}" data-action="home-pitch-play" aria-pressed="${referencePitch.playing}">${referencePitch.playing?'■ Stop tone':'▶ Play tone'}</button></div>
   <p class="home-tool-explain">A generated tuning note only. <strong>No microphone, recording or listening.</strong> Turn your device volume down before playing.</p>
  </div>
  <div class="card home-music-card">
   <div class="home-music-head"><div><div class="eyebrow">Keep time</div><h2>Metronome</h2></div><span class="home-music-icon" aria-hidden="true">${ic('clock')}</span></div>
   <div class="home-metro-display"><strong id="home-metronome-bpm">${Number(state.settings.defaultBpm)||70}</strong><span>BPM</span><span class="home-metro-indicator ${metronome.playing?'playing':''}" aria-label="${metronome.playing?'Metronome running':'Metronome stopped'}"></span></div>
   <div class="home-metro-buttons">
     <button type="button" class="btn" data-action="home-bpm-down" aria-label="Decrease tempo 5 BPM">−5</button>
     <button type="button" class="btn ${metronome.playing?'warn':'primary'}" data-action="home-metro-play" aria-pressed="${metronome.playing}">${metronome.playing?'■ Stop click':'▶ Start click'}</button>
     <button type="button" class="btn" data-action="home-bpm-up" aria-label="Increase tempo 5 BPM">+5</button>
     <button type="button" class="btn ghost" data-action="home-bpm-tap">Tap tempo</button>
   </div>
   <div class="home-metro-selectors">
    <div class="form-group"><label for="home-metronome-meter">Meter</label><select id="home-metronome-meter" data-setting="meter"><option value="4/4" ${state.settings.meter==='4/4'?'selected':''}>4/4</option><option value="6/8" ${state.settings.meter==='6/8'?'selected':''}>6/8</option></select></div>
    <div class="form-group"><label for="home-metronome-subdivision">Subdivision</label><select id="home-metronome-subdivision" data-setting="subdivision"><option value="quarter" ${state.settings.subdivision==='quarter'?'selected':''}>Quarter pulse</option><option value="swing" ${state.settings.subdivision==='swing'?'selected':''}>Swing</option><option value="triplet" ${state.settings.subdivision==='triplet'?'selected':''}>Triplets</option></select></div>
   </div>
   <p class="home-tool-explain">Uses the same metronome and BPM as Practice. Tap steadily at least twice to set your tempo.</p>
  </div>
 </section>`;
}
function renderToday(){const complete=countSessions(),recent=lastSeven(),sessions=recent.filter(r=>r.kind==='session'),minutes=sessions.reduce((x,s)=>x+(Number(s.payload?.durationMinutes)||0),0),pctScores=recent.filter(r=>r.kind==='drill').map(r=>validRatingPercent(r.payload)).filter(n=>n!==null),avgQuality=pctScores.length?Math.round(pctScores.reduce((a,b)=>a+b,0)/pctScores.length):null;
 const mode=state.settings.selectedMode,duration=SESSION_DURATIONS.includes(Number(state.settings.selectedDuration))?Number(state.settings.selectedDuration):45,preview=makeSession(complete,mode,state.settings.selectedSong,duration);if(state.settings.selectedKey!=='auto')preview.key=state.settings.selectedKey;
 const modeLabel=SESSION_MODES.find(([id])=>id===mode)?.[1]||'Technique';
 const planDuration=state.active?state.active.entries.reduce((sum,e)=>sum+e.minutes,0):preview.durationMinutes;
 const top=state.active?`<section class="hero"><div class="eyebrow">Resume where you left off</div><h2>Session in progress · ${safe(state.active.key)}</h2><p>${planDuration} minutes planned · ${safe(SESSION_MODES.find(([id])=>id===state.active.mode)?.[1]||'Practice')} · your progress is saved locally.</p><div class="buttons">${btn('resume-session',`${ic('play')} Resume practice`,'primary')}</div></section>`:`<section class="hero"><div class="eyebrow">A session built around your focus</div><h2>${safe(modeLabel)} · ${duration} minutes</h2><p>Your plan combines ${preview.entries.length} focused blocks in ${safe(preview.key)}. Choose the duration and type of work you want to prioritize.</p><div class="buttons">${btn('start-session',`${ic('play')} Start ${duration}-minute session`,'primary')}${tag('Day '+(complete+1)+' · '+modeLabel)}</div></section>`;
 return `${pageHeader('Home','Ready to practice?','A consistent system for technique, jazz language and live repertoire.')}
 <div class="metrics"><div class="metric"><div class="label">Sessions · last 7 days</div><div class="number">${sessions.length}</div></div><div class="metric"><div class="label">Minutes · last 7 days</div><div class="number">${minutes}</div></div><div class="metric"><div class="label">Average quality · last 7 days</div><div class="number">${avgQuality===null?'—':avgQuality+'%'}</div><div class="micro muted">${pctScores.length} percentage rating(s)</div></div></div>
 ${renderHomeMusicTools()}
 <div class="grid-main"><div>${top}<div style="height:20px"></div><div class="card"><div class="card-header"><h2>Today's ${planDuration}-minute plan</h2>${tag('Key '+preview.key,true)}</div>${queueOverview(state.active||preview)}</div></div>
 <aside class="card"><div class="card-header"><h3>Session setup</h3>${ic('target')}</div><div class="form-group"><label for="mode">Practice mode</label><select id="mode" data-setting="selectedMode" ${state.active?'disabled':''}>${SESSION_MODES.map(([id,label])=>`<option value="${id}" ${mode===id?'selected':''}>${safe(label)}</option>`).join('')}</select></div><div class="form-group" style="margin-top:13px"><label for="duration">Session length</label><select id="duration" data-setting="selectedDuration" ${state.active?'disabled':''}>${SESSION_DURATIONS.map(n=>`<option value="${n}" ${duration===n?'selected':''}>${n} minutes${n===45?' · original':''}</option>`).join('')}</select></div><div class="form-group" style="margin-top:13px"><label for="key">Primary key</label><select id="key" data-setting="selectedKey" ${state.active?'disabled':''}><option value="auto" ${state.settings.selectedKey==='auto'?'selected':''}>Auto · circle of fourths</option>${KEYS.map(k=>`<option value="${k}" ${state.settings.selectedKey===k?'selected':''}>${k}</option>`).join('')}</select></div><div class="form-group" style="margin-top:13px"><label for="song">Repertoire focus</label><select id="song" data-setting="selectedSong" ${state.active?'disabled':''}>${allSongs().map(s=>`<option value="${s.id}" ${state.settings.selectedSong===s.id?'selected':''}>${safe(s.title)}</option>`).join('')}</select></div><div class="divider"></div><div class="eyebrow">Key rotation</div><div class="key-grid" style="margin-top:12px">${KEYS.map((k,i)=>`<div class="key-tile ${preview.key===k?'current':''}">${k.replace('b','♭')}</div>`).join('')}</div><p class="footnote">One primary key per practice day. A full rotation takes 12 sessions; override the key when needed.</p></aside></div>`;
}
function referencePattern(d,key){
 if(d?.category==='pentatonic'&&['pentMajor','pentMinor'].includes(d.quality))
  return d.id==='penta-string'?referencePentatonicSkip(key,d.quality,pentatonicBox):referencePentatonicBox(key,d.quality,pentatonicBox);
 if(d?.id==='arp-dom7')return referenceDominant7(key,dominantRootString);
 return null;
}
function drillDiagramNotes(d,key,stage){
 const study=referenceStudyNotes(d?.id,key);if(study)return study;
 return referencePattern(d,key)?.notes||buildExample(stage?.exampleKind||d.kind,key,d.quality||'maj7',d.octaves||2,state.settings.position);
}
function referencePatternControls(d,key){
 const pattern=referencePattern(d,key);
 if(!pattern)return '';
 const choice=d.category==='pentatonic'
 ? `<div role="group" aria-label="Five reference pentatonic boxes" class="buttons">${[1,2,3,4,5].map(i=>`<button type="button" class="btn small ${i===pentatonicBox?'primary':''}" data-action="pentatonic-box:${i}" aria-pressed="${i===pentatonicBox}">Box ${i}</button>`).join('')}</div>`
 :`<div role="group" aria-label="Dominant arpeggio root string" class="buttons">${['E','A'].map(root=>`<button type="button" class="btn small ${root===dominantRootString?'primary':''}" data-action="dom-root:${root}" aria-pressed="${root===dominantRootString}">Root on ${root} string</button>`).join('')}</div>`;
 return `<section class="reference-pattern-panel"><div class="eyebrow">Reference-backed guitar route · ${safe(key)}</div>
 ${choice}<p class="small muted">${safe(pattern.caption)} Fret range: ${pattern.fretRange.join('–')}.</p>
 ${d.category==='pentatonic'&&pentatonicBox===1?'<p class="micro muted">Box 1 fretting guide: finger 1 = index, 3 = ring, 4 = pinky where reachable comfortably. Never force painful stretches.</p>':''}
 </section>`;
}
function guitarNotationKey(){
 const p=route().page;
 if(p==='modes')return modalKey;
 if(p==='vocabulary')return vocabularyKey;
 if(p==='harmony')return harmonySettings.key;
 if(state.active?.key)return state.active.key;
 return state.settings.selectedKey!=='auto'?state.settings.selectedKey:todayKey();
}
function renderGuitarStaff(notes,active=-1){return renderStaffTabSvg(notes,guitarNotationKey(),active);}
function progressSvg(notes,pulse=false){const focus=pulse&&diagramStep<0?0:diagramStep;return `<div class="diagram-viewport ${pulse?'target-tone-display':''}" id="diagram-container">${state.settings.diagram==='fretboard'?renderFretboardSvg(notes,focus,state.settings.labels):renderGuitarStaff(notes,focus)}</div>`;}
function chordBlocks(key){return `<div class="grid-2">${shellShapes(key).map(c=>`<div style="background:var(--panel2);padding:12px;border-radius:12px;min-width:0"><div class="small muted">${c.label}</div><h3>${safe(c.name)}</h3><div class="diagram-viewport" style="padding:0;min-height:0;border:0">${chordDiagramSvg(c)}</div></div>`).join('')}</div><p class="footnote">These are transposable shell-voicing examples. Some keys use higher positions; choose a comfortable octave and mute each X string.</p>`;}
function progressionPills(key){return `<div class="buttons">${progressionFor(key).map(p=>`<span class="pill special">${p.role} · ${safe(p.name)}</span>`).join('')}</div>`;}
function clockMs(){const a=state.active;if(!a)return 0;return Math.max(0,(a.elapsedMs||0)+(a.startedAt?Date.now()-a.startedAt:0));}
function formatSeconds(seconds){seconds=Math.max(0,Math.floor(seconds));return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
function updateClock(){const a=state.active,clock=$('practice-clock'),bar=$('time-bar');if(!a||!clock)return;const item=a.entries[a.position];if(!item)return;const used=clockMs()/1000,planned=item.minutes*60;
 clock.textContent=formatSeconds(Math.max(0,planned-used));if(bar)bar.style.width=Math.min(100,used/planned*100)+'%';
 const running=$('timer-running');if(running)running.textContent=a.startedAt?'Pause timer':'Start timer';
 if(a.startedAt&&used>=planned&&a.timerNotifiedFor!==a.position){
  a.timerNotifiedFor=a.position;pauseTimer();metronome.stop();playTimerChime();saveState(state);
  const note=$('timer-finished');if(note)note.hidden=false;
  showToast('Time is up — finish and rate this exercise.');
  if(running)running.textContent='Start timer';
 }
}
function currentDrill(){const a=state.active;return a?.entries?.[a.position]||null;}
function renderPractice(){if(!state.active)return `${pageHeader('Practice','Active workspace','Start a session to display your musical drills and timer.')}
 <div class="card empty">No active session. Build your practice plan on Today, or open a single drill from the library.<div class="buttons" style="justify-content:center;margin-top:16px"><a href="#today" class="btn primary">Choose a session</a><a href="#drills" class="btn">Browse drills</a></div></div>`;
 const a=state.active,entry=currentDrill();if(!entry)return renderEndSession();const d=DRILL_BY_ID[entry.id],isSong=entry.id==='song',song=allSongs().find(s=>s.id===a.songId)||SONGS[0];const time=Math.max(0,Math.ceil(entry.minutes*60-clockMs()/1000));const stageIndex=d?clampedStageIndex(d,entry.stageIndex):0,stage=d?currentStage(d,stageIndex):null;const isChords=d?.kind==='chords',isMusical=['ii-v-i','enclosure','approach'].includes(d?.kind);
 const notes=d?drillDiagramNotes(d,a.key,stage):[];
 const diagram=!isSong&&!isChords&&!notes.length?`<div class="alert">This exact range does not fit a 22-fret standard-tuned guitar in ${safe(a.key)}. Choose a different key or use a two-octave drill.</div>`:isSong?`<div class="callout"><strong>${safe(song.title)}</strong><p>${safe(song.focus)}</p><p>${safe(song.notes)}</p></div>${renderSongTrackPanel(song.id)}`:isChords?chordBlocks(a.key):`${progressSvg(notes,d?.id==='ear-guide'||d?.id==='jazz-approach')}<div class="color-legend" style="margin-top:10px"><span><span class="dot root"></span>Root/first note</span><span><span class="dot"></span>Chord tone</span><span><span class="dot active"></span>Selected note</span></div>`;
 const previewTime=`<div class="control-panel"><div style="flex:1;min-width:120px"><div class="eyebrow">Tempo</div><div class="tempo"><span id="current-bpm">${state.settings.defaultBpm}</span><span class="muted" style="font-size:14px"> BPM</span></div></div><div style="text-align:right"><div class="eyebrow">Remaining</div><div class="timer" id="practice-clock">${formatSeconds(time)}</div></div></div><div class="meter" style="margin:13px 0 18px"><div id="time-bar" style="width:${Math.min(100,clockMs()/(entry.minutes*600)*100)}%"></div></div>
 <p id="timer-finished" role="status" class="timer-finished" ${a.timerNotifiedFor===a.position?'':'hidden'}>Time's up. Finish and rate this exercise when ready.</p>
 <div class="buttons">${btn('tempo-down',`${ic('minus')} 5 BPM`)}${btn('toggle-timer',`<span id="timer-running">${a.startedAt?'Pause timer':'Start timer'}</span>`,'primary')}${btn('tempo-up',`${ic('plus')} 5 BPM`)}${btn('metro-toggle',`${ic('headphones')} <span id="metro-label">${metronome.playing?'Stop click':'Metronome'}</span>`)} </div><div class="form-row" style="margin-top:14px"><div class="form-group"><label>Subdivision</label><select data-setting="subdivision"><option value="quarter" ${state.settings.subdivision==='quarter'?'selected':''}>Quarter-note pulse</option><option value="swing" ${state.settings.subdivision==='swing'?'selected':''}>Swung eighths</option><option value="triplet" ${state.settings.subdivision==='triplet'?'selected':''}>Triplets</option></select></div><div class="form-group"><label>Meter</label><select data-setting="meter"><option value="4/4" ${state.settings.meter==='4/4'?'selected':''}>4/4</option><option value="6/8" ${state.settings.meter==='6/8'?'selected':''}>6/8 (2 dotted-quarter pulses)</option></select></div></div>`;
 const stepLabel=isSong?song.title:d.title;
 const guidance=stage?stage.focus:isSong?'Pick a short passage, rehearse it slowly, then compare with your performance tempo.':d.kind==='enclosure'?`Aim for ${enclosureGuide(a.key).target}, the major third of ${enclosureGuide(a.key).dominant}. The approach notes decorate that target.`:d.category==='muting'?'Listen for every unintended string. Silence is part of the exercise.':d.category==='arpeggio'?'Identify the root, third and seventh where present; keep string changes smooth.':d.category==='picking'?'Use a small, relaxed down-up motion. Keep the attack even before raising tempo.':d.category==='jazz'?'Hear each chord change; aim for guide tones on strong beats.':d.category==='ear'?'Sing or imagine the target first; check the result on the guitar.':d.category==='comping'?'Play the rhythm first; keep unused strings quiet and releases deliberate.':'Keep the phrase musical rather than racing through the pattern.';
 const instruct=stage?stage.instructions:isSong?['Select one difficult section, not the entire arrangement.','Play once under tempo, then at performance tempo.','Record what specifically needs work for the next session.']:d.kind==='enclosure'?enclosureInstructions(a.key):d.instructions;
 const stageBar=stage?`<section class="stage-panel" aria-label="Guided exercise stages"><div class="stage-summary"><div><div class="eyebrow">Musical challenge · ${stageIndex+1} of ${stageCount(d)}</div><h3>${safe(stage.title)}</h3></div><span class="pill">${Math.round(entry.minutes/stageCount(d)*60)} sec suggested</span></div><div class="stage-steps"><button type="button" data-action="stage-prev" class="btn small" ${stageIndex===0?'disabled':''}>← Previous stage</button><span class="small muted">Advance when ready; timer and metronome continue. Press Enter for next stage.</span><button type="button" data-action="stage-next" class="btn small" ${stageIndex===stageCount(d)-1?'disabled':''}>Next stage →</button></div></section>`:'';
 const positionControl=(!isSong&&['arpeggio','scale'].includes(d?.kind)&&!referencePattern(d,a.key))?`<div class="form-group" style="max-width:280px;margin:12px 0"><label>Fretboard area (suggested route)</label><select data-setting="position"><option value="low" ${state.settings.position==='low'?'selected':''}>Lower neck</option><option value="mid" ${state.settings.position==='mid'?'selected':''}>Middle neck</option><option value="high" ${state.settings.position==='high'?'selected':''}>Upper neck</option></select></div>`:'';
 const referencePanel=d?referencePatternControls(d,a.key):'';
 const noteControls=isChords||isSong?'':`<div class="buttons" style="margin-top:10px">${btn('step-prev',`${ic('minus')} Previous note`,'small')}${tag(diagramStep>=0?`Note ${diagramStep+1} of ${notes.length}`:'All notes')}${btn('step-next',`Next note ${ic('arrow')}`,'small')}<div style="flex:1"></div><div class="segmented"><button class="${state.settings.diagram==='tab'?'active':''}" data-action="diagram-tab">TAB</button><button class="${state.settings.diagram==='fretboard'?'active':''}" data-action="diagram-fretboard">Fretboard</button></div></div><div class="buttons" style="margin-top:8px">${btn('labels-note',state.settings.labels==='note'?'✓ Notes':'Notes','small')}${btn('labels-interval',state.settings.labels==='interval'?'✓ Intervals':'Intervals','small')}${btn('labels-hidden',state.settings.labels==='hidden'?'✓ Labels hidden':'Hide labels','small')}</div>`;
 const refs=(d?.reference||[]).map(id=>`<a href="#reference/${id}">${safe(REFERENCE_BY_ID[id]?.title||id)}</a>`).join('');
 return `${pageHeader('Active session',stepLabel,`Day ${a.dayNumber+1} · ${a.key.replace('b','♭')} · ${a.mode==='technique'?'Technique':'Repertoire'} · ${entry.minutes} min`,tag((a.position+1)+' / '+a.entries.length,true))}
 <div class="practice-layout"><div class="practice-main"><div class="card practice-diagram"><div class="card-header"><div><div class="eyebrow">${safe(isSong?'Performance rehearsal':categoryTitle(d.category))}</div><h2 style="margin-top:8px">${safe(isSong?song.focus:d.summary)}</h2></div>${ic('target')}</div>${isMusical?`${progressionPills(a.key)}<div style="height:12px"></div>`:''}${diagram}${referencePanel}${positionControl}${noteControls}
 <div class="practice-instructions">${stageBar}<p class="practice-shortcuts small muted" aria-label="Practice keyboard shortcuts"><kbd>Space</kbd> Timer pause/resume <span aria-hidden="true">·</span> <kbd>↑</kbd>/<kbd>↓</kbd> BPM ±5${stage?' <span aria-hidden="true">·</span> <kbd>Enter</kbd> Next stage':''}</p><div class="card-header"><h3>How to practise</h3>${ic('book')}</div><p class="practice-cue">${safe(guidance)}</p>
 <ol class="instruction-list instruction-stages">${instruct.map((line,i)=>`<li><strong>${['Prepare','Play','Listen / refine'][i]||'Refine'}.</strong> ${safe(line)}</li>`).join('')}</ol>
 ${refs?`<div class="chip-links practice-references">${refs}</div>`:''}
 ${isSong?`<div class="chip-links practice-references"><a href="#song/${song.id}">Open song profile →</a></div>`:''}
 </div></div>
 <div class="card" style="margin-top:17px"><div class="card-header"><h2>Finish exercise</h2>${tag('Feedback optional')}</div>${showRating?`<div class="eyebrow">One-tap drill rating</div><p class="small muted">Save your best clean tempo and advance. Precision is self-assessed.</p><div class="form-group" style="margin-top:14px"><label>Optional issue</label><select id="drill-issue"><option value="none">None</option><option value="muting">Unwanted string noise</option><option value="precision">Picking accuracy</option><option value="timing">Timing or swing feel</option><option value="tension">Excess tension</option><option value="fingering">Fretting / position change</option></select></div><div class="divider"></div><h3>Help improve this exercise</h3><p class="small muted">Feedback on the app, exercise design or diagrams — separate from how well you played.</p>
 <div class="form-group" style="margin-top:12px"><label for="app-feedback-type">What could improve?</label><select id="app-feedback-type"><option value="general">General suggestion</option><option value="instructions">Instructions / clarity</option><option value="diagram">TAB / fretboard diagram</option><option value="fingering">Fingering / playability</option><option value="timing">Timer / metronome</option><option value="other">Other</option></select></div>
 <div class="form-group" style="margin-top:12px"><label for="app-feedback-text">Your suggestion (optional)</label><textarea id="app-feedback-text" rows="3" maxlength="1200" placeholder="Example: Show a second fingering for the B-string shift."></textarea></div>
 <div class="form-group" style="margin-top:14px"><label class="feedback-consent"><input type="checkbox" id="app-feedback-public"/> Publish this suggestion to the development queue</label></div>
 <p class="footnote">Optional and off by default. Only the exercise ID, category and suggestion will be public; never include personal details. Your ratings and session history stay private. Review changes before any deployment.</p>
 <div class="divider"></div><div class="card-header"><div><h3>Execution quality</h3><p class="small muted">Your self-assessment, not an automatically measured accuracy score. Choose 0–100% in 10% steps.</p></div><div id="rating-percent" class="rating-percent" aria-live="polite">${ratingPercent}%</div></div>
 <div class="rating-control"><button type="button" class="btn" data-action="rating-decrement" aria-label="Decrease quality by 10 percentage points">−10%</button><span class="small muted">Adjust by 10%</span><button type="button" class="btn" data-action="rating-increment" aria-label="Increase quality by 10 percentage points">+10%</button></div>
 <div class="rating-scale" role="group" aria-label="Self-assessed execution quality">${Array.from({length:11},(_,i)=>i*10).map(pct=>`<button type="button" class="rating-chip ${ratingPercent===pct?'selected':''}" data-action="rating-set:${pct}" data-rating-value="${pct}" aria-pressed="${ratingPercent===pct}">${pct}%</button>`).join('')}</div>
 <p class="footnote">0% = unable to execute the drill; 50% = inconsistent; 80% = mostly controlled; 100% = clean and confident. Use the same standard when comparing sessions.</p>
 <div class="buttons" style="margin-top:16px">${btn('rating-save',`Save ${ratingPercent}% & continue`,'primary')}${btn('rating-cancel','Continue practicing','small ghost')}</div>`:`<div class="buttons">${btn('rating-open',`${ic('check')} Finish & rate`,'primary')}${btn('skip-drill','Skip drill','ghost')}${btn('end-early','End session','quiet')}</div>`}</div></div>
 <aside class="practice-side">
 <div class="card practice-timing"><div class="card-header"><h2>Time & metronome</h2>${tag('Exercise '+(a.position+1)+' / '+a.entries.length)}</div>${previewTime}</div>
 <details class="card practice-route"><summary>Session route · ${a.entries.length} exercises</summary>
 ${a.entries.map((x,i)=>`<div class="step-row ${a.position===i?'selected':''} ${x.done?'done':''}" style="padding:9px 4px"><div class="step-n">${x.done?'✓':i+1}</div><div class="step-info"><div class="step-name">${safe(DRILL_BY_ID[x.id]?.title||(allSongs().find(s=>s.id===a.songId)?.title||'Song'))}</div><div class="step-min">${x.minutes} min</div></div></div>`).join('')}
 </details></aside></div>`;
}
function renderEndSession(){const a=state.active;const entries=a.entries;const done=entries.filter(x=>x.done).length;return `${pageHeader('Session recap','Session complete','Review what you practiced and add one practical observation.')}
 <div class="grid-2"><div class="card"><div class="card-header"><h2>Completed drills</h2>${tag(`${done} of ${entries.length}`)}</div>${queueOverview(a)}<div class="divider"></div><label for="session-notes" class="small muted">What should you remember next time?</label><textarea id="session-notes" rows="4" placeholder="e.g. String skips are cleaner at 70 BPM, but B string still rings at 85.">${safe(a.notes||'')}</textarea><div class="buttons" style="margin-top:14px">${btn('save-session',`${ic('check')} Save session`,'primary')}${btn('resume-last','Return to drills','ghost')}</div></div><div class="card"><h2>Key of ${safe(a.key)}</h2><p>Entries were saved individually as you rated each drill. Saving this recap completes the day and advances your 12-key rotation.</p><div class="callout">Weekly exports include completed sessions, individual drill tempos, self-rated precision, recurring issues and session notes.</div></div></div>`;}
function renderDrills(){
 const options=[['all','All drills'],...CATEGORIES.map(category=>[category[0],category[1]])];
 return `${pageHeader('Technique library','Musical drills','Select a category or search to find your next exercise.',`${tag(DRILLS.length+' drills')}`)}
 <div class="drill-filter-panel">
  <div class="drill-filter-heading"><strong>Browse by category</strong><span class="micro muted">Select one to narrow the library</span></div>
  <div class="drill-filter-pills" role="group" aria-label="Filter drills by category">
   ${options.map(([id,title])=>`<button type="button" class="drill-filter-pill ${selectedDrillCategory===id?'active':''}" data-action="drill-filter:${id}" aria-pressed="${selectedDrillCategory===id}" data-drill-filter="${id}">${safe(title)} <span class="pill-count">${categoryCount(id)}</span></button>`).join('')}
  </div>
  <div class="search-wrap"><input class="field" id="drill-search" type="search" value="${safe(drillSearchText)}" placeholder="Search within ${safe(selectedDrillCategory==='all'?'all drills':categoryTitle(selectedDrillCategory))}…" aria-label="Search drills" /></div>
  <div class="drill-filter-result" id="drill-filter-result" aria-live="polite"></div>
 </div>
 <div class="list" id="drill-results">${DRILLS.map(d=>`<a class="list-row drill-search-row" data-category="${d.category}" data-search="${safe((d.title+' '+d.summary+' '+d.category).toLowerCase())}" href="#drill/${d.id}"><div class="row-main"><div class="row-title">${safe(d.title)}</div><div class="row-desc">${safe(d.summary)}</div></div><span class="badge">${d.minutes} min</span>${ic('chevron')}</a>`).join('')}</div>
 <p class="empty hide" id="drill-filter-empty">No drills match this category and search. Try another category or clear the search.</p>`;
}
function renderDrillDetail(id){const d=DRILL_BY_ID[id];if(!d)return `${pageHeader('Library','Drill not found','Return to the library.')}`;
 const key=todayKey(),instructions=d.kind==='enclosure'?enclosureInstructions(key):d.instructions,notes=drillDiagramNotes(d,key,currentStage(d)),rec=(d.reference||[]).map(ref=>REFERENCE_BY_ID[ref]).filter(Boolean),isChord=d.kind==='chords';
 return `${pageHeader(categoryTitle(d.category),d.title,d.summary,btn(`start-free:${d.id}`,`${ic('play')} practice this drill`,'primary'))}
 <div class="grid-main"><div class="card"><div class="card-header"><h2>Exercise diagram</h2>${tag(key,true)}</div>${referencePatternControls(d,key)}${isChord?chordBlocks(key):!notes.length?`<div class="alert">A full three-octave path is not available in this key on a 22-fret standard-tuned guitar. Try another key or a two-octave arpeggio.</div>`:`<div class="eyebrow">Tab · D = down, U = up</div><div class="diagram-viewport" style="margin-top:10px">${renderGuitarStaff(notes)}</div><div class="eyebrow" style="margin-top:20px">Fretboard</div><div class="diagram-viewport" style="margin-top:10px">${renderFretboardSvg(notes,-1,'note')}</div>`}${d.octaves===3?`<p class="alert">Three-octave lines can reach very high frets in some keys. Reduce the range or change key if your guitar or neck comfort makes this impractical.</p>`:''}<div class="divider"></div><h3>How to practice</h3><ol class="instruction-list">${instructions.map(i=>`<li>${safe(i)}</li>`).join('')}</ol>${stageCount(d)?`<h3>Guided stages</h3><ol class="instruction-list">${d.stages.map(stage=>`<li><strong>${safe(stage.title)}:</strong> ${safe(stage.focus)}</li>`).join('')}</ol>`:''} </div><aside class="card"><h3>References</h3>${rec.map(r=>rect(r.title,r.takeaway,'#reference/'+r.id)).join('')||'<p>No specific reference linked.</p>'}<div class="divider"></div><div class="buttons">${btn(`start-free:${d.id}`,'Start solo practice','primary full')}<a class="btn full ghost" href="#drills">Back to library</a></div></aside></div>`;
}
let modalFamily='melodic',modalKey='C',modalId='altered',modalStep=-1,modalPosition='G';
function renderModesLab(){
 const scale=scaleFor(modalId,modalKey),fingering=positionForMode(scale,modalPosition),notes=fingering.notes;
 const choices=MODE_DEFINITIONS.filter(d=>d.family===modalFamily);
 const active=choices.some(d=>d.id===modalId)?modalId:choices[0].id;
 if(active!==modalId){modalId=active;return renderModesLab();}
 const degree=modalStep>=0?Math.min(scale.intervals.length-1,modalStep):-1;
 const highlight=degree>=0?notes.findIndex(note=>note.degreeIndex===degree):-1;
 const modalHarmony=harmonizeSelectedMode(scale);
 return `${pageHeader('Music theory','Modes & diatonic harmony','An interactive pitch-checked library: hear the interval, visualize the note and practice a target in every key.')}
 <div class="card">
 <div class="form-row">
  <div class="form-group"><label>Scale family</label><select data-theory="family">${MODE_FAMILIES.map(f=>`<option value="${f.id}" ${f.id===modalFamily?'selected':''}>${safe(f.title)}</option>`).join('')}</select></div>
  <div class="form-group"><label>Scale or mode</label><select data-theory="mode">${choices.map(m=>`<option value="${m.id}" ${m.id===active?'selected':''}>${safe(m.title)}</option>`).join('')}</select></div>
  <div class="form-group"><label>Root key</label><select data-theory="key">${KEYS.map(key=>`<option value="${key}" ${key===modalKey?'selected':''}>${key}</option>`).join('')}</select></div>
 </div>
 <div class="mode-position-selector" role="group" aria-label="Select one of five CAGED fretboard regions">
 <div class="mode-position-heading"><strong>Five fretboard positions</strong><span class="micro muted">Conventional CAGED root landmarks · six strings · 4-fret frames</span></div>
 <div class="mode-position-buttons">${CAGED_REGIONS.map(shape=>`<button type="button" class="mode-position-button ${modalPosition===shape.id?'active':''}" data-action="mode-position:${shape.id}" aria-pressed="${modalPosition===shape.id}"><strong>${shape.id}</strong><span>${safe(shape.label)}</span></button>`).join('')}</div>
 <div class="mode-position-caption"><strong>${safe(fingering.label)}</strong> · Frets ${fingering.fretRange.join('–')} · ${safe(fingering.description)} · Root ${safe(modalKey)}.</div>
 <p class="micro muted">One hand position per shape; no arbitrary B-string position jumps. Suggested fretting fingers: 1 index, 2 middle, 3 ring, 4 pinky (0 = open). Movable note locations, not a claim that an altered or diminished scale forms a major CAGED chord.</p>
 </div>
 <h2 class="modes-heading">${safe(scale.title)} <span class="pill">${safe(modalKey)} ${safe(scale.chord)}</span></h2>
 <p class="muted">${safe(scale.use)}</p>
 <div class="mode-degree-row">${scale.intervals.map((semitones,i)=>`<button type="button" class="mode-degree ${degree===i?'active':''}" data-action="mode-step:${i}" aria-pressed="${degree===i}">${safe(scale.degrees[i])}<small>${semitones} semitones</small></button>`).join('')}</div>
 <div class="buttons" style="margin:14px 0">${btn('mode-back','← Previous tone','small')}${btn('mode-next','Next tone →','small primary')}${btn('mode-reset','Show all','small ghost')}</div>
 <p role="status" class="micro muted">${degree>=0?'Focused degree '+(degree+1)+' of '+scale.intervals.length+' · '+scale.intervals[degree]+' semitones above '+modalKey:'Select a degree to highlight the guitar position.'} This position has ${notes.length} notes across six strings. The finger numbers below are a suggested one-finger-per-fret layout.</p>
 <div class="diagram-viewport">${renderGuitarStaff(notes,highlight)}</div>
 <div class="diagram-viewport" style="margin-top:13px">${renderFretboardSvg(notes,highlight,state.settings.labels)}</div>
 <div class="mode-position-finger-list" aria-label="Fretting guide by string">
  ${[5,4,3,2,1,0].map(string=>`<div class="mode-string-row"><strong>${['e','B','G','D','A','E'][string]}</strong><span>${notes.filter(n=>n.string===string).map(n=>`<span class="mode-note-fingering ${n.degreeIndex===0?'is-root':''}" title="${safe(n.name)} · ${safe(n.interval)}"><b>${n.fret}</b><small>${n.finger===0?'open':'finger '+n.finger}</small></span>`).join('')}</span></div>`).join('')}
 </div>
 </div>
 <section class="card" style="margin-top:18px">
 <h2>${safe(modalHarmony.title)}</h2>
 <p class="muted">${safe(modalHarmony.description)}</p>
 <div class="mode-diatonic-grid ${modalHarmony.kind==='characteristic'?'modal-characteristic':''}" aria-label="Harmony of the selected mode">
  ${modalHarmony.chords.map(ch=>`<div class="mode-diatonic"><span class="eyebrow">${safe(ch.role)}</span><strong>${safe(ch.symbol)}</strong><span class="micro muted">${safe(ch.quality)}</span><span class="micro muted">Semitones: ${ch.intervals.join(' · ')}</span>${ch.warning?`<span class="micro muted">${safe(ch.warning)}</span>`:''}</div>`).join('')}
 </div>
 <p class="footnote">Harmony is recalculated from ${safe(modalKey)} ${safe(scale.title)}. Seven-tone modes use alternate-degree tertian stacks; altered and symmetric diminished scales show their characteristic dominant/diminished chord colors. This prevents incorrectly displaying the major-scale chords for every mode. Guitar positions above use five CAGED-root regions, not claimed textbook copies.</p>
 </section>`;
}
function renderHarmony(){
 const plan=buildTwoFiveOne(harmonySettings.key,harmonySettings.mode);
 const options=KEYS.map(key=>'<option value="'+safe(key)+'" '+(harmonySettings.key===key?'selected':'')+'>'+safe(key)+'</option>').join('');
 const bpmOptions=[1,2,4].map(n=>'<option value="'+n+'" '+(Number(harmonySettings.barsPerChord)===n?'selected':'')+'>'+n+' bar'+(n===1?'':'s')+' per chord</option>').join('');
 const volOptions=[[.25,'Soft'],[.55,'Medium'],[.7,'Fuller'],[.85,'Loud'],[1,'Maximum']].map(v=>'<option value="'+v[0]+'" '+(Number(harmonySettings.volume)===v[0]?'selected':'')+'>'+v[1]+'</option>').join('');
 const wetOptions=[[0,'Dry'],[.25,'Light room'],[.42,'Warm room'],[.65,'Wet'],[.85,'Very wet']].map(v=>'<option value="'+v[0]+'" '+(Number(harmonySettings.reverb??.42)===v[0]?'selected':'')+'>'+v[1]+'</option>').join('');
 const cards=plan.chords.map((chord,i)=>'<div class="harmony-chord" data-harmony-card="'+i+'"><div class="eyebrow">'+safe(chord.role)+'</div><h2>'+safe(chord.label)+'</h2><div class="small muted">Guide tones: '+safe(chord.guideTones.join(' · '))+'</div></div>').join('');
 const scores=Array.from({length:11},(_,i)=>i*10).map(score=>'<option value="'+score+'" '+(score===80?'selected':'')+'>'+score+'%</option>').join('');
 return pageHeader('Jazz harmony','ii–V–I Practice Zone','Hear major and minor progressions, practise guide tones and improvise with a piano-style chord pulse.')+
 '<div class="harmony-shell"><div class="card"><div class="card-header"><div><div class="eyebrow">No recordings, no subscription</div><h2>Chord accompaniment</h2></div>'+tag('Local audio',true)+'</div>'+
 '<div class="form-row" style="margin-top:12px"><div class="form-group"><label>Key</label><select data-harmony-setting="key">'+options+'</select></div>'+
 '<div class="form-group"><label>Harmony</label><select data-harmony-setting="mode"><option value="major" '+(harmonySettings.mode==='major'?'selected':'')+'>Major ii–V–I</option><option value="minor" '+(harmonySettings.mode==='minor'?'selected':'')+'>Minor iiø–V–i</option></select></div>'+
 '<div class="form-group"><label>Chord duration</label><select data-harmony-setting="barsPerChord">'+bpmOptions+'</select></div></div>'+
 '<div class="harmony-transport"><div><div class="eyebrow">Playback tempo</div><div class="tempo"><span id="harmony-bpm">'+harmonySettings.tempo+'</span> <span class="small muted">BPM</span></div></div>'+
 '<div class="buttons">'+btn('harmony-slower','−5 BPM','small')+btn('harmony-play','Play chords','primary')+btn('harmony-stop','Stop sound')+btn('harmony-faster','+5 BPM','small')+'</div></div>'+
 '<div class="form-row" style="margin-top:12px"><div class="form-group"><label>Chord volume</label><select data-harmony-setting="volume">'+volOptions+'</select></div>'+
 '<div class="form-group"><label>Reverb</label><select data-harmony-setting="reverb">'+wetOptions+'</select></div>'+ 
 '<label class="form-group harmony-click"><span>Rhythmic click</span><input type="checkbox" data-harmony-setting="click" '+(harmonySettings.click?'checked':'')+' /></label></div>'+
 '<p id="harmony-status" class="small muted" role="status">Ready. Press Play to hear the chords.</p>'+
 '<div class="harmony-chord-grid">'+cards+'</div>'+
 '<div class="harmony-bar"><span id="harmony-position">Waiting for playback</span><span id="harmony-next"></span></div>'+
 '<p class="footnote">The synthetic, electric-piano-inspired sound is generated in this browser. It is not a sampled Fender Rhodes instrument. Start audio with a click. Change key or mode to reset the progression. The backing click uses the same audio clock as the chords.</p></div>'+
 '<aside class="card"><div class="eyebrow">Practice this progression</div><h2 style="margin:10px 0 14px">One chord at a time</h2>'+
 '<ol class="instruction-list"><li><strong>Listen:</strong> hear each chord change before touching the fretboard.</li>'+
 '<li><strong>Guide tones:</strong> play the 3rd and 7th over ii and V, then resolve to a stable tone on I or i.</li>'+
 '<li><strong>Phrase:</strong> improvise a two-bar question and answer; land deliberately on a chord tone.</li>'+
 '<li><strong>Switch:</strong> try the other mode in the same key, then work around the circle of fourths.</li></ol>'+
 '<div class="divider"></div><h3>Record this attempt</h3>'+
 '<div class="form-group"><label>Execution quality</label><select id="harmony-score">'+scores+'</select></div>'+
 '<div class="form-group" style="margin-top:12px"><label>What went well / needs work?</label><textarea id="harmony-notes" maxlength="600" rows="3" placeholder="e.g. G7 third was solid; work on Dm7♭5 voice leading"></textarea></div>'+
 '<div class="buttons">'+btn('harmony-log','Save practice note','primary full')+'</div>'+
 '<p class="footnote">Saves a small progress record using your existing private practice storage and cloud sync. No audio is uploaded.</p></aside></div>';
}
function updateHarmonyUI(){
 const here=harmonyPosition,play=$('harmony-status'),label=$('harmony-position'),next=$('harmony-next');
 if(!play)return;
 const active=harmonyBacking.playing&&here;
 play.textContent=active?'Playing '+here.chord.label+' · loop '+here.loop:'Stopped. Press Play to hear the chords.';
 if(label)label.textContent=active?'Bar '+here.barNumber+' · '+here.chord.label+' · bar '+here.barInChord+' of '+harmonyBacking.barsPerChord:'Waiting for playback';
 const plan=buildTwoFiveOne(harmonySettings.key,harmonySettings.mode);
 if(next)next.textContent=active?'Next: '+plan.chords[(here.chordIndex+1)%3].label:'';
 document.querySelectorAll('[data-harmony-card]').forEach(element=>element.classList.toggle('current',active&&Number(element.dataset.harmonyCard)===here.chordIndex));
}
async function toggleHarmonyPlayback(){
 if(harmonyBacking.playing){stopHarmonyPlayback();return;}
 try{
  metronome.stop();songTrackPlayer.pause();
  const plan=buildTwoFiveOne(harmonySettings.key,harmonySettings.mode);
  await harmonyBacking.start(plan,harmonySettings);
  harmonyStarted=Date.now();
  updateHarmonyUI();
 }catch(error){showToast('Chord playback unavailable: '+error.message);}
}
function stopHarmonyPlayback(){
 if(harmonyStarted){harmonyElapsed+=Date.now()-harmonyStarted;harmonyStarted=0;}
 harmonyBacking.stop();updateHarmonyUI();
}
function harmonyTempoChange(delta){
 harmonySettings.tempo=clampHarmonyTempo(Number(harmonySettings.tempo)+delta);
 state.settings.harmony={...harmonySettings};saveState(state);
 harmonyBacking.setTempo(harmonySettings.tempo);
 const label=$('harmony-bpm');if(label)label.textContent=harmonySettings.tempo;
}
function logHarmonyAttempt(){
 const score=Number($('harmony-score')?.value||80),notes=$('harmony-notes')?.value?.trim().slice(0,600)||'';
 if(!Number.isInteger(score)||score<0||score>100||score%10!==0){showToast('Choose a rating in 10% steps.');return;}
 const playedSeconds=Math.max(0,Math.round((harmonyElapsed+(harmonyStarted?Date.now()-harmonyStarted:0))/1000));
 addRecord(state,'drill',{drillId:'harmony-251',key:harmonySettings.key,mode:'harmony',harmonyMode:harmonySettings.mode,
  bpm:harmonySettings.tempo,barsPerChord:harmonySettings.barsPerChord,ratingPct:score,seconds:playedSeconds,issue:'none',notes});
 harmonyElapsed=0;if(harmonyStarted)harmonyStarted=Date.now();
 cloud.sync();
 const entry=$('harmony-notes');if(entry)entry.value='';
 showToast('ii–V–I practice saved. Progress is available under Progress.');
}
function renderSongs(){
 const library=allSongs(),custom=manualSongs(state.records),logged=state.records.filter(r=>r.kind==='song');
 return `${pageHeader('Performance repertoire','Songs & setlists','Built-in setlist plus the songs you add yourself. Rehearsal profiles and optional backing tracks work for both.',tag(library.length+' songs'))}
 <div class="card manual-song-creator">
 <div class="card-header"><div><div class="eyebrow">Your repertoire</div><h2>Add a song manually</h2></div>${tag(custom.length+' personally added')}</div>
 <p class="small muted">Create your own song profile, then rehearse it using the same Practice with Track player, connected drills and progress notes. Audio files remain on your device.</p>
 <div class="form-row">
   <div class="form-group"><label for="new-song-title">Song title *</label><input id="new-song-title" class="field" maxlength="120" placeholder="e.g. Blue Bossa" required /></div>
   <div class="form-group"><label for="new-song-meter">Time signature</label><select id="new-song-meter">${SONG_METERS.map(m=>`<option value="${m}">${m}</option>`).join('')}</select></div>
   <div class="form-group"><label for="new-song-key">Arrangement key (optional)</label><input id="new-song-key" class="field" maxlength="24" placeholder="e.g. Cm or Eb" /></div>
   <div class="form-group"><label for="new-song-bpm">Target tempo (optional)</label><input id="new-song-bpm" class="field" inputmode="numeric" type="number" min="30" max="260" placeholder="e.g. 120" /></div>
 </div>
 <div class="form-row" style="margin-top:12px">
  <div class="form-group"><label for="new-song-focus">Technique / rehearsal goal</label><input id="new-song-focus" class="field" maxlength="220" placeholder="e.g. clean shell voicings and relaxed swing" /></div>
  <div class="form-group"><label for="new-song-drill">Related drill</label><select id="new-song-drill">${DRILLS.map(d=>`<option value="${safe(d.id)}" ${d.id==='jazz-guide'?'selected':''}>${safe(d.title)}</option>`).join('')}</select></div>
 </div>
 <div class="form-group" style="margin-top:12px"><label for="new-song-notes">Arrangement or practice notes</label><textarea id="new-song-notes" class="field" rows="3" maxlength="1000" placeholder="Form, chord changes, backing-track notes, sections to practice…"></textarea></div>
 <div class="buttons" style="margin-top:13px">${btn('add-manual-song','+ Add song to repertoire','primary')}</div>
 <p class="footnote">Song metadata is kept in your existing practice records, JSON backup and optional private sync. No audio file is stored or uploaded. You can keep up to 250 custom songs.</p>
 </div>
 <div class="grid-main" style="margin-top:17px"><div class="list">${library.map((song,index)=>{const last=latestSong(song.id);
 return `<a class="song-item" href="#song/${song.id}"><div class="song-n">${String(index+1).padStart(2,'0')}</div><div class="song-copy"><div class="song-title">${safe(song.title)} ${song.manual?'<span class="badge">Personal</span>':''}</div><p>${safe(song.focus)}</p></div><span class="badge">${last?safe(last.readiness||'Tracking'):'Not tracked'}</span>${ic('chevron')}</a>`;}).join('')}</div>
 <aside class="card"><div class="eyebrow">Repertoire tracking</div><h2 style="margin-top:12px">From drill to performance</h2><p>Save keys, tempo, readiness and next rehearsal priorities for any song—including your own entries.</p><div class="divider"></div><div class="metric"><div class="label">Songs with rehearsal logs</div><div class="number">${new Set(logged.map(r=>r.payload?.songId)).size} / ${library.length}</div></div><p class="footnote">Your own song list is stored in practice records; locally chosen MP3/WAV files are never included in backups or cloud sync.</p></aside>
 </div>`;
}
function renderSongTrackPanel(songId){
 const p=songTrackPlayer.snapshot(),loaded=p.loaded&&p.songId===songId;
 return '<section class="card song-track-panel" aria-label="Practice with your own recording">'+
 '<div class="card-header"><div><div class="eyebrow">Local track playback</div><h2>Practice with Track</h2></div>'+tag('Private · on this PC')+'</div>'+
 '<p class="small muted">Choose an MP3 or WAV rehearsal recording, instrumental stem or backing track you own or have permission to use. Nothing is uploaded or synced.</p>'+
 '<div class="form-group"><label for="song-track-file">Choose audio file (.mp3 or .wav)</label><input class="field" id="song-track-file" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" /></div>'+
 '<div id="song-track-file-name" class="small muted" style="margin:9px 0">'+(loaded?'Loaded: '+safe(p.fileName):'No file selected. Choose a track for this song.')+'</div>'+
 '<div class="track-controls"><div class="buttons">'+btn('track-play','Play','primary')+btn('track-pause','Pause')+btn('track-stop','Stop')+'</div>'+
 '<div class="track-seek-row"><span id="track-current">'+songClock(loaded?p.current:0)+'</span>'+
 '<input type="range" id="track-seek" min="0" max="'+Math.max(1,loaded?p.duration:1)+'" step="0.1" value="'+(loaded?p.current:0)+'" aria-label="Seek in track" '+(loaded?'':'disabled')+' />'+
 '<span id="track-duration">'+songClock(loaded?p.duration:0)+'</span></div>'+
 '<div class="form-row"><label class="track-checkbox"> <input type="checkbox" id="track-full-loop" data-track-loop '+(loaded&&p.fullLoop?'checked':'')+' /> Loop full track</label>'+
 '<div class="form-group"><label for="track-volume">Volume</label><input type="range" id="track-volume" min="0" max="1" step="0.1" value="'+p.volume+'" aria-label="Track volume" /></div></div>'+
 '<div class="buttons">'+btn('track-a','Set loop A','small')+btn('track-b','Set loop B','small')+btn('track-clear-loop','Clear A–B loop','small ghost')+'</div>'+
 '<p id="track-loop-status" class="small muted">'+(loaded&&p.abStart!==null?'A: '+songClock(p.abStart)+(p.abEnd!==null?' → B: '+songClock(p.abEnd)+' (looping)':' · select B'):'Optional: Set A and B while your track is playing to repeat a difficult passage.')+'</p></div>'+
 '<p class="footnote">The selected file is available only until you refresh or close this page. Select it again next time. It is not included in JSON backups, GitHub or Supabase. A–B looping may overshoot slightly depending on the browser.</p>'+
 '<p id="track-error" class="alert" '+(loaded&&p.error?'':'hidden')+'>'+safe(p.error)+'</p></section>';
}
function updateSongTrackUI(){
 const p=songTrackPlayer.snapshot(),r=route();
 const shown=r.page==='song'&&r.id===p.songId||r.page==='practice'&&state.active?.entries?.[state.active?.position]?.id==='song'&&state.active?.songId===p.songId;
 if(!shown)return;
 const t=$('track-current'),duration=$('track-duration'),seek=$('track-seek');
 if(t)t.textContent=songClock(p.current);
 if(duration)duration.textContent=songClock(p.duration);
 if(seek){seek.max=String(Math.max(1,p.duration));seek.value=String(p.current);}
 const loop=$('track-loop-status');
 if(loop)loop.textContent=p.abStart===null?'Optional A–B loop: press Set A then Set B during playback.':'A: '+songClock(p.abStart)+(p.abEnd===null?' · select B':' → B: '+songClock(p.abEnd)+' (looping)');
 const error=$('track-error');
 if(error){error.hidden=!p.error;error.textContent=p.error;}
}
function renderSongDetail(id){const song=allSongs().find(s=>s.id===id);if(!song)return `${pageHeader('Repertoire','Song not found','Choose a song from the list.')}`;const prev=latestSong(id)||{key:song.initialKey||'',tempo:song.initialTempo||null};const trackPanel=renderSongTrackPanel(id);
 const related=DRILL_BY_ID[song.suggested]||DRILL_BY_ID['jazz-guide'];const entries=state.records.filter(r=>r.kind==='song'&&r.payload?.songId===id).sort((a,b)=>b.created_at.localeCompare(a.created_at));
 return `${pageHeader('Repertoire · Logos-Motive',song.title,song.focus,btn(`song-focus:${id}`,`${ic('play')} practice song · 12 min`,'primary'))}
 <div class="grid-main"><div><div class="card"><div class="card-header"><h2>Practice profile</h2>${tag(song.meter)}</div><div class="callout">${safe(song.notes)}</div><div class="form-row" style="margin-top:19px"><div class="form-group"><label for="song-key">Your arrangement key (optional)</label><input class="field" id="song-key" maxlength="12" value="${safe(prev.key||'')}" placeholder="e.g. G minor"/></div><div class="form-group"><label for="song-tempo">Target BPM (optional)</label><input class="field" id="song-tempo" inputmode="numeric" type="number" min="30" max="260" value="${safe(prev.tempo||'')}" placeholder="e.g. 65"/></div><div class="form-group"><label for="song-readiness">Performance readiness</label><select id="song-readiness">${[['learning','Learning'],['developing','Developing'],['ready','Performance ready'],['maintaining','Maintenance']].map(([v,label])=>`<option value="${v}" ${(prev.readiness||'learning')===v?'selected':''}>${label}</option>`).join('')}</select></div></div>
 <h3 style="margin-top:24px">practiced components</h3><div class="song-sections">${[['harmony','Harmony'],['picking','Picking / tone'],['solo','Melody / solo'],['structure','Structure / transitions'],['vocals','Vocal coordination']].map(([id,label])=>`<label><input type="checkbox" data-song-section="${id}" ${(prev.sections||[]).includes(id)?'checked':''}/> ${label}</label>`).join('')}</div>
 <div class="form-group" style="margin-top:19px"><label for="song-notes">What will you work on next?</label><textarea rows="5" id="song-notes" placeholder="A specific passage, transition, technique, or vocal/guitar coordination issue…">${safe(prev.notes||'')}</textarea></div><div class="buttons" style="margin-top:14px">${btn(`save-song:${id}`,`${ic('check')} Save rehearsal notes`,'primary')}<a class="btn ghost" href="#songs">All songs</a></div></div>${trackPanel}</div>
 <aside><div class="card"><h3>Connected technique</h3><a class="list-row" href="#drill/${related.id}"><div class="row-main"><div class="row-title">${safe(related.title)}</div><div class="row-desc">${safe(related.summary)}</div></div>${ic('chevron')}</a><div class="divider"></div><h3>Practice history</h3>${entries.length?entries.slice(0,6).map(r=>`<div class="step-row"><div class="step-info"><div class="step-name">${new Date(r.created_at).toLocaleDateString()}</div><div class="step-min">${safe(r.payload.readiness||'Logged')} · ${safe(r.payload.notes||'No note')}</div></div></div>`).join(''):'<p>No rehearsal entries recorded yet.</p>'}</div></aside></div>`;}
let vocabularyArtist='montgomery',vocabularyStudy='wes-octave',vocabularyKey='C',vocabularyNote=-1;
function renderVocabularyLab(){
 const artist=ARTIST_PROFILES.find(p=>p.id===vocabularyArtist)||ARTIST_PROFILES[0];
 const choices=VOCAB_STUDIES.filter(s=>s.artist===artist.id);
 const exercise=choices.find(s=>s.id===vocabularyStudy)||choices[0];
 if(exercise.id!==vocabularyStudy)vocabularyStudy=exercise.id;
 const notes=vocabularyNotes(exercise.id,vocabularyKey),beatCount=notes.reduce((max,n)=>Math.max(max,n.beat??n.index),0)+1;
 const current=vocabularyNote>=0?Math.min(notes.length-1,vocabularyNote):-1;
 return `${pageHeader('Jazz guitar','Jazz Masters — vocabulary practice','Original, source-informed guitar studies; not transcriptions of protected recordings or published solos.')}
 <div class="card">
 <div class="form-row">
 <div class="form-group"><label>Player and concept</label><select data-vocabulary="artist">${ARTIST_PROFILES.map(p=>`<option value="${p.id}" ${p.id===artist.id?'selected':''}>${safe(p.name)}</option>`).join('')}</select></div>
 <div class="form-group"><label>Study</label><select data-vocabulary="study">${choices.map(c=>`<option value="${c.id}" ${c.id===exercise.id?'selected':''}>${safe(c.title)}</option>`).join('')}</select></div>
 <div class="form-group"><label>Key</label><select data-vocabulary="key">${KEYS.map(k=>`<option value="${k}" ${k===vocabularyKey?'selected':''}>${k}</option>`).join('')}</select></div>
 </div>
 <h2>${safe(exercise.title)}</h2><p class="muted">${safe(exercise.focus)}</p>
 <div class="buttons" style="margin:12px 0">${btn('vocab-prev','← Previous target','small')}${btn('vocab-next','Next target →','small primary')}${btn('vocab-reset','All notes','small ghost')}${tag(beatCount+' attacks')}</div>
 <div class="diagram-viewport">${renderGuitarStaff(notes,current)}</div>
 <div class="diagram-viewport" style="margin-top:14px">${renderFretboardSvg(notes,current,state.settings.labels)}</div>
 <h3>Practice steps</h3><ol class="instruction-list">${exercise.instructions.map(i=>`<li>${safe(i)}</li>`).join('')}</ol>
 <p class="footnote">Original exercises inspired by documented playing concepts, not attributed note-for-note licks. Notes and simultaneous octave/dyad attacks are computed from standard tuning and verified in all 12 keys.</p>
 </div>
 <div class="card" style="margin-top:15px">
 <div class="card-header"><h3>Source and listening context</h3></div>
 <p><strong>${safe(artist.name)}</strong>: ${safe(artist.theme)}.</p>
 <p>${safe(artist.provenance)}</p>
 <a href="${safe(artist.source)}" target="_blank" rel="noopener noreferrer">Read the published interview or guitar lesson →</a>
 <p class="footnote">For exact lines from a recording, use a properly licensed transcription or your own listening/transcription work. This app intentionally does not reproduce protected solos.</p>
 </div>`;
}
function renderReferences(){return `${pageHeader('Permanent handbook','References & technique','Original notes and diagrams linked directly to your active exercises.',tag(REFERENCES.length+' topics'))}
 <div class="cards">${REFERENCES.map(ref=>`<a class="card route-link" href="#reference/${ref.id}" style="display:block"><div class="eyebrow">${safe(ref.category)}</div><h2 style="margin-top:12px">${safe(ref.title)}</h2><p>${safe(ref.takeaway)}</p><div class="buttons" style="margin-top:12px;color:var(--teal);font-size:12px;font-weight:730">Open reference ${ic('arrow')}</div></a>`).join('')}</div>`;}
function renderReferenceDetail(id){const ref=REFERENCE_BY_ID[id];if(!ref)return `${pageHeader('Handbook','Reference not found','Return to the reference library.')}`;const relevant=DRILLS.filter(d=>(d.reference||[]).includes(id));return `${pageHeader(ref.category,ref.title,ref.takeaway)}<div class="grid-main"><div class="card"><h2>Essential ideas</h2><ol class="instruction-list">${ref.points.map(p=>`<li>${safe(p)}</li>`).join('')}</ol><div class="divider"></div><h3>Further learning</h3><div class="ref-links">${ref.links.map(([label,url])=>`<a href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(label)} ↗</a>`).join('')||'<p class="small muted">Use the related drills to reinforce these concepts.</p>'}</div><div class="divider"></div><a href="#references" class="btn ghost">All references</a></div><aside class="card"><h3>Related exercises</h3><div class="list">${relevant.slice(0,9).map(d=>rect(d.title,d.summary,'#drill/'+d.id)).join('')}</div></aside></div>`;}
function renderProgress(){const history=[...state.records].sort((a,b)=>b.created_at.localeCompare(a.created_at)),sessions=history.filter(r=>r.kind==='session'),drills=history.filter(r=>r.kind==='drill'),songs=history.filter(r=>r.kind==='song');const issues={};const byDrill={};for(const r of drills){const p=r.payload||{};if(p.issue&&p.issue!=='none')issues[p.issue]=(issues[p.issue]||0)+1;if(isHighQualityDrill(p)){const k=(p.drillId||'Unknown')+' · '+(p.key||'')+' · '+(p.subdivision||'quarter')+' · '+(p.position||'low');byDrill[k]=Math.max(byDrill[k]||0,Number(p.bpm)||0);}}
 const qualityScores=drills.map(r=>validRatingPercent(r.payload)).filter(n=>n!==null);
 const keys=Object.fromEntries(KEYS.map(k=>[k,0]));sessions.forEach(r=>{if(keys[r.payload?.key]!==undefined)keys[r.payload.key]++;});const bars=Object.entries(byDrill).sort((a,b)=>b[1]-a[1]).slice(0,7);const max=Math.max(120,...bars.map(b=>b[1]));
 return `${pageHeader('History & exports','Practice progress','A few meaningful measures, not a data science project.')}
 <div class="metrics"><div class="metric"><div class="label">Completed sessions</div><div class="number">${sessions.length}</div></div><div class="metric"><div class="label">Average execution quality</div><div class="number">${qualityScores.length?Math.round(qualityScores.reduce((a,b)=>a+b,0)/qualityScores.length)+'%':'—'}</div><div class="micro muted">${qualityScores.length} percentage rating(s)</div></div><div class="metric"><div class="label">Drill logs / song notes</div><div class="number">${drills.length} / ${songs.length}</div></div></div>
 <div class="grid-2"><div class="card"><div class="card-header"><h2>Key coverage</h2>${tag('Circle of fourths')}</div><div class="key-grid">${KEYS.map(k=>`<div class="key-tile ${keys[k]?'past':''}" title="${keys[k]} sessions">${k.replace('b','♭')}<div class="micro muted">${keys[k]}×</div></div>`).join('')}</div><p class="footnote">Counts represent completed practice sessions, not mastery in a key.</p></div>
 <div class="card"><div class="card-header"><h2>Best qualifying tempos</h2>${tag('By drill + key + subdivision')}</div>${bars.length?bars.map(([k,v])=>`<div class="bar-chart"><label title="${safe(k)}">${safe(k)}</label><div class="bar-bg"><div style="width:${v/max*100}%"></div></div><strong>${v} BPM</strong></div>`).join(''):'<div class="empty">No ratings of 90–100% (or historical “clean”) yet. These tempos appear after high-quality attempts.</div>'}<p class="footnote">Qualifying attempts: 90–100% execution quality or a historical “clean” label. Compare only the same drill, key, subdivision and neck position. Percentages are self-assessed.</p></div></div>
 <div class="grid-2" style="margin-top:18px"><div class="card"><div class="card-header"><h2>Most reported issues</h2>${tag('All-time')}</div>${Object.keys(issues).length?Object.entries(issues).sort((a,b)=>b[1]-a[1]).map(([label,n])=>`<div class="step-row"><div class="step-info"><div class="step-name">${safe(label)}</div></div><strong>${n}</strong></div>`).join(''):'<p>No issues recorded.</p>'}</div>
 <div class="card"><h2>Weekly report</h2><p>Export a concise text report for ChatGPT, and keep a complete local backup. Nothing is automatically sent to ChatGPT.</p><div class="buttons">${btn('copy-weekly',`${ic('check')} Copy 7-day report`,'primary')}${btn('download-weekly',`${ic('download')} Download .md`)}<a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" class="btn ghost">Open ChatGPT ↗</a></div><div class="divider"></div><h3>Exercise improvement feedback</h3><p>Notes about the design of drills, diagrams and instructions are separate from your performance assessments.</p><div class="buttons">${btn('copy-app-feedback',`${ic('check')} Copy app feedback`,'primary')}</div>
 <div class="divider"></div><div class="buttons">${btn('export-json','Full JSON backup')}${btn('export-csv','CSV spreadsheet')}</div></div></div>
 <div class="card" style="margin-top:18px"><div class="card-header"><h2>Recent drill results</h2>${tag('Latest 30')}</div>${drills.length?`<div style="overflow-x:auto"><table class="table"><thead><tr><th>Date</th><th>Exercise</th><th>Key</th><th>Tempo</th><th>Assessment</th><th>Issue</th></tr></thead><tbody>${drills.slice(0,30).map(r=>`<tr><td class="nowrap">${new Date(r.created_at).toLocaleDateString()}</td><td>${safe(DRILL_BY_ID[r.payload?.drillId]?.title||r.payload?.drillId||'Song practice')}</td><td>${safe(r.payload?.key)}</td><td>${safe(r.payload?.bpm||'—')}</td><td>${safe(ratingDisplay(r.payload))}</td><td>${safe(r.payload?.issue||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Your first drill result will appear here once you finish and rate an exercise.</div>'}</div>`;}
function renderReleases(){
 return `${pageHeader('Updates','Release notes','A history of what changed in Guitar Practice Lab.')}
 <div class="release-timeline">${RELEASE_NOTES.map((release,i)=>`<section class="card release-entry">
   <div class="card-header"><div><div class="eyebrow">${safe(release.date)}</div><h2 style="margin-top:8px">Version ${safe(release.version)} · ${safe(release.title)}</h2></div>${i===0?tag('Current',true):tag('Previous')}</div>
   <ul class="release-changes">${release.changes.map(item=>`<li>${safe(item)}</li>`).join('')}</ul>
 </section>`).join('')}</div>
 <p class="footnote">Only changes merged into the current production version appear as current after deployment. Full source history: <a href="https://github.com/GitBarton/guitar-practice-lab/commits/main" target="_blank" rel="noopener noreferrer">GitHub commits</a>.</p>`;
}
function renderSettings(){return `${pageHeader('Configuration','Settings & cloud','Local-first. Cloud sync is optional and requires your own free Supabase project.')}
 <div class="grid-main"><div><div class="card"><div class="card-header"><h2>Display & metronome</h2>${ic('settings')}</div><div class="form-row"><div class="form-group"><label>Theme</label><select data-setting="theme"><option value="dark" ${state.settings.theme==='dark'?'selected':''}>Dark</option><option value="light" ${state.settings.theme==='light'?'selected':''}>Light</option></select></div><div class="form-group"><label>Default BPM</label><input type="number" id="setting-bpm" class="field" min="30" max="240" value="${state.settings.defaultBpm}"/></div></div><div class="buttons" style="margin-top:12px">${btn('save-bpm','Save default BPM')}</div><p class="footnote">All drills can be used without an account or internet access after the site has been cached.</p></div>
 <div class="card" style="margin-top:18px"><div class="card-header"><h2>Supabase cloud sync</h2>${ic('cloud')}</div><p><strong>For Mac, Windows and iPhone sync.</strong> Create a free Supabase project, run the provided SQL schema, then use its Project URL and public publishable/anon key below. Never use a secret/service_role key.</p><div class="form-group"><label for="cloud-url">Project URL</label><input class="field" id="cloud-url" autocomplete="off" placeholder="https://your-project.supabase.co" value="${safe(state.cloud.url||'')}"/></div><div class="form-group" style="margin-top:12px"><label for="cloud-key">Publishable / anon key (public)</label><input class="field" id="cloud-key" autocomplete="off" placeholder="sb_publishable_… or legacy eyJ…" value="${safe(state.cloud.key||'')}"/></div><div class="buttons" style="margin-top:14px">${btn('cloud-config-save','Save cloud settings','primary')}${btn('cloud-sync',`${ic('refresh')} Sync now`)}</div><p id="cloud-status" class="status ${cloudKind}" style="margin-top:12px">${safe(cloudMessage)}</p><div class="divider"></div>
 ${cloud.user?`<p class="small"><strong>Signed in:</strong> ${safe(cloud.user.email||cloud.user.id)}</p>${btn('cloud-sign-out','Sign out','ghost')}`:`<div class="form-row"><div class="form-group"><label>Email for sign-in link</label><input type="email" id="cloud-email" class="field" placeholder="you@example.com"/></div>${btn('cloud-login','Send magic link','primary')}</div><p class="footnote">Configure the exact GitHub Pages URL under Supabase Authentication → URL Configuration → Redirect URLs. A new device will need you to open the same site and sign in.</p>`}
 <div class="alert" style="margin-top:16px">Free Supabase projects can pause if insufficiently active. When sync fails, local practice records are retained; resume your project in Supabase and press Sync now.</div></div>
 <div class="card" style="margin-top:18px"><h2>Backups & restoration</h2><p>Keep periodic JSON backups. Import merges by record ID, so the same record is not duplicated.</p><div class="buttons">${btn('export-json',`${ic('download')} Download JSON`)}${btn('export-csv','Download CSV')}</div><div class="form-group" style="margin-top:14px"><label for="import-file">Import previous JSON backup</label><input type="file" class="field" accept="application/json,.json" id="import-file"/></div><p class="footnote">Import adds historical records; it doesn't erase existing records. Local in-progress sessions are not synchronized until completed.</p></div></div>
 <aside><div class="card"><div class="eyebrow">Your data</div><h2 style="margin-top:12px">Small, portable, private</h2><p>Practice logs and song notes are stored in your browser first. When signed in, they are copied to your own Supabase table with row-level security.</p><div class="divider"></div><p>GitHub Pages hosts only the code. It does not store private performance results.</p><p>For cloud access, use the same email login on every device. The public Project URL and publishable key can be saved in <code>config.js</code> so devices automatically know your project even after site data is cleared.</p><p class="small">Clearing site data removes this browser's sign-in session and unsynchronized local logs. Sign in again using your email magic link, then sync from the cloud. Keep periodic JSON backups.</p><div class="divider"></div><p class="small">Version ${APP_VERSION} · No analytics trackers · No paid API dependencies</p><p><a href="#releases" class="btn full">${ic('book')} View release history</a></p></div></aside></div>`;}

class Metronome{
 constructor(){this.playing=false;this.ctx=null;this.handle=null;this.nextBeat=0;this.beat=0;}
 async toggle(){if(this.playing){this.stop();return;}try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Web Audio unavailable.');this.ctx=this.ctx||new Audio();await this.ctx.resume();this.playing=true;this.beat=0;this.nextBeat=this.ctx.currentTime+.08;this.handle=setInterval(()=>this.schedule(),25);this.schedule();}catch(err){showToast('Cannot start audio: '+err.message);this.stop();}}
 click(at,accent=false,soft=false){const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(accent?1100:soft?610:850,at);gain.gain.setValueAtTime(0.0001,at);gain.gain.exponentialRampToValueAtTime(soft?.10:.22,at+.005);gain.gain.exponentialRampToValueAtTime(.0001,at+.065);osc.connect(gain).connect(this.ctx.destination);osc.start(at);osc.stop(at+.073);}
 schedule(){if(!this.ctx||!this.playing)return;const bpm=Math.max(30,Math.min(240,Number(state.settings.defaultBpm)||70)),sub=state.settings.subdivision,compound=state.settings.meter==='6/8';const duration=60/bpm;let loop=0;
 while(this.nextBeat<this.ctx.currentTime+.16&&loop++<12){const accent=this.beat%(compound?2:4)===0;this.click(this.nextBeat,accent);
  if(sub==='swing'&&!compound)this.click(this.nextBeat+duration*2/3,false,true);
  if(sub==='triplet'||(compound&&sub==='quarter')){this.click(this.nextBeat+duration/3,false,true);this.click(this.nextBeat+duration*2/3,false,true);}
  this.nextBeat+=duration;this.beat++;}}
 stop(){if(this.handle)clearInterval(this.handle);this.handle=null;this.playing=false;}
}
const metronome=new Metronome();
// Prepare the audio while handling a user click, as required by browsers.
let timerAudioCtx=null;
async function armTimerAudio(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;timerAudioCtx=timerAudioCtx||new Audio();await timerAudioCtx.resume();}catch(e){console.info('Timer audio unavailable',e);}}
function playTimerChime(){try{if(!timerAudioCtx||timerAudioCtx.state!=='running')return;const base=timerAudioCtx.currentTime+.015;
 [880,1100,1320].forEach((frequency,i)=>{const at=base+i*.23,osc=timerAudioCtx.createOscillator(),gain=timerAudioCtx.createGain();osc.type='sine';osc.frequency.setValueAtTime(frequency,at);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.17,at+.018);gain.gain.exponentialRampToValueAtTime(.0001,at+.18);osc.connect(gain).connect(timerAudioCtx.destination);osc.start(at);osc.stop(at+.20);});}catch(e){console.info('Timer chime unavailable',e);}}
function changeTempo(n){const bpm=Math.min(240,Math.max(30,Number(state.settings.defaultBpm)+n));state.settings.defaultBpm=bpm;saveState(state);const value=$('current-bpm');if(value)value.textContent=bpm;
 // The audio scheduler reads state.settings.defaultBpm on every tick, so it
 // changes tempo naturally without stopping the click or resetting its beat.
 render();}
function pauseTimer(){if(state.active?.startedAt){state.active.elapsedMs=Math.max(0,(state.active.elapsedMs||0)+Date.now()-state.active.startedAt);state.active.startedAt=null;saveState(state);}}
async function toggleTimer(){const a=state.active;if(!a)return;if(a.startedAt){pauseTimer();}else{
 await armTimerAudio();if(!state.active||state.active!==a)return;
 if(clockMs()>=a.entries[a.position].minutes*60000){a.elapsedMs=0;a.timerNotifiedFor=-1;}
 a.startedAt=Date.now();saveState(state);
 }render();}
function startSession(isFree=false,drillId=null,songId=null){if(state.active){setRoute('practice');return;}const mode=state.settings.selectedMode,day=countSessions();const a=makeSession(day,mode,state.settings.selectedSong,state.settings.selectedDuration||45);a.isFree=isFree;
 if(state.settings.selectedKey!=='auto')a.key=state.settings.selectedKey;
 if(isFree){a.entries=[{id:drillId||'song',minutes:drillId?DRILL_BY_ID[drillId].minutes:12,done:false}];a.songId=songId||a.songId;}
 state.active=a;saveState(state);showRating=false;diagramStep=-1;setRoute('practice');}
function finishCurrent(percent,issue){
 if(!Number.isInteger(percent)||percent<0||percent>100||percent%10!==0){showToast('Choose a quality score in 10% steps.');return;}
const a=state.active,entry=currentDrill();if(!entry)return;pauseTimer();metronome.stop();const drillId=entry.id==='song'?`song:${a.songId}`:entry.id;
 const appFeedback=$('app-feedback-text')?.value?.trim()?.slice(0,1200)||'';
 const appFeedbackType=appFeedback?$('app-feedback-type')?.value||'general':'';
 const publicFeedbackConsent=Boolean(appFeedback&&$('app-feedback-public')?.checked);
 const publicFeedbackId=publicFeedbackConsent?uid():null;
 const p={sessionId:a.id,drillId,key:a.key,bpm:Number(state.settings.defaultBpm),ratingPct:percent,issue:issue||'none',seconds:Math.round(clockMs()/1000),subdivision:state.settings.subdivision,position:state.settings.position,meter:state.settings.meter,mode:a.mode,dayNumber:a.dayNumber,appFeedback,appFeedbackType,publicFeedbackConsent,publicFeedbackId};addRecord(state,'drill',p);
 if(entry.id==='song'){const previous=latestSong(a.songId)||{};addRecord(state,'song',{...previous,songId:a.songId,readiness:previous.readiness||'developing',notes:[previous.notes,'Practice session: '+percent+'% self-assessed execution'].filter(Boolean).join(' | '),minutes:entry.minutes,fromSession:true});}
 entry.done=true;entry.ratingPct=percent;entry.bpm=p.bpm;entry.seconds=p.seconds;a.position++;a.elapsedMs=0;a.startedAt=null;a.timerNotifiedFor=-1;saveState(state);showRating=false;diagramStep=-1;cloud.sync();render();}
function finishEarly(){if(!state.active)return;pauseTimer();metronome.stop();state.active.position=state.active.entries.length;saveState(state);render();}
function saveCompletedSession(){const a=state.active;if(!a)return;pauseTimer();metronome.stop();a.notes=$('session-notes')?.value?.trim()||'';const seconds=a.entries.reduce((total,x)=>total+(x.seconds||0),0);addRecord(state,'session',{sessionId:a.id,key:a.key,mode:a.mode,dayNumber:a.dayNumber,songId:a.songId,drillsCompleted:a.entries.filter(x=>x.done).length,drillsPlanned:a.entries.length,durationMinutes:Math.round(seconds/60),plannedMinutes:a.entries.reduce((sum,e)=>sum+e.minutes,0),notes:a.notes,isFree:a.isFree});state.active=null;saveState(state);cloud.sync();showToast('Session saved. Your next key is ready.');setRoute('progress');}
function addManualSongFromForm(){
 try{
  const get=id=>$(id)?.value||'';
  const song=newCustomSong({
   title:get('new-song-title'),meter:get('new-song-meter'),initialKey:get('new-song-key'),
   initialTempo:get('new-song-bpm'),focus:get('new-song-focus'),
   suggested:get('new-song-drill'),notes:get('new-song-notes')
  },allSongs());
  addRecord(state,CUSTOM_SONG_KIND,song);
  cloud.sync();
  setRoute('song/'+song.id);
  showToast('Song added to your repertoire');
 }catch(error){showToast('Could not add song: '+error.message);}
}
function saveSong(id){const s=allSongs().find(x=>x.id===id);if(!s)return;const tempo=Number($('song-tempo')?.value||0);const key=$('song-key')?.value?.trim()?.slice(0,12)||'';const notes=$('song-notes')?.value?.trim()||'';const readiness=$('song-readiness')?.value||'learning';const sections=[...document.querySelectorAll('input[data-song-section]:checked')].map(x=>x.dataset.songSection);
 addRecord(state,'song',{songId:id,key,tempo:tempo>=30&&tempo<=260?tempo:null,readiness,sections,notes});cloud.sync();showToast('Song profile saved');render();}
function exportJson(){const data={app:'Guitar Practice Lab',version:APP_VERSION,exportedAt:new Date().toISOString(),records:state.records,settings:state.settings};downloadText(`guitar-practice-lab-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(data,null,2),'application/json');}
async function copyWeekly(){const report=weeklyReport(state);try{await navigator.clipboard.writeText(report);showToast('7-day report copied. Paste it into ChatGPT.');}catch{downloadWeekly();showToast('Clipboard unavailable. Downloaded report instead.');}}
function downloadWeekly(){downloadText(`guitar-practice-weekly-${new Date().toISOString().slice(0,10)}.md`,weeklyReport(state),'text/markdown');}

function appFeedbackReport(){const rows=state.records.filter(r=>r.kind==='drill'&&r.payload?.appFeedback?.trim());
 return ['# Guitar Practice Lab — improvement feedback','Collected notes: '+rows.length+'. Generated: '+new Date().toLocaleDateString()+'.',
 ...rows.map(r=>{const p=r.payload;const title=DRILL_BY_ID[p.drillId]?.title||p.drillId||'Song practice';return '- '+r.created_at.slice(0,10)+' | '+title+' | '+(p.appFeedbackType||'general')+' | '+p.appFeedback;})].join('\n');}
async function copyAppFeedback(){const notes=state.records.filter(r=>r.kind==='drill'&&r.payload?.appFeedback?.trim());if(!notes.length){showToast('No app feedback recorded yet.');return;}
 const report=appFeedbackReport();try{await navigator.clipboard.writeText(report);showToast(notes.length+' app-feedback note(s) copied. Paste into ChatGPT.');}catch{downloadText('guitar-practice-app-feedback.md',report,'text/markdown');showToast('Clipboard unavailable. Feedback report downloaded.');}}
function setRatingPercent(value){
 ratingPercent=Math.max(0,Math.min(100,Math.round(Number(value)/10)*10));
 const shown=$('rating-percent');if(shown)shown.textContent=ratingPercent+'%';
 document.querySelectorAll('[data-rating-value]').forEach(button=>{
  const selected=Number(button.dataset.ratingValue)===ratingPercent;
  button.classList.toggle('selected',selected);
  button.setAttribute('aria-pressed',String(selected));
 });
 const save=document.querySelector('[data-action="rating-save"]');
 if(save)save.textContent='Save '+ratingPercent+'% & continue';
}
function movePracticeStage(delta){
 const entry=currentDrill(),drill=DRILL_BY_ID[entry?.id];if(!entry||!drill||!stageCount(drill))return;
 const next=clampedStageIndex(drill,clampedStageIndex(drill,entry.stageIndex)+delta);
 if(next===clampedStageIndex(drill,entry.stageIndex))return;
 entry.stageIndex=next;diagramStep=currentStage(drill,next)?.activeNote??-1;
 saveState(state);render();
}
const actions={
 'mode-positions-next':()=>{const idx=CAGED_REGIONS.findIndex(s=>s.id===modalPosition);modalPosition=CAGED_REGIONS[(idx+1)%CAGED_REGIONS.length].id;render();},
 'mode-back':()=>{modalStep=Math.max(-1,modalStep-1);render();},
 'mode-next':()=>{const n=scaleFor(modalId,modalKey).intervals.length;modalStep=(modalStep+1)%n;render();},
 'mode-reset':()=>{modalStep=-1;render();},
 'add-manual-song':addManualSongFromForm,
 'vocab-prev':()=>{vocabularyNote=Math.max(-1,vocabularyNote-1);render();},
 'vocab-next':()=>{vocabularyNote=(vocabularyNote+1)%vocabularyNotes(vocabularyStudy,vocabularyKey).length;render();},
 'vocab-reset':()=>{vocabularyNote=-1;render();},
 'home-pitch-play':async()=>{
   try{metronome.stop();stopHarmonyPlayback();songTrackPlayer.pause();await referencePitch.toggle(selectedHomePitch);}
   catch(error){showToast('Reference tone unavailable: '+error.message);}
   render();
 },
 'home-metro-play':async()=>{referencePitch.stop();stopHarmonyPlayback();songTrackPlayer.pause();await metronome.toggle();render();},
 'home-bpm-up':()=>changeTempo(5),
 'home-bpm-down':()=>changeTempo(-5),
 'home-bpm-tap':()=>{
   const result=registerTempoTap(homeTempoTaps,Date.now());homeTempoTaps=result.taps;
   if(result.bpm!==null){state.settings.defaultBpm=result.bpm;saveState(state);}
   render();
 },

 'harmony-play':toggleHarmonyPlayback,'harmony-stop':stopHarmonyPlayback,
 'harmony-slower':()=>harmonyTempoChange(-5),'harmony-faster':()=>harmonyTempoChange(5),
 'harmony-log':logHarmonyAttempt,
 'track-play':async()=>{metronome.stop();stopHarmonyPlayback();try{await songTrackPlayer.play();}catch(error){showToast('Cannot play track: '+error.message);}},
 'track-pause':()=>songTrackPlayer.pause(),'track-stop':()=>songTrackPlayer.stop(),
 'track-a':()=>{if(!songTrackPlayer.markA())showToast('Choose a track before setting loop A.');},
 'track-b':()=>{if(!songTrackPlayer.markB())showToast('First set loop A, then move forward at least one second.');},
 'track-clear-loop':()=>songTrackPlayer.clearAB(),
 'start-session':()=>startSession(), 'resume-session':()=>setRoute('practice'),'stage-prev':()=>movePracticeStage(-1),'stage-next':()=>movePracticeStage(1),'toggle-timer':toggleTimer,'tempo-up':()=>changeTempo(5),'tempo-down':()=>changeTempo(-5),
 'metro-toggle':async()=>{await metronome.toggle();const label=$('metro-label');if(label)label.textContent=metronome.playing?'Stop click':'Metronome';},
 'rating-open':()=>{pauseTimer();ratingPercent=80;showRating=true;render();},'rating-cancel':()=>{showRating=false;render();},
 'rating-decrement':()=>setRatingPercent(ratingPercent-10),'rating-increment':()=>setRatingPercent(ratingPercent+10),
 'rating-save':()=>finishCurrent(ratingPercent,$('drill-issue')?.value),
 'skip-drill':()=>{pauseTimer();metronome.stop();if(state.active){state.active.position++;state.active.startedAt=null;state.active.elapsedMs=0;saveState(state);render();}},
 'end-early':finishEarly,'save-session':saveCompletedSession,'resume-last':()=>{const a=state.active;if(a){a.position=Math.max(0,a.entries.length-1);saveState(state);render();}},
 'diagram-tab':()=>{state.settings.diagram='tab';saveState(state);render();},'diagram-fretboard':()=>{state.settings.diagram='fretboard';saveState(state);render();},
 'labels-note':()=>{state.settings.labels='note';saveState(state);render();},'labels-interval':()=>{state.settings.labels='interval';saveState(state);render();},'labels-hidden':()=>{state.settings.labels='hidden';saveState(state);render();},
 'step-next':()=>{const d=DRILL_BY_ID[currentDrill()?.id];const count=buildExample(currentStage(d,currentDrill()?.stageIndex)?.exampleKind||d.kind,state.active.key,d.quality||'maj7',d.octaves||2,state.settings.position).length;diagramStep=Math.min(count-1,diagramStep+1);render();},
 'step-prev':()=>{diagramStep=Math.max(-1,diagramStep-1);render();},
 'copy-weekly':copyWeekly,'download-weekly':downloadWeekly,'copy-app-feedback':copyAppFeedback,'export-json':exportJson,'export-csv':()=>downloadText(`guitar-practice-${new Date().toISOString().slice(0,10)}.csv`,exportCsv(state),'text/csv;charset=utf-8'),
 'save-bpm':()=>{const value=Number($('setting-bpm')?.value);if(value<30||value>240){showToast('Choose between 30 and 240 BPM');return;}state.settings.defaultBpm=value;saveState(state);showToast('Default tempo saved');render();},
 'cloud-config-save':async()=>{state.cloud.url=$('cloud-url')?.value?.trim()||'';state.cloud.key=$('cloud-key')?.value?.trim()||'';saveState(state);cloud.client=null;cloud.user=null;await cloud.init();showToast('Cloud configuration stored on this device.');render();},
 'cloud-login':async()=>{try{await cloud.signIn($('cloud-email')?.value?.trim()||'');render();}catch(err){cloud.status('Sign-in failed: '+err.message,'error');showToast(err.message);}},
 'cloud-sign-out':async()=>{try{await cloud.signOut();render();}catch(err){showToast(err.message);}},
 'cloud-sync':async()=>{if(!cloud.client)await cloud.init();if(!cloud.user){showToast('Sign in before syncing.');return;}await cloud.sync();render();}
};
// Practice-only keys: preserve typing, focused buttons/links, native form controls and system shortcuts.
function handlePracticeShortcut(ev){
 if(route().page!=='practice'||!state.active||!currentDrill()||showRating)return false;
 if(ev.defaultPrevented||ev.altKey||ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.isComposing)return false;
 const target=ev.target;
 if(target?.closest?.('input,textarea,select,button,a,[contenteditable],[role="textbox"],[role="button"],[role="combobox"],[role="slider"]'))return false;
 if(ev.key===' '||ev.code==='Space'){
  if(ev.repeat)return false;
  ev.preventDefault();
  void toggleTimer().catch(error=>{console.error(error);showToast('Timer shortcut failed: '+error.message);});
  return true;
 }
 if(ev.key==='ArrowUp'||ev.key==='ArrowDown'){
  ev.preventDefault();changeTempo(ev.key==='ArrowUp'?5:-5);return true;
 }
 if(ev.key==='Enter'){
  if(ev.repeat)return false;
  const entry=currentDrill(),drill=DRILL_BY_ID[entry?.id];
  if(!drill||stageCount(drill)<1||clampedStageIndex(drill,entry.stageIndex)>=stageCount(drill)-1)return false;
  ev.preventDefault();movePracticeStage(1);return true;
 }
 return false;
}
document.addEventListener('keydown',handlePracticeShortcut);
document.addEventListener('click',async ev=>{const btn=ev.target.closest('[data-action]');if(!btn)return;ev.preventDefault();const name=btn.dataset.action;if(name?.startsWith('mode-step:')){const i=Number(name.slice(10));if(Number.isInteger(i)&&i>=0&&i<scaleFor(modalId,modalKey).intervals.length){modalStep=i;render();}return;}if(name?.startsWith('home-pitch:')){
 const midi=Number(name.slice(11));
 if(PITCH_CHOICES.some(p=>p.midi===midi)){
  selectedHomePitch=midi;referencePitch.stop();
  try{metronome.stop();stopHarmonyPlayback();songTrackPlayer.pause();await referencePitch.toggle(midi);}
  catch(error){showToast('Reference tone unavailable: '+error.message);}
  render();
 }
 return;
}
 if(name?.startsWith('pentatonic-box:')){
  const box=Number(name.slice(15));if(Number.isInteger(box)&&box>=1&&box<=5){pentatonicBox=box;diagramStep=-1;render();}return;
 }
 if(name?.startsWith('dom-root:')){
  const root=name.slice(9);if(root==='E'||root==='A'){dominantRootString=root;diagramStep=-1;render();}return;
 }
 if(name?.startsWith('modal-position:')){
  const wanted=name.slice(15);
  if(CAGED_REGIONS.some(s=>s.id===wanted)){modalPosition=wanted;render();}
  return;
 }
 if(name?.startsWith('drill-filter:'))return setDrillCategory(name.slice(13));if(name?.startsWith('start-free:'))return startSession(true,name.slice(11));if(name?.startsWith('song-focus:'))return startSession(true,null,name.slice(11));if(name?.startsWith('save-song:'))return saveSong(name.slice(10));if(name?.startsWith('rating-set:'))return setRatingPercent(Number(name.slice(11)));const handler=actions[name];if(handler){try{await handler();}catch(error){console.error(error);showToast('Action failed: '+error.message);}}});
document.addEventListener('change',async ev=>{const el=ev.target;
 if(el.dataset.vocabulary){
  const category=el.dataset.vocabulary;
  if(category==='artist'&&ARTIST_PROFILES.some(p=>p.id===el.value)){
   vocabularyArtist=el.value;vocabularyStudy=VOCAB_STUDIES.find(s=>s.artist===vocabularyArtist).id;
  }else if(category==='study'&&VOCAB_STUDIES.some(s=>s.id===el.value&&s.artist===vocabularyArtist)){vocabularyStudy=el.value;}
  else if(category==='key'&&KEYS.includes(el.value)){vocabularyKey=el.value;}
  vocabularyNote=-1;render();return;
 }
 if(el.dataset.theory){
  const prop=el.dataset.theory;
  if(prop==='family'&&MODE_FAMILIES.some(f=>f.id===el.value)){
   modalFamily=el.value;modalId=MODE_DEFINITIONS.find(m=>m.family===modalFamily).id;
  }else if(prop==='mode'&&MODE_DEFINITIONS.some(m=>m.id===el.value&&m.family===modalFamily)){modalId=el.value;}
  else if(prop==='key'&&KEYS.includes(el.value)){modalKey=el.value;}
  modalStep=-1;render();return;
 }

 if(el.id==='home-chromatic-note'){
  const midi=Number(el.value);
  if(PITCH_CHOICES.some(p=>p.midi===midi)){selectedHomePitch=midi;referencePitch.stop();render();}
  return;
 }

 if(el.dataset.harmonySetting){const key=el.dataset.harmonySetting;
  harmonySettings[key]=key==='click'?el.checked:key==='barsPerChord'?Number(el.value):key==='volume'?Number(el.value):el.value;
  state.settings.harmony={...harmonySettings};saveState(state);
  if(key==='volume'){harmonyBacking.setVolume(harmonySettings.volume);return;}
  if(key==='reverb'){harmonyBacking.setReverb(harmonySettings.reverb);return;}
  if(key==='click'){harmonyBacking.setClick(harmonySettings.click);return;}
  stopHarmonyPlayback();render();return;
 }
 if(el.id==='song-track-file'&&el.files?.[0]){try{songTrackPlayer.load(el.files[0],route().page==='song'?route().id:state.active?.songId);render();showToast('Local track loaded. Press Play to rehearse.');}catch(error){showToast('Cannot load track: '+error.message);}return;}
 if(el.id==='track-seek'){songTrackPlayer.seek(Number(el.value));return;}
 if(el.id==='track-volume'){songTrackPlayer.setVolume(Number(el.value));return;}
 if(el.dataset.trackLoop!==undefined){songTrackPlayer.setFullLoop(el.checked);return;}
if(el.dataset.setting){let value=el.value;if(el.dataset.setting==='selectedMode'&&state.active)return;state.settings[el.dataset.setting]=value;saveState(state);if(el.dataset.setting==='theme')document.body.dataset.theme=value;render();if(['subdivision','meter'].includes(el.dataset.setting)&&metronome.playing)metronome.stop();}
 if(el.id==='import-file'&&el.files?.[0]){try{const file=el.files[0];if(file.size>25_000_000)throw Error('File is larger than 25 MB.');const json=JSON.parse(await file.text());const added=importedSnapshot(state,json);showToast(`${added} records imported. Existing records preserved.`);cloud.sync();render();}catch(error){showToast('Import failed: '+error.message);}}
});
document.addEventListener('input',ev=>{if(ev.target.id==='drill-search'){drillSearchText=ev.target.value;filterDrills();}if(ev.target.id==='session-notes'&&state.active){state.active.notes=ev.target.value;saveState(state);}});
function setDrillCategory(category){
 if(category!=='all'&&!CATEGORIES.some(c=>c[0]===category))return;
 selectedDrillCategory=category;
 document.querySelectorAll('[data-drill-filter]').forEach(pill=>{
  const active=pill.dataset.drillFilter===category;
  pill.classList.toggle('active',active);pill.setAttribute('aria-pressed',String(active));
 });
 const search=$('drill-search');
 if(search)search.placeholder='Search within '+(category==='all'?'all drills':categoryTitle(category))+'…';
 filterDrills();
}
function filterDrills(){
 const q=drillSearchText.trim().toLowerCase(),cat=selectedDrillCategory;
 let count=0;
 document.querySelectorAll('.drill-search-row').forEach(row=>{
  const visible=row.dataset.search.includes(q)&&(cat==='all'||row.dataset.category===cat);
  row.classList.toggle('hide',!visible);
  if(visible)count++;
 });
 const result=$('drill-filter-result');
 if(result)result.textContent=count+' of '+DRILLS.length+' drills shown'+(cat==='all'?'':' · '+categoryTitle(cat));
 const empty=$('drill-filter-empty');if(empty)empty.classList.toggle('hide',count!==0);
}
window.addEventListener('hashchange',()=>{const r=route();if(r.page!=='harmony')stopHarmonyPlayback();
 const stillRelevant=(r.page==='song'&&r.id===songTrackPlayer.songId)||(r.page==='practice'&&state.active?.entries?.[state.active?.position]?.id==='song'&&state.active?.songId===songTrackPlayer.songId);
 if(!stillRelevant)songTrackPlayer.pause();
 showRating=false;diagramStep=-1;render();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseTimer();metronome.stop();stopHarmonyPlayback();songTrackPlayer.pause();referencePitch.stop();}});
window.addEventListener('beforeunload',()=>{pauseTimer();metronome.stop();stopHarmonyPlayback();songTrackPlayer.dispose();referencePitch.dispose();});
setInterval(()=>{updateClock();if(state.active?.startedAt)saveState(state);},1000);
setInterval(()=>{if(cloud.user&&!document.hidden)cloud.sync();},120000);
render();if(cloud.configured)cloud.init();
if('serviceWorker' in navigator&&location.protocol==='https:'){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(err=>console.info('Offline cache not installed',err)));}
