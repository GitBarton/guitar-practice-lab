import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS,DRILL_BY_ID} from '../data.js';
import {dominantBebopDescending} from '../bebop-lines.js';
const opens=[64,59,55,50,45,40];
for(const key of KEYS)test('Bebop descending '+key+' pitches, chord tones and guitar locations',()=>{
 const {notes,dominantPc}=dominantBebopDescending(key);
 assert.equal(notes.length,9);
 const chord=new Set([0,4,7,10].map(x=>(dominantPc+x)%12));
 for(const n of notes){assert.equal(opens[n.string]+n.fret,n.midi);assert.ok(n.fret>=0&&n.fret<=22);}
 for(const i of [0,2,4,6,8])assert.ok(chord.has(notes[i].pc));
 for(const i of [1,3,5,7])assert.ok(!chord.has(notes[i].pc));
 assert.equal(notes[0].midi-notes[8].midi,12);
});
test('Bebop study has three purposeful stages',()=>{
 const d=DRILL_BY_ID['jazz-bebop-strong-beats'];assert.equal(d.stages.length,3);
 assert.ok(d.stages.every(s=>s.exampleKind==='bebop-descending'));
});
