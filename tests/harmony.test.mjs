import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS} from '../data.js';
import {keyPc} from '../music.js';
import {buildTwoFiveOne,chordAtBar,clampHarmonyTempo,noteForKey} from '../harmony.js';
import {midiFrequency,ChordBacking,makeReverbImpulse,clampMix} from '../backing-audio.js';

test('C major ii-V-I has correct jazz chord symbols and 3rds/7ths',()=>{
 const p=buildTwoFiveOne('C','major');
 assert.deepEqual(p.chords.map(ch=>ch.label),['Dm7','G7','Cmaj7']);
 assert.deepEqual(p.chords.map(ch=>ch.guideTones),[['F','C'],['B','F'],['E','B']]);
 assert.deepEqual(p.chords.map(ch=>ch.quality),['m7','dom7','maj7']);
});

test('C minor iiø-V7b9-i has correct chord tones, flat-nine and minor-six tonic',()=>{
 const p=buildTwoFiveOne('C','minor');
 assert.deepEqual(p.chords.map(ch=>ch.label),['Dm7♭5','G7♭9','Cm6']);
 assert.deepEqual(p.chords.map(ch=>ch.quality),['halfdim','dom7b9','min6']);
 assert.deepEqual(p.chords[0].degrees,[0,3,6,10]);
 assert.deepEqual(p.chords[1].degrees,[0,4,7,10,13]);
 assert.deepEqual(p.chords[2].degrees,[0,3,7,9]);
 assert.equal(p.chords[1].midi[4]%12,8); // Ab pitch class
});

test('all twelve keys, both modes: correct ii, V, tonic roots and valid playable piano voicings',()=>{
 for(const key of KEYS)for(const mode of ['major','minor']){
  const p=buildTwoFiveOne(key,mode),tonic=keyPc(key);
  assert.equal(p.chords.length,3,key+' '+mode);
  assert.deepEqual(p.chords.map(c=>c.rootPc),[(tonic+2)%12,(tonic+7)%12,tonic]);
  for(const chord of p.chords){
   assert.ok(chord.midi.length>=4&&chord.midi.length<=5);
   assert.ok(chord.midi.every(n=>n>=48&&n<=84),'range '+key+' '+chord.label);
   assert.ok(chord.guideTones.length>=1);
   assert.ok(chord.midi.every(Number.isInteger));
  }
 }
});

test('spell roots conventionally in flat and sharp tonal centers',()=>{
 assert.deepEqual(buildTwoFiveOne('Bb','major').chords.map(c=>c.label),['Cm7','F7','Bbmaj7']);
 assert.deepEqual(buildTwoFiveOne('Db','major').chords.map(c=>c.label),['Ebm7','Ab7','Dbmaj7']);
 assert.deepEqual(buildTwoFiveOne('B','major').chords.map(c=>c.label),['C#m7','F#7','Bmaj7']);
 assert.equal(noteForKey(10,'Bb'),'Bb');
 assert.equal(noteForKey(1,'B'),'C#');
});

test('progression scheduling loops with 1, 2 or 4 bars per chord',()=>{
 assert.deepEqual([0,1,2,3,4,5].map(n=>chordAtBar(n,1).chordIndex),[0,1,2,0,1,2]);
 assert.deepEqual([0,1,2,3,4,5,6].map(n=>chordAtBar(n,2).chordIndex),[0,0,1,1,2,2,0]);
 assert.equal(chordAtBar(12,4).loop,2);
 assert.equal(chordAtBar(12,4).chordIndex,0);
 assert.equal(chordAtBar(100,9).chordIndex,chordAtBar(100,2).chordIndex);
});

test('tempo clamps unsafe and nonnumeric values',()=>{
 assert.equal(clampHarmonyTempo(15),40);
 assert.equal(clampHarmonyTempo(999),180);
 assert.equal(clampHarmonyTempo(73.6),74);
 assert.equal(clampHarmonyTempo('garbage'),70);
});

test('local Web Audio math and construction do not require a browser or network',()=>{
 assert.ok(Math.abs(midiFrequency(69)-440)<1e-12);
 assert.ok(Math.abs(midiFrequency(60)-261.6255653)<.01);
 const engine=new ChordBacking();
 assert.equal(engine.playing,false);
 engine.setTempo(201);assert.equal(engine.tempo,180);
 engine.setVolume(.6);assert.equal(engine.masterVolume,.6);
 engine.setClick(true);assert.equal(engine.clickEnabled,true);
 engine.stop();
 assert.equal(engine.playing,false);
});

test('reject unexpected mode or key instead of guessing harmony',()=>{
 assert.throws(()=>buildTwoFiveOne('F# major','major'));
 assert.throws(()=>buildTwoFiveOne('C','dorian'));
});

test('tonic chord is literal root position in C4: Cmaj7 and Cm6, not inversions',()=>{
 const major=buildTwoFiveOne('C','major').chords[2],minor=buildTwoFiveOne('C','minor').chords[2];
 assert.equal(major.label,'Cmaj7');
 assert.deepEqual(major.midi,[60,64,67,71]);
 assert.equal(major.bassMidi,48); // C3 instead of muddy C2
 assert.equal(minor.label,'Cm6');
 assert.deepEqual(minor.midi,[60,63,67,69]);
 assert.equal(minor.bassMidi,48);
 assert.equal(major.midi[0]%12,major.rootPc);
 assert.equal(minor.midi[0]%12,minor.rootPc);
 assert.ok(major.midi.every((note,i,arr)=>i===0||arr[i-1]<note));
 assert.ok(minor.midi.every((note,i,arr)=>i===0||arr[i-1]<note));
});
test('all tonics in 12 keys keep root in bass and ascending root-position chord',()=>{
 for(const key of KEYS)for(const mode of ['major','minor']){
  const tonic=buildTwoFiveOne(key,mode).chords[2];
  assert.equal(tonic.midi[0]%12,keyPc(key));
  assert.equal(tonic.bassMidi%12,keyPc(key));
  assert.equal(tonic.midi[0]-tonic.bassMidi,12);
  assert.ok(tonic.midi.every((pitch,i,notes)=>i===0||pitch>notes[i-1]));
  assert.ok(tonic.midi.every(pitch=>pitch>=60&&pitch<=83));
 }
});
test('reverb mix clamps values and impulse contains a finite decaying tail',()=>{
 for(const pair of [[0,0],[.42,.42],[1,1],[-1,0],[100,1]]){
  assert.equal(clampMix(pair[0]),pair[1]);
 }
 assert.equal(clampMix(NaN),.42);
 const channels=[new Float32Array(8000),new Float32Array(8000)];
 const impulse=makeReverbImpulse({sampleRate:4000,createBuffer:(count,frames,rate)=>{
  assert.equal(count,2);assert.equal(rate,4000);assert.equal(frames,8000);
  return {getChannelData:(i)=>channels[i]};
 }},2);
 assert.ok(impulse);
 assert.ok(channels[0].every(Number.isFinite));
 assert.ok(channels[1].every(Number.isFinite));
 assert.ok(channels[0].slice(80,400).some(x=>x!==0));
 const first=Math.max(...channels[0].slice(100,800).map(Math.abs));
 const last=Math.max(...channels[0].slice(7200).map(Math.abs));
 assert.ok(first>last*20,'reverb tail should decay strongly');
});
test('audio engine is configurable for higher output and reverb, without browser dependencies',()=>{
 const audio=new ChordBacking();
 audio.setVolume(.85);audio.setReverb(.65);
 assert.equal(audio.masterVolume,.85);
 assert.equal(audio.reverbMix,.65);
 audio.stop();assert.equal(audio.playing,false);
});
