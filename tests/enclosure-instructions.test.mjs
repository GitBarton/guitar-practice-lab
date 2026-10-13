import test from 'node:test';
import assert from 'node:assert/strict';
import {DRILLS} from '../data.js';

test('dominant-third enclosure has a spelled example and an explicit beat target',()=>{
 const drill=DRILLS.find(d=>d.id==='jazz-enclosure');
 assert.ok(drill);
 assert.match(drill.instructions[0],/G7/);
 assert.match(drill.instructions[0],/Bb/);
 assert.match(drill.instructions[0],/B \(the third of G7\)/);
 assert.match(drill.instructions[1],/beat 1/);
 assert.match(drill.instructions[2],/semitone above/);
 assert.match(drill.instructions[2],/semitone below/);
});
