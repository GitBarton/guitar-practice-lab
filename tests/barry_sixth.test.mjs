import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS,DRILL_BY_ID,makeSession,stageCount,currentStage} from '../data.js';
import {keyPc} from '../music.js';
import {sixthDiminished,sixthDiminishedNotes,SIXTH_DIM_FORMULAS} from '../barry-sixth.js';
const OPEN=[64,59,55,50,45,40];
test('reference-checked C6 and Cm6 diminished scale collections and stable/passing families',()=>{
 const major=sixthDiminished('major','C'),minor=sixthDiminished('minor','C');
 assert.deepEqual(major.scale.map(x=>x.name),['C','D','E','F','G','Ab','A','B']);
 assert.deepEqual(minor.scale.map(x=>x.name),['C','D','Eb','F','G','Ab','A','B']);
 assert.deepEqual(major.sixth.map(x=>x.name),['C','E','G','A']);
 assert.deepEqual(minor.sixth.map(x=>x.name),['C','Eb','G','A']);
 assert.deepEqual(major.dim.map(x=>x.name),['D','F','Ab','B']);
 assert.deepEqual(minor.dim.map(x=>x.name),['D','F','Ab','B']);
 assert.equal(major.sixthSymbol,'C6');
 assert.equal(minor.sixthSymbol,'Cm6');
 assert.equal(major.diminishedSymbol,'D°7');
});
test('major/minor sixth-diminished notes and chord partitions transpose to all 12 keys',()=>{
 for(const key of KEYS)for(const mode of ['major','minor']){
  const material=sixthDiminished(mode,key),root=keyPc(key),offsets=SIXTH_DIM_FORMULAS[mode];
  assert.deepEqual(material.scale.map(n=>n.pc),offsets.map(n=>(root+n)%12));
  assert.equal(new Set(material.scale.map(n=>n.pc)).size,8);
  assert.equal(material.sixth.length,4);
  assert.equal(material.dim.length,4);
  assert.equal(new Set([...material.sixth,...material.dim].map(n=>n.pc)).size,8);
  assert.deepEqual(material.sixth.map(n=>n.semitones),[0,mode==='major'?4:3,7,9]);
  assert.deepEqual(material.dim.map(n=>n.semitones),[2,5,8,11]);
  for(const part of ['sixth','diminished','scale','switch']){
   const notes=sixthDiminishedNotes('barry6-'+mode+'-'+part,key);
   assert.equal(notes.length,part==='scale'?9:part==='switch'?9:5);
   assert.ok(notes.every(n=>n.string>=0&&n.string<=5&&n.fret>=0&&n.fret<=22));
   for(const note of notes){
    assert.equal(note.midi,OPEN[note.string]+note.fret);
    assert.equal(note.pc,note.midi%12);
    assert.ok(note.name.includes(/[A-G]/.source));
   }
   if(part==='scale')assert.deepEqual(notes.map(n=>n.midi-notes[0].midi),[...offsets,12]);
  }
 }
});
test('fully diminished passing family consists of four minor-third pitch classes',()=>{
 for(const key of KEYS){
  const study=sixthDiminished('major',key),dim=study.dim.map(n=>n.pc);
  for(let i=0;i<4;i++)assert.equal((dim[(i+1)%4]-dim[i]+12)%12,3);
 }
});
test('Barry original major/minor study drills have four guided evolving stages',()=>{
 for(const [id,mode] of [['jazz-sixth-diminished-major','major'],['jazz-sixth-diminished-minor','minor']]){
  const d=DRILL_BY_ID[id];
  assert.ok(d);assert.equal(stageCount(d),4);
  assert.ok(d.stages.every(s=>s.instructions.length>=2&&s.exampleKind.startsWith('barry6-'+mode)));
  assert.deepEqual(d.stages.map(s=>s.exampleKind),['sixth','diminished','scale','switch'].map(x=>'barry6-'+mode+'-'+x));
  assert.ok(Array.from({length:32},(_,day)=>makeSession(day,'technique')).some(s=>s.entries.some(e=>e.id===id)));
 }
});
test('invalid sixth-diminished keys, modes and exercise kinds fail closed',()=>{
 assert.throws(()=>sixthDiminished('wrong','C'));
 assert.throws(()=>sixthDiminished('major','H'));
 assert.throws(()=>sixthDiminishedNotes('barry6-fake-scale','C'));
});
