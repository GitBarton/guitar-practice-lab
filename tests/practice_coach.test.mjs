import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS,DRILL_BY_ID,stageCount,currentStage} from '../data.js';
import {keyPc} from '../music.js';
import {buildTwoFiveOne} from '../harmony.js';
import {coachTargets,coachStageDescription} from '../practice-coach.js';
const OPEN=[64,59,55,50,45,40];
const variants=['coach-thirds','coach-sevenths','coach-roots','coach-seconds','coach-fifths','coach-guide','coach-v-third','coach-lower-approach','coach-enclosure','coach-tonic-third'];

test('coached stages are distinct and pitch-correct in all twelve keys',()=>{
 for(const key of KEYS){
  const c=keyPc(key),chords=buildTwoFiveOne(key).chords;
  for(const kind of variants){
   const notes=coachTargets(kind,key);
   assert.ok(notes.length>=1,kind+' '+key);
   for(const n of notes){
    assert.equal(OPEN[n.string]+n.fret,n.midi);
    assert.equal(n.pc,n.midi%12);
    assert.ok(n.fret>=0&&n.fret<=22,key+' '+kind);
    assert.ok(n.name);
    assert.ok(chords.some(ch=>ch.label===n.chord),'target must identify a real chord');
   }
   assert.equal(coachStageDescription(kind,key).targetName,notes.at(-1).name);
  }
  const roots=coachTargets('coach-roots',key);
  assert.deepEqual(roots.map(n=>n.pc),[(c+2)%12,(c+7)%12,c]);
  const thirds=coachTargets('coach-thirds',key);
  assert.deepEqual(thirds.map(n=>n.pc),[(c+5)%12,(c+11)%12,(c+4)%12]);
  const sevenths=coachTargets('coach-sevenths',key);
  assert.deepEqual(sevenths.map(n=>n.pc),[c,(c+5)%12,(c+11)%12]);
  const fifths=coachTargets('coach-fifths',key);
  assert.deepEqual(fifths.map(n=>n.pc),[(c+9)%12,(c+2)%12,(c+7)%12]);
  const seconds=coachTargets('coach-seconds',key);
  assert.deepEqual(seconds.map(n=>n.pc),[(c+4)%12,(c+9)%12,(c+2)%12]);
 }
});
test('chromatic approach and enclosure are adjacent semitones in every key',()=>{
 for(const key of KEYS){
  const target=coachTargets('coach-v-third',key)[0];
  const lower=coachTargets('coach-lower-approach',key);
  const enclosed=coachTargets('coach-enclosure',key);
  assert.deepEqual(lower.map(n=>n.midi),[target.midi-1,target.midi]);
  assert.deepEqual(enclosed.map(n=>n.midi),[target.midi+1,target.midi-1,target.midi]);
  assert.equal(target.pc,(keyPc(key)+11)%12);
  assert.equal(coachTargets('coach-tonic-third',key)[0].pc,(keyPc(key)+4)%12);
 }
});
test('C major examples are exact guide-tone and chromatic target pitches',()=>{
 assert.deepEqual(coachTargets('coach-thirds','C').map(n=>n.name.replace(/[0-9]+$/,'')),['F','B','E']);
 assert.deepEqual(coachTargets('coach-sevenths','C').map(n=>n.name.replace(/[0-9]+$/,'')),['C','F','B']);
 assert.deepEqual(coachTargets('coach-lower-approach','C').map(n=>n.name),['Bb4','B4']);
 assert.deepEqual(coachTargets('coach-enclosure','C').map(n=>n.name),['C5','Bb4','B4']);
 assert.deepEqual(coachTargets('coach-tonic-third','C').map(n=>n.name),['E4']);
});
test('feedback-heavy jazz and ear drills expose staged musical challenges',()=>{
 for(const [id,count] of [['jazz-251',6],['jazz-guide',4],['jazz-approach',4],['ear-guide',3]]){
  const drill=DRILL_BY_ID[id];
  assert.equal(stageCount(drill),count,id);
  assert.ok(drill.stages.every(st=>st.exampleKind.startsWith('coach-')));
  for(const key of ['C','Bb','Db','Eb']){
   for(let i=0;i<count;i++){
    const st=currentStage(drill,i);
    assert.ok(st.title&&st.focus&&st.instructions.length>=2);
    assert.ok(coachTargets(st.exampleKind,key).length);
   }
  }
 }
});
test('invalid coach kind and key are rejected rather than silently guessing',()=>{
 assert.throws(()=>coachTargets('other','C'));
 assert.throws(()=>coachTargets('coach-roots','Q'));
});
