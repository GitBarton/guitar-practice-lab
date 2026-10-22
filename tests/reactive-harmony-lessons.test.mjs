import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {KEYS} from '../data.js';
import {harmonyLesson,HARMONY_LESSON_FOCI} from '../practice-coach.js';
import {buildTwoFiveOne} from '../harmony.js';
const open=[64,59,55,50,45,40];

test('all keys, major/minor, lesson modes and variations produce actual playable target pitches',()=>{
 for(const key of KEYS)for(const mode of ['major','minor'])for(const {id:focus} of HARMONY_LESSON_FOCI)
 for(const chordIndex of [0,1,2])for(const position of ['low','mid'])for(const challenge of [0,1,2,3]){
  const lesson=harmonyLesson({key,mode,focus,chordIndex,position,challenge});
  assert.ok(lesson.cue.length>20);assert.ok(lesson.notes.length);
  for(const note of lesson.notes){
   assert.equal(note.midi,open[note.string]+note.fret);
   assert.ok(note.fret>=0&&note.fret<=22);
   if(!note.interval.includes('neighbor'))assert.ok(lesson.chord.midi.some(m=>m%12===note.pc),key+' '+mode+' '+focus);
  }
 }
});
test('minor tonic guide tones are third and sixth, not an invented seventh; minor V includes b9',()=>{
 const minor=harmonyLesson({key:'C',mode:'minor',focus:'guide',chordIndex:2});
 assert.equal(minor.chord.label,'Cm6');assert.deepEqual(minor.notes.map(n=>n.interval),['♭3','6']);
 assert.deepEqual(minor.notes.map(n=>n.pc),[3,9]);assert.match(minor.cue,/no seventh/);
 const dominant=harmonyLesson({key:'C',mode:'minor',focus:'arpeggio',chordIndex:1});
 assert.deepEqual(dominant.notes.map(n=>n.interval),['1','3','5','♭7','♭9']);
 assert.deepEqual(dominant.notes.map(n=>n.pc),[7,11,2,5,8]);
});
test('V enclosure has chromatic neighbors around its third and resolves to the proper tonic third',()=>{
 for(const key of KEYS)for(const mode of ['major','minor']){
  const enclosure=harmonyLesson({key,mode,focus:'enclosure',chordIndex:1});
  const [upper,lower,target]=enclosure.notes;
  assert.equal((upper.pc-target.pc+12)%12,1);assert.equal((target.pc-lower.pc+12)%12,1);
  assert.equal(target.pc,enclosure.chord.midi[1]%12);
  const tonic=harmonyLesson({key,mode,focus:'enclosure',chordIndex:2});
  assert.equal(tonic.notes.length,1);assert.equal(tonic.notes[0].pc,tonic.chord.midi[1]%12);
 }
});
test('root challenge changes register and invalid lesson selections fail clearly',()=>{
 const low=harmonyLesson({key:'C',challenge:0}),high=harmonyLesson({key:'C',challenge:1});
 assert.equal(high.notes[0].midi-low.notes[0].midi,12);
 for(const options of [{focus:'guess'},{chordIndex:3},{position:'random'},{mode:'other'},{key:'Q'}])assert.throws(()=>harmonyLesson(options));
});

test('real zone controls preserve audio/notes/score, support silent preview, and log lesson context',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const lessons=app.slice(app.indexOf('function currentHarmonyLesson(){'),app.indexOf('function renderHarmony(){'));
 const logging=app.slice(app.indexOf('function logHarmonyAttempt(){'),app.indexOf('function renderSongs(){'));
 const elements={
  'harmony-lesson-target':{dataset:{},innerHTML:''},'harmony-lesson-focus':{value:'roots'},
  'harmony-score':{value:'90'},'harmony-notes':{value:'Minor resolution improved'},
  'harmony-next-focus':{value:'Connect guide tones'}
 };
 const preview={disabled:false},settings={key:'C',mode:'minor',focus:'roots',guitarPosition:'low',tempo:75,barsPerChord:2};
 const draft={ratingPct:90,notes:elements['harmony-notes'].value,nextFocus:elements['harmony-next-focus'].value};
 const state={settings:{},records:[{id:'old'}],active:{elapsedMs:30000}};
 const ctx={harmonySettings:settings,harmonyDraft:draft,harmonyBacking:{playing:false},harmonyPosition:null,
  harmonyPreviewChord:0,harmonyChallenge:0,harmonyStarted:0,harmonyElapsed:0,HARMONY_LESSON_FOCI,harmonyLesson,
  state,buildTwoFiveOne,$:id=>elements[id],document:{querySelector:()=>preview},saveState:()=>{},
  updateHarmonyUI:()=>ctx.updateHarmonyLessonUI(),safe:String,renderGuitarStaff:notes=>notes.map(n=>n.name).join(' '),
  renderFretboardSvg:()=>'<svg/>',btn:()=>'',addRecord:(s,kind,payload)=>s.records.push({kind,payload}),
  cloud:{sync(){}},showToast:()=>{}};
 vm.createContext(ctx);vm.runInContext(lessons+'\n'+logging,ctx);
 ctx.changeHarmonyLesson('preview');assert.equal(ctx.currentHarmonyLesson().chord.label,'G7♭9');
 ctx.changeHarmonyLesson('next');assert.equal(settings.focus,'guide');
 ctx.harmonyBacking.playing=true;ctx.harmonyPosition={chordIndex:2,beat:1};ctx.updateHarmonyLessonUI();
 assert.match(elements['harmony-lesson-target'].innerHTML,/Cm6/);assert.equal(preview.disabled,true);
 const html=elements['harmony-lesson-target'].innerHTML;ctx.harmonyPosition.beat=2;ctx.updateHarmonyLessonUI();
 assert.equal(elements['harmony-lesson-target'].innerHTML,html,'beat updates preserve target DOM');
 ctx.changeHarmonyLesson('preview');assert.equal(ctx.harmonyPreviewChord,1,'no competing silent cursor during audio');
 const started=ctx.harmonyStarted;ctx.changeHarmonyLesson('challenge');assert.equal(ctx.harmonyChallenge,1);
 ctx.changeHarmonyLesson('repeat');assert.equal(ctx.harmonyChallenge,0);assert.equal(ctx.harmonyStarted,started);
 assert.equal(elements['harmony-notes'].value,'Minor resolution improved');assert.equal(elements['harmony-score'].value,'90');
 assert.equal(state.active.elapsedMs,30000);ctx.logHarmonyAttempt();
 const record=state.records.at(-1).payload;
 assert.equal(record.focus,'guide');assert.equal(record.harmonyMode,'minor');assert.equal(record.key,'C');
 assert.equal(record.ratingPct,90);assert.equal(record.voicingFamily,'root-position');assert.equal(record.nextFocus,'Connect guide tones');
 assert.equal(state.records[0].id,'old');assert.equal(draft.notes,'');assert.equal(draft.nextFocus,'');
});
