import test from 'node:test';
import assert from 'node:assert/strict';
import {MODE_DEFINITIONS,MODE_FAMILIES,MODE_DEGREES,scaleFor,diatonicSevenths,scaleTabTargets} from '../theory-lab.js';
import {KEYS} from '../data.js';
import {keyPc} from '../music.js';
const prefix=(id,key)=>scaleFor(id,key).intervals;
test('Berklee chord-scale families: 7 major modes, 7 melodic minor modes plus three extras',()=>{
 assert.deepEqual(MODE_FAMILIES.map(f=>f.id),['major','melodic','minor']);
 assert.equal(MODE_DEFINITIONS.length,17);
 assert.deepEqual(prefix('ionian','C'),[0,2,4,5,7,9,11]);
 assert.deepEqual(prefix('dorian','C'),[0,2,3,5,7,9,10]);
 assert.deepEqual(prefix('melodic-minor','C'),[0,2,3,5,7,9,11]);
 assert.deepEqual(prefix('altered','C'),[0,1,3,4,6,8,10]);
 assert.deepEqual(prefix('lydian-dominant','C'),[0,2,4,6,7,9,10]);
 assert.deepEqual(prefix('harmonic-minor','C'),[0,2,3,5,7,8,11]);
 assert.deepEqual(prefix('diminished-hw','C'),[0,1,3,4,6,7,9,10]);
 assert.deepEqual(prefix('diminished-wh','C'),[0,2,3,5,6,8,9,11]);
});
test('all scale modes transpose with correct semitone sets in all twelve keys',()=>{
 for(const key of KEYS)for(const def of MODE_DEFINITIONS){
  const scale=scaleFor(def.id,key),root=keyPc(key);
  assert.equal(scale.pitchClasses.length,def.intervals.length,key+' '+def.id);
  assert.deepEqual(scale.pitchClasses,def.intervals.map(i=>(root+i)%12));
  assert.equal(scale.pitchClasses[0],root);
  const tab=scaleTabTargets(scale);
  assert.equal(tab.length,scale.intervals.length+1);
  assert.deepEqual(tab.map(n=>n.pc),[...scale.pitchClasses,root]);
  assert.ok(tab.every(n=>n.fret>=0&&n.fret<=22&&n.string>=0&&n.string<=5));
  assert.equal(tab.at(-1).midi-tab[0].midi,12);
 }
});
test('diatonic seventh chord spellings, qualities and stacked thirds in C, Db, B and Gb',()=>{
 assert.deepEqual(diatonicSevenths('C').map(c=>c.symbol),['Cmaj7','Dm7','Em7','Fmaj7','G7','Am7','Bm7♭5']);
 assert.deepEqual(diatonicSevenths('Db').map(c=>c.symbol),['Dbmaj7','Ebm7','Fm7','Gbmaj7','Ab7','Bbm7','Cm7♭5']);
 assert.deepEqual(diatonicSevenths('B').map(c=>c.symbol),['Bmaj7','C#m7','D#m7','Emaj7','F#7','G#m7','A#m7♭5']);
 assert.deepEqual(diatonicSevenths('Gb').map(c=>c.symbol),['Gbmaj7','Abm7','Bbm7','Cbmaj7','Db7','Ebm7','Fm7♭5']);
 for(const key of KEYS){
  const chords=diatonicSevenths(key);
  assert.equal(chords.length,7);
  assert.deepEqual(chords.map(c=>c.quality),['maj7','m7','m7','maj7','7','m7','m7♭5']);
  assert.ok(chords.every(c=>c.pitchClasses.length===4));
  assert.equal(chords[0].rootPc,keyPc(key));
 }
});
test('reject unknown modes and keys, and retain immutable note formulas',()=>{
 assert.throws(()=>scaleFor('imaginary','C'));
 assert.throws(()=>scaleFor('altered','H'));
 assert.throws(()=>diatonicSevenths('H'));
 assert.equal(Object.isFrozen(MODE_DEFINITIONS[0].intervals),true);
});

test('modal degree labels are specific and not guessed from sequential note indexes',()=>{
 assert.deepEqual(MODE_DEGREES.altered,['1','♭9','♯9','3','♭5/♯11','♭13','♭7']);
 assert.deepEqual(MODE_DEGREES['lydian-dominant'],['1','2','3','♯4','5','6','♭7']);
 assert.deepEqual(MODE_DEGREES['diminished-hw'],['1','♭9','♯9','3','♯11','5','13','♭7']);
 for(const def of MODE_DEFINITIONS){
  const scale=scaleFor(def.id,'C');
  assert.equal(scale.degrees.length,scale.intervals.length,def.id);
  assert.deepEqual(scaleTabTargets(scale).slice(0,-1).map(n=>n.interval),scale.degrees);
 }
});
