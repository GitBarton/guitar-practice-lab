import test from 'node:test';
import assert from 'node:assert/strict';
import {referencePentatonicBox} from '../reference-patterns.js';
import {KEYS} from '../data.js';
for(const key of KEYS)for(const quality of ['pentMinor','pentMajor'])for(let box=1;box<=5;box++){
 test(`pentatonic ${key} ${quality} box ${box} has pitch-ordered route`,()=>{
  const route=referencePentatonicBox(key,quality,box);
  assert.equal(route.ascending.length,route.notes.length);
  assert.deepEqual(route.descending.map(n=>n.midi),route.ascending.map(n=>n.midi).reverse());
  assert.ok(route.ascending.every((n,i,a)=>i===0||a[i-1].midi<=n.midi));
  assert.ok(route.ascending.every(n=>n.fret>=0&&n.fret<=22));
 });
}
