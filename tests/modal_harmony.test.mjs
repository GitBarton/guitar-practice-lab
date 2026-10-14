import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS} from '../data.js';
import {MODE_DEFINITIONS,scaleFor,diatonicSevenths} from '../theory-lab.js';
import {harmonizeSelectedMode,spellScaleDegrees} from '../modal-harmony.js';
import {keyPc} from '../music.js';
test('Ionian remains exactly the correct seven major-key diatonic seventh chords',()=>{
 for(const key of KEYS){
  const actual=harmonizeSelectedMode(scaleFor('ionian',key));
  assert.equal(actual.kind,'diatonic');
  assert.deepEqual(actual.chords.map(ch=>ch.symbol),diatonicSevenths(key).map(ch=>ch.symbol));
  assert.ok(actual.title.includes(key+' Ionian'));
 }
});
test('C Dorian, melodic minor and harmonic minor EACH recalculate different genuine chord qualities',()=>{
 assert.deepEqual(harmonizeSelectedMode(scaleFor('dorian','C')).chords.map(ch=>ch.symbol),
 ['Cm7','Dm7','Ebmaj7','F7','Gm7','Am7♭5','Bbmaj7']);
 assert.deepEqual(harmonizeSelectedMode(scaleFor('melodic-minor','C')).chords.map(ch=>ch.symbol),
 ['Cm(maj7)','Dm7','Ebmaj7♯5','F7','G7','Am7♭5','Bm7♭5']);
 assert.deepEqual(harmonizeSelectedMode(scaleFor('harmonic-minor','C')).chords.map(ch=>ch.symbol),
 ['Cm(maj7)','Dm7♭5','Ebmaj7♯5','Fm7','G7','Abmaj7','B°7']);
});
test('correct enharmonic spellings derive from selected key, including E# / Fb / Cb',()=>{
 assert.deepEqual(spellScaleDegrees(scaleFor('ionian','Gb')),['Gb','Ab','Bb','Cb','Db','Eb','F']);
 assert.deepEqual(spellScaleDegrees(scaleFor('harmonic-minor','Db')),['Db','Eb','Fb','Gb','Ab','Bbb','C']);
 assert.deepEqual(spellScaleDegrees(scaleFor('ionian','B')),['B','C#','D#','E','F#','G#','A#']);
});
test('seventh-chord semitone qualities always correspond to notes of SELECTED mode',()=>{
 for(const key of KEYS)for(const definition of MODE_DEFINITIONS){
  const mode=scaleFor(definition.id,key),harmony=harmonizeSelectedMode(mode);
  assert.ok(harmony.title.includes(key));
  assert.ok(harmony.chords.length>=2);
  assert.ok(harmony.chords.every(ch=>ch.pitchClasses.every(pc=>mode.pitchClasses.includes(pc))),key+' '+definition.id);
  if(harmony.kind==='diatonic'){
   assert.equal(harmony.chords.length,7,key+' '+definition.id);
   assert.ok(harmony.chords.every(ch=>ch.intervals.length===4));
   assert.ok(harmony.chords.every(ch=>ch.intervals[0]===0));
   assert.ok(harmony.chords.every(ch=>ch.intervals.every((v,i,a)=>i===0||v>a[i-1])));
   assert.ok(harmony.chords.every(ch=>ch.root&&ch.symbol.includes(ch.root)));
  }else{
   assert.ok(['altered','diminished-hw','diminished-wh'].includes(definition.id));
   assert.ok(harmony.description.includes('not')||harmony.description.includes('cannot'));
  }
 }
});
test('altered and symmetric octatonic harmony give defensible functional chords, NOT seven fake major-key chords',()=>{
 const a=harmonizeSelectedMode(scaleFor('altered','C'));
 assert.equal(a.kind,'characteristic');
 assert.deepEqual(a.chords.map(ch=>ch.symbol),['C7alt','♭9 / ♯9','♭5 / ♯11 · ♭13']);
 assert.deepEqual(a.chords[0].intervals,[0,4,10]);
 assert.deepEqual(a.chords[1].intervals,[1,3]);
 assert.deepEqual(a.chords[2].intervals,[6,8]);
 const hw=harmonizeSelectedMode(scaleFor('diminished-hw','C'));
 assert.equal(hw.kind,'characteristic');
 assert.ok(hw.chords.some(ch=>ch.symbol==='C7♭9'));
 const wh=harmonizeSelectedMode(scaleFor('diminished-wh','C'));
 assert.ok(wh.chords.some(ch=>ch.symbol==='C°7'));
 assert.throws(()=>spellScaleDegrees(scaleFor('altered','C')));
});
