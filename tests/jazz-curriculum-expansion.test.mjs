import test from 'node:test';
import assert from 'node:assert/strict';
import {DRILL_BY_ID,KEYS} from '../data.js';
import {coachTargets} from '../practice-coach.js';
test('new jazz lessons remain staged and transposable',()=>{
 for(const id of ['jazz-modal-improv','jazz-bebop-dominant']){
  const drill=DRILL_BY_ID[id];assert.ok(drill);assert.ok(drill.stages.length>=3);
  for(const key of KEYS)for(const stage of drill.stages){
   if(!stage.exampleKind.startsWith('coach-'))continue;
   const notes=coachTargets(stage.exampleKind,key);
   assert.ok(notes.length);for(const note of notes)assert.equal([64,59,55,50,45,40][note.string]+note.fret,note.midi);
  }
 }
});
