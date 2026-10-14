import test from 'node:test';
import assert from 'node:assert/strict';
import {OPEN_STRING_PITCHES,PITCH_CHOICES,pitchFrequency,registerTempoTap,ReferencePitchPlayer} from '../reference-pitch.js';

test('reference note frequencies are precise under A440 tuning',()=>{
 assert.equal(pitchFrequency(69),440);
 assert.ok(Math.abs(pitchFrequency(40)-82.406889)<.00001);
 assert.ok(Math.abs(pitchFrequency(45)-110)<.00001);
 assert.ok(Math.abs(pitchFrequency(64)-329.627557)<.00001);
 assert.equal(OPEN_STRING_PITCHES.length,6);
 assert.deepEqual(OPEN_STRING_PITCHES.map(n=>n.midi),[40,45,50,55,59,64]);
 assert.equal(PITCH_CHOICES.length,49);
 assert.equal(PITCH_CHOICES[29].label,'A4');
 assert.equal(pitchFrequency(69,442),442);
 assert.throws(()=>pitchFrequency(128),RangeError);
 assert.throws(()=>pitchFrequency(40,0),RangeError);
});
test('tempo taps calculate steady 120 and 80 bpm, reject bounces and reset after pause',()=>{
 let taps=[],bpm=null;
 for(const time of [1000,1500,2000,2500]){
  const result=registerTempoTap(taps,time);taps=result.taps;bpm=result.bpm;
 }
 assert.equal(bpm,120);
 assert.ok(taps.length<=4);
 let result=registerTempoTap(taps,2600);
 assert.equal(result.bpm,null);
 assert.ok(result.taps.length<=taps.length);
 result=registerTempoTap(taps,6000);
 assert.equal(result.bpm,null);
 assert.deepEqual(result.taps,[6000]);
 result=registerTempoTap(result.taps,6750);
 assert.equal(result.bpm,80);
 const fast=registerTempoTap([1000],1250);
 assert.equal(fast.bpm,240);
 const slow=registerTempoTap([1000],3000);
 assert.equal(slow.bpm,30);
 assert.equal(registerTempoTap([],NaN).bpm,null);
});
test('reference oscillator uses Web Audio only and stops both harmonics on request',async()=>{
 const events=[],nodes=[];
 function param(value=0){return{
  value,setValueAtTime(v){this.value=v;events.push(['set',v]);},
  linearRampToValueAtTime(v){this.value=v;events.push(['ramp',v]);},
  cancelScheduledValues(){events.push(['cancel']);},
  setTargetAtTime(v){this.value=v;events.push(['target',v]);}
 };}
 function osc(){
  const o={type:null,frequency:param(),connect(target){return target;},start(t){events.push(['start',t,this.frequency.value]);},
    stop(t){events.push(['stop',t]);}};
  nodes.push(o);return o;
 }
 const context={currentTime:2,destination:{},
  async resume(){events.push(['resume']);},
  createOscillator:osc,
  createGain(){return {gain:param(),connect(t){return t;},disconnect(){events.push(['disconnect']);}};},
  async close(){events.push(['close']);}};
 const player=new ReferencePitchPlayer(class{constructor(){return context;}});
 assert.equal(player.playing,false);
 assert.equal(await player.toggle(45),true);
 assert.equal(player.playing,true);
 assert.equal(player.activeMidi,45);
 assert.equal(nodes.length,2);
 assert.equal(nodes[0].type,'sine');
 assert.ok(Math.abs(nodes[0].frequency.value-110)<.001);
 assert.ok(Math.abs(nodes[1].frequency.value-220)<.001);
 assert.equal(events.filter(e=>e[0]==='start').length,2);
 assert.equal(await player.toggle(45),false);
 assert.equal(player.playing,false);
 assert.equal(events.filter(e=>e[0]==='stop').length,2);
 assert.ok(events.some(e=>e[0]==='target'));
 assert.equal(await player.toggle(64),true);
 assert.equal(nodes.length,4);
 player.dispose();
 assert.equal(player.playing,false);
 assert.ok(events.some(e=>e[0]==='close'));
});
test('stopping a delayed Web Audio context prevents a late reference tone',async()=>{
 let resumeRelease;
 const context={currentTime:0,async resume(){await new Promise(resolve=>{resumeRelease=resolve;});}};
 const player=new ReferencePitchPlayer(class{constructor(){return context;}});
 const attempt=player.toggle(45);
 await Promise.resolve();
 assert.equal(typeof resumeRelease,'function');
 player.stop();resumeRelease();
 assert.equal(await attempt,false);
 assert.equal(player.playing,false);
});
