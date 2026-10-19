import test from 'node:test';
import assert from 'node:assert/strict';
import {DRILL_BY_ID} from '../data.js';
test('picking exercise retains baseline and adds two pentatonic variants',()=>{
 const stages=DRILL_BY_ID['picking-reset'].stages;
 assert.ok(stages.find(s=>s.title.includes('Major pentatonic')&&s.exampleKind==='double-stop'));
 assert.ok(stages.find(s=>s.title.includes('Minor pentatonic')&&s.exampleKind==='octave'));
 assert.equal(stages[0].title,'One-string baseline');
 assert.equal(stages[stages.length-1].title,'Return to baseline');
});
