import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS} from '../data.js';
import {keyPc,renderTabSvg,renderFretboardSvg} from '../music.js';
import {SCALE_BOXES,referencePentatonicBox,referenceDominant7} from '../reference-patterns.js';
const opens=[64,59,55,50,45,40];
test('published A minor pentatonic box 1 matches the 5–8 / 5–7 conventional shape',()=>{
 const p=referencePentatonicBox('A','pentMinor',1);
 assert.deepEqual(p.notes.filter(n=>n.string===5).map(n=>n.fret),[5,8]);
 assert.deepEqual(p.notes.filter(n=>n.string===4).map(n=>n.fret),[5,7]);
 assert.deepEqual(p.notes.filter(n=>n.string===3).map(n=>n.fret),[5,7]);
 assert.deepEqual(p.notes.filter(n=>n.string===2).map(n=>n.fret),[5,7]);
 assert.deepEqual(p.notes.filter(n=>n.string===1).map(n=>n.fret),[5,8]);
 assert.deepEqual(p.notes.filter(n=>n.string===0).map(n=>n.fret),[5,8]);
 assert.deepEqual(p.notes.map(n=>n.finger).filter(Boolean).sort(),[1,1,1,1,1,1,3,3,3,4,4,4].sort());
});
test('five conventional boxes give correct pentatonic pitches for all keys',()=>{
 assert.deepEqual(SCALE_BOXES,[1,2,3,4,5]);
 for(const key of KEYS)for(const quality of ['pentMinor','pentMajor']){
  const intervals=quality==='pentMajor'?[0,2,4,7,9]:[0,3,5,7,10];
  const allowed=new Set(intervals.map(x=>(keyPc(key)+x)%12));
  for(const box of SCALE_BOXES){
   const pattern=referencePentatonicBox(key,quality,box);
   assert.equal(pattern.notes.length,12);
   for(const n of pattern.notes){
    assert.equal(n.midi,opens[n.string]+n.fret);
    assert.ok(allowed.has(n.pc),key+' '+quality+' box '+box+' pitch '+n.pc);
    assert.ok(n.fret>=0&&n.fret<=22);
   }
   assert.ok(pattern.fretRange[1]-pattern.fretRange[0]<=5,'compact fingerboard window');
   assert.match(renderTabSvg(pattern.notes),/<svg/);
   assert.match(renderFretboardSvg(pattern.notes),/<svg/);
  }
 }
});
test('published five-box shape makes C major identical to relative A minor locations',()=>{
 for(const box of SCALE_BOXES){
  const major=referencePentatonicBox('C','pentMajor',box);
  const minor=referencePentatonicBox('A','pentMinor',box);
  assert.deepEqual(major.notes.map(n=>[n.string,n.fret]),minor.notes.map(n=>[n.string,n.fret]));
 }
});
test('dominant 7 arpeggio spans exactly 2 octaves with efficient E/A-root courses',()=>{
 for(const key of KEYS)for(const string of ['E','A']){
  const route=referenceDominant7(key,string),r=keyPc(key);
  assert.equal(route.notes.length,9);
  assert.deepEqual(route.notes.map(n=>((n.pc-r)+12)%12),[0,4,7,10,0,4,7,10,0]);
  assert.equal(route.notes.at(-1).midi-route.notes[0].midi,24);
  assert.ok(route.fretRange[1]-route.fretRange[0]<=6);
  assert.equal(route.notes[0].string,string==='E'?5:4);
  for(const n of route.notes){
   assert.equal(n.midi,opens[n.string]+n.fret,key+' '+string);
   assert.ok(n.fret>=0&&n.fret<=22);
  }
 }
 const g=referenceDominant7('G','E');
 assert.deepEqual(g.notes.map(n=>[n.string,n.fret]),[[5,3],[4,2],[4,5],[3,3],[3,5],[2,4],[2,7],[1,6],[1,8]]);
 const c=referenceDominant7('C','A');
 assert.deepEqual(c.notes.map(n=>[n.string,n.fret]),[[4,3],[3,2],[3,5],[2,3],[2,5],[1,5],[0,3],[0,6],[0,8]]);
});
test('reject unsupported root/box/quality combinations',()=>{
 assert.throws(()=>referencePentatonicBox('X','pentMinor',1));
 assert.throws(()=>referencePentatonicBox('A','maj7',1));
 assert.throws(()=>referencePentatonicBox('A','pentMinor',9));
 assert.throws(()=>referenceDominant7('G','B'));
});
