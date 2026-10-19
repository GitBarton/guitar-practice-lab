import test from 'node:test';
import assert from 'node:assert/strict';
import {DRILL_BY_ID} from '../data.js';

test('picking reset includes a dedicated low-string damping stage', () => {
  const drill=DRILL_BY_ID['picking-reset'];
  assert.ok(drill);
  const stage=drill.stages.find(s=>s.title.includes('palm anchor'));
  assert.ok(stage);
  assert.match(stage.instructions.join(' '), /low E, A and D/);
  assert.ok(drill.stages.some(s=>s.exampleKind==='double-stop'));
  assert.ok(drill.stages.some(s=>s.exampleKind==='octave'));
});

test('enclosure drills have coherent chord-tone targeting stages', () => {
  const drill=DRILL_BY_ID['jazz-enclosure'];
  assert.deepEqual(drill.stages.map(s=>s.exampleKind), [
    'coach-v-third','coach-lower-approach','coach-enclosure','coach-tonic-third'
  ]);
  assert.match(drill.stages[1].instructions.join(' '), /B♭ → B/);
  assert.match(drill.stages[2].instructions.join(' '), /C → B♭ → B/);
  assert.match(drill.stages[3].instructions.join(' '), /Cmaj7/);
});
