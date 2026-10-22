import test from 'node:test';
import assert from 'node:assert/strict';
import {ChordBacking} from '../backing-audio.js';
import {buildTwoFiveOne,spellInterval} from '../harmony.js';
import {KEYS} from '../data.js';
import {installAudio} from './helpers/audio-context.mjs';

// These tests use the actual engine with a controlled audio clock, not source-text matching.
test('stop cancels an outstanding browser resume before it can start sound',async t=>{
 let ready;const mock=installAudio(t,{resume:()=>new Promise(resolve=>{ready=resolve;})});
 const b=new ChordBacking();const start=b.start(buildTwoFiveOne('C'));
 b.stop();ready();assert.equal(await start,false);
 assert.equal(b.playing,false);assert.equal(mock.intervals.size,0);assert.equal(mock.oscillators.length,0);
});
test('out-of-order browser resumes leave only the newest request playing',async t=>{
 const resumes=[];const mock=installAudio(t,{resume:()=>new Promise(resolve=>resumes.push(resolve))});
 const b=new ChordBacking();const old=b.start(buildTwoFiveOne('C'));
 const latest=b.start(buildTwoFiveOne('Bb','minor'));
 resumes[1]();assert.equal(await latest,true);resumes[0]();assert.equal(await old,false);
 assert.equal(b.plan.key,'Bb');assert.equal(mock.intervals.size,1);b.stop();
});
test('saved volume takes effect on first play and replay without rebuilding the graph',async t=>{
 installAudio(t);const b=new ChordBacking();
 await b.start(buildTwoFiveOne('C'),{volume:.25});
 assert.equal(b.masterBus.gain.value,.88*.25);const bus=b.masterBus;
 await b.start(buildTwoFiveOne('C'),{volume:.85});
 assert.equal(b.masterBus,bus);assert.equal(bus.gain.value,.88*.85);b.stop();
});
test('beat and chord feedback follows audible time, including live tempo and volume changes',async t=>{
 const mock=installAudio(t),positions=[];const b=new ChordBacking(p=>{if(p)positions.push(p);});
 await b.start(buildTwoFiveOne('C'),{tempo:120,barsPerChord:1,click:true});
 assert.equal(positions.length,0,'lookahead must not advance UI');
 mock.tick(.09);assert.equal(b.position.label,'Dm7');assert.equal(b.position.beat,1);
 mock.tick(.59);assert.equal(b.position.beat,2);
 b.setTempo(60);b.setVolume(.3);assert.equal(mock.intervals.size,1);
 mock.tick(1.96);assert.equal(b.position.label,'Dm7');
 mock.tick(2.09);assert.equal(b.position.label,'G7');assert.equal(b.position.beat,1);
 mock.tick(3.09);assert.equal(b.position.beat,2);
 assert.equal(b.nextBarTime,6.09,'new tempo begins on the next measure');
 b.stop();assert.equal(b.positionEvents.length,0);assert.equal(mock.intervals.size,0);
 const count=positions.length;mock.tick(9);assert.equal(positions.length,count);
 assert.ok(mock.oscillators.every(o=>o.stops.length>=2),'stop also cancels future voices');
});
test('throttled scheduling skips missed attacks and releases completed voice graphs',async t=>{
 const mock=installAudio(t),b=new ChordBacking();await b.start(buildTwoFiveOne('C'),{tempo:120});
 mock.tick(100);assert.ok(mock.oscillators.every(o=>o.starts[0]===.09||o.starts[0]>=99.85));
 const voice=[...b.activeVoices][0];voice.osc.onended();
 assert.equal(b.activeVoices.has(voice),false);assert.equal(voice.osc.disconnected,true);assert.equal(voice.gain.disconnected,true);b.stop();
});
test('actual transport traverses ii-V-I in every key and mode',async t=>{
 const mock=installAudio(t),b=new ChordBacking();const played=[];
 b.playChord=(chord,when)=>played.push({chord,when});
 for(const key of KEYS)for(const mode of ['major','minor']){
  mock.ctx.currentTime=0;played.length=0;
  await b.start(buildTwoFiveOne(key,mode),{tempo:120,barsPerChord:1});
  mock.tick(2);mock.tick(4);
  assert.deepEqual(played.map(p=>p.chord.quality),mode==='major'?['m7','dom7','maj7']:['halfdim','dom7b9','min6']);
  assert.deepEqual(played.map(p=>p.when),[.09,2.09,4.09]);b.stop();
 }
});
test('harmonic spelling retains letter functions, not only matching pitch classes',()=>{
 assert.deepEqual(buildTwoFiveOne('Gb').chords[0].noteNames,['Ab','Cb','Eb','Gb']);
 assert.deepEqual(buildTwoFiveOne('Gb').chords[1].guideTones,['F','Cb']);
 assert.deepEqual(buildTwoFiveOne('B','minor').chords[1].noteNames,['F#','A#','C#','E','G']);
 const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 for(const key of KEYS)for(const mode of ['major','minor'])for(const chord of buildTwoFiveOne(key,mode).chords){
  chord.noteNames.forEach((name,i)=>{
   const pc=(natural[name[0]]+[...name.slice(1)].reduce((n,a)=>n+(a==='#'?1:-1),0)+24)%12;
   assert.equal(pc,chord.midi[i]%12,key+' '+mode+' '+name);
  });
 }
 assert.equal(spellInterval('C',4,3),'E');
});
