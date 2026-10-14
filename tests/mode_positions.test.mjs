import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS} from '../data.js';
import {MODE_DEFINITIONS,scaleFor} from '../theory-lab.js';
import {keyPc} from '../music.js';
import {CAGED_REGIONS,positionForMode,allModePositions,STRING_OPEN_MIDI} from '../mode-positions.js';

test('CAGED regions are five DISTINCT conventional C/A/G/E/D root neighborhoods',()=>{
 assert.deepEqual(CAGED_REGIONS.map(s=>s.id),['C','A','G','E','D']);
 assert.deepEqual(CAGED_REGIONS.map(s=>[s.start,s.end]),[[0,3],[3,6],[5,8],[8,11],[10,13]]);
 assert.deepEqual(CAGED_REGIONS.map(s=>s.rootAnchors),[
  [[4,3],[1,1]],[[4,3],[2,5]],[[5,8],[2,5]],[[5,8],[3,10]],[[3,10],[0,8]]
 ]);
 const positions=allModePositions(scaleFor('ionian','C'));
 assert.deepEqual(positions.map(p=>p.fretRange),[[0,3],[3,6],[5,8],[8,11],[10,13]]);
});
test('all 17 modes and all 12 keys: every position contains exact scale pitches and correct fretboard strings',()=>{
 for(const key of KEYS)for(const mode of MODE_DEFINITIONS){
  const scale=scaleFor(mode.id,key),positions=allModePositions(scale);
  assert.equal(positions.length,5);
  assert.equal(new Set(positions.map(p=>p.fretRange[0])).size,5,'five physically distinct start frets');
  for(const p of positions){
   assert.equal(p.key,key);
   assert.equal(p.fretRange[1]-p.fretRange[0],3,'never exceed four adjacent frets');
   assert.ok(p.fretRange[0]>=0&&p.fretRange[1]<=22);
   assert.ok(p.rootLandmarks.length>0);
   assert.ok(p.notes.length>=12);
   assert.deepEqual([...new Set(p.notes.map(n=>n.string))],[5,4,3,2,1,0]);
   assert.ok(p.notes.filter(n=>n.string===1).length>=2,key+' '+mode.id+' B string must be playable');
   assert.ok(p.notes.every(n=>n.fret>=p.fretRange[0]&&n.fret<=p.fretRange[1]));
   assert.ok(p.notes.every(n=>n.string>=0&&n.string<6));
   assert.ok(p.notes.every(n=>n.pc===n.midi%12&&n.midi===STRING_OPEN_MIDI[n.string]+n.fret));
   assert.ok(p.notes.every(n=>scale.pitchClasses.includes(n.pc)));
   assert.ok(p.notes.every(n=>n.interval===scale.degrees[n.degreeIndex]));
   assert.ok(p.notes.every(n=>n.finger>=0&&n.finger<=4));
   assert.ok(p.notes.every(n=>n.fret===0?n.finger===0:n.finger>=1&&n.finger<=4));
   assert.ok(p.notes.every((n,i)=>i===0||n.midi>p.notes[i-1].midi),'scale run must consistently ascend');
   assert.ok(p.notes.every((n,i)=>i===0||Math.abs(n.fret-p.notes[i-1].fret)<=3),'no wide string-change fret leaps');
   for(const root of p.rootLandmarks){
    assert.equal(root.midi%12,keyPc(key));
    assert.ok(p.notes.some(n=>n.root&&n.string===root.string&&n.fret===root.fret));
   }
  }
 }
});
test('actual B-string moves stay inside one hand frame, not erratic jumps across the neck',()=>{
 for(const key of ['C','Gb','Bb','B'])for(const mode of ['altered','diminished-hw','harmonic-minor','dorian']){
  for(const p of allModePositions(scaleFor(mode,key))){
   const b=p.notes.filter(n=>n.string===1);
   assert.ok(b.every((n,i)=>i===0||n.fret>b[i-1].fret));
   assert.ok(b.every(n=>n.fret>=p.fretRange[0]&&n.fret<=p.fretRange[1]));
   assert.ok(b.every(n=>n.finger>=0&&n.finger<=4));
  }
 }
});
test('root and degrees highlight by selected mode, not by index in an unrelated scale',()=>{
 const scale=scaleFor('altered','C');
 for(const p of allModePositions(scale)){
  assert.ok(p.notes.some(n=>n.root&&n.degreeIndex===0&&n.interval==='1'));
  assert.ok(p.notes.some(n=>n.degreeIndex===3&&n.interval==='3'));
  assert.ok(p.notes.some(n=>n.degreeIndex===5&&n.interval==='♭13'));
 }
});
test('unknown region or incomplete modal data is rejected',()=>{
 assert.throws(()=>positionForMode(scaleFor('ionian','C'),'Z'));
 assert.throws(()=>positionForMode({key:'C',intervals:[0],pitchClasses:[0]}));
});
