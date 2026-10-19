import test from 'node:test';
import assert from 'node:assert/strict';
import {DRILL_BY_ID,KEYS,currentStage,clampedStageIndex} from '../data.js';
import {coachTargets} from '../practice-coach.js';
const ids=['jazz-251','jazz-guide','jazz-approach','ear-guide'];
for(const id of ids)test(id+' all stages have real pitch-verified guitar notes in twelve keys',()=>{
 const d=DRILL_BY_ID[id];assert.ok(d.stages.length>=4);
 for(const key of KEYS)for(const stage of d.stages){
  const notes=coachTargets(stage.exampleKind,key);
  assert.ok(notes.length>0);
  for(const note of notes){const open=[64,59,55,50,45,40][note.string];assert.equal(open+note.fret,note.midi);assert.ok(note.fret>=0&&note.fret<=22);}
 }
 assert.equal(currentStage(d,999),d.stages.at(-1));
 assert.equal(clampedStageIndex(d,-1),0);
});
test('enclosure is semitone above, below, target in all keys',()=>{
 for(const key of KEYS){const n=coachTargets('coach-enclosure',key);assert.equal(n.length,3);assert.equal(n[0].midi,n[2].midi+1);assert.equal(n[1].midi,n[2].midi-1);}
});
