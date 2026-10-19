// Local-only Web Audio accompaniment; deliberately no downloads or third-party samples.
import {chordAtBar,clampHarmonyTempo} from './harmony.js';
export function midiFrequency(midi){return 440*Math.pow(2,(midi-69)/12);}
export function clampMix(value,fallback=.42){
 const number=Number(value);
 return Number.isFinite(number)?Math.min(1,Math.max(0,number)):fallback;
}
export function makeReverbImpulse(ctx,seconds=1.65){
 const frames=Math.max(1,Math.round(ctx.sampleRate*seconds)),buffer=ctx.createBuffer(2,frames,ctx.sampleRate);
 // Deterministic diffuse decay; generated locally, no external samples.
 let seed=0x7ad131;
 for(let channel=0;channel<2;channel++){
  const data=buffer.getChannelData(channel);
  for(let i=0;i<frames;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const noise=(seed/4294967296)*2-1,position=i/frames;
   const attack=Math.min(1,i/(ctx.sampleRate*.008));
   data[i]=noise*Math.pow(1-position,2.8)*attack*.6;
  }
 }
 return buffer;
}
export class ChordBacking{
 constructor(onPosition=()=>{}){
  this.onPosition=onPosition;this.ctx=null;this.timer=null;this.playing=false;
  this.position=null;this.plan=null;this.tempo=72;this.barsPerChord=2;
  this.masterVolume=.65;this.reverbMix=.42;this.clickEnabled=false;this.barNumber=0;this.nextBarTime=0;
  this.dryBus=null;this.wetBus=null;this.reverb=null;this.masterBus=null;this.outputCompressor=null;
  this.activeVoices=new Set();
 }
 async start(plan,options={}){
  if(!plan||!Array.isArray(plan.chords)||plan.chords.length!==3)throw Error('Choose a major or minor ii–V–I.');
  this.stop();
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Audio)throw Error('Browser audio is not available.');
  this.ctx=this.ctx||new Audio();
  await this.ctx.resume();
  this.setupOutput();
  this.wetBus.gain.setTargetAtTime(this.reverbMix*.62,this.ctx.currentTime,.02);
  this.plan=plan;this.tempo=clampHarmonyTempo(options.tempo??72);
  this.barsPerChord=[1,2,4].includes(Number(options.barsPerChord))?Number(options.barsPerChord):2;
  this.masterVolume=clampMix(options.volume??.65,.65);
  this.setReverb(options.reverb??.42);
  this.clickEnabled=Boolean(options.click);
  this.barNumber=0;this.nextBarTime=this.ctx.currentTime+.09;
  this.playing=true;
  this.timer=setInterval(()=>this.schedule(),30);
  this.schedule();
 }
 setTempo(value){this.tempo=clampHarmonyTempo(value);}
 setVolume(value){
  this.masterVolume=clampMix(value,.65);
  // Volume adjustments affect future notes, while the output bus responds
  // immediately without restarting the harmony clock or active session.
  if(this.masterBus&&this.ctx){
   this.masterBus.gain.setTargetAtTime(.88*this.masterVolume,this.ctx.currentTime,.025);
  }
 }
 setReverb(value){
  this.reverbMix=clampMix(value,.42);
  if(this.wetBus&&this.ctx)this.wetBus.gain.setTargetAtTime(this.reverbMix*.62,this.ctx.currentTime,.035);
 }
 setupOutput(){
  if(this.dryBus)return;
  const ctx=this.ctx;
  const dry=ctx.createGain(),wet=ctx.createGain(),convolver=ctx.createConvolver();
  const master=ctx.createGain(),comp=ctx.createDynamicsCompressor();
  convolver.buffer=makeReverbImpulse(ctx);
  comp.threshold.value=-13;comp.knee.value=12;comp.ratio.value=2.5;
  comp.attack.value=.008;comp.release.value=.24;
  dry.gain.value=1;wet.gain.value=this.reverbMix*.62;master.gain.value=.88*this.masterVolume;
  dry.connect(master);convolver.connect(wet);wet.connect(master);
  master.connect(comp).connect(ctx.destination);
  this.dryBus=dry;this.wetBus=wet;this.reverb=convolver;
  this.masterBus=master;this.outputCompressor=comp;
 }
 setClick(value){this.clickEnabled=Boolean(value);}
 stop(){
  if(this.timer!==null)clearInterval(this.timer);
  this.timer=null;this.playing=false;
  if(this.ctx){const now=this.ctx.currentTime;
   if(this.wetBus){this.wetBus.gain.cancelScheduledValues(now);this.wetBus.gain.setTargetAtTime(0,now,.018);}
   for(const voice of this.activeVoices){
    try{voice.gain.gain.cancelScheduledValues(now);
     voice.gain.gain.setValueAtTime(Math.max(.0001,voice.gain.gain.value),now);
     voice.gain.gain.exponentialRampToValueAtTime(.0001,now+.04);
     voice.osc.stop(now+.05);
    }catch{/* oscillator may already be stopped */}
   }
  }
  this.activeVoices.clear();
  this.position=null;
  this.onPosition(null);
 }
 playNote(midi,when,duration,level){
  const ctx=this.ctx;
  const gain=ctx.createGain(),filter=ctx.createBiquadFilter(),osc=ctx.createOscillator();
  osc.type='triangle';osc.frequency.setValueAtTime(midiFrequency(midi),when);
  filter.type='lowpass';filter.frequency.setValueAtTime(1900,when);
  // Soft electric-piano-like strike and decay, conservative output level.
  const peak=Math.max(.0002,Math.min(.11,level));
  gain.gain.setValueAtTime(.0001,when);
  gain.gain.exponentialRampToValueAtTime(peak,when+.016);
  gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
  osc.connect(filter).connect(gain).connect(this.dryBus);
  gain.connect(this.reverb);
  osc.start(when);osc.stop(when+duration+.01);
  const voice={osc,gain};this.activeVoices.add(voice);
  osc.onended=()=>this.activeVoices.delete(voice);
 }
 playChord(chord,when,barDuration,velocity=1){
  const length=Math.max(.24,Math.min(1.7,barDuration*.79));
  const count=Math.max(1,chord.midi.length);
  const strength=.34*this.masterVolume*velocity/count;
  // Keep root-position tonic distinct; slightly emphasize the root without inverting tones.
  for(let index=0;index<chord.midi.length;index++){
   const weight=chord.index===2&&index===0?1.18:1;
   this.playNote(chord.midi[index],when,length,strength*weight);
  }
  // The tonic uses a less boomy C3 bass; the other chords retain their lower anchor.
  this.playNote(chord.bassMidi,when,Math.min(length,1.25),.052*this.masterVolume);
 }
 click(when,strong){
  const ctx=this.ctx,g=ctx.createGain(),o=ctx.createOscillator();
  o.type='sine';o.frequency.setValueAtTime(strong?1030:720,when);
  g.gain.setValueAtTime(.0001,when);
  g.gain.exponentialRampToValueAtTime((strong?.05:.026)*this.masterVolume,when+.006);
  g.gain.exponentialRampToValueAtTime(.0001,when+.075);
  o.connect(g).connect(this.dryBus);o.start(when);o.stop(when+.09);
  const voice={osc:o,gain:g};this.activeVoices.add(voice);
  o.onended=()=>this.activeVoices.delete(voice);
 }
 schedule(){
  if(!this.playing||!this.ctx||!this.plan)return;
  let count=0;
  while(this.nextBarTime<this.ctx.currentTime+.15 && count++<3){
   const step=chordAtBar(this.barNumber,this.barsPerChord);
   const chord=this.plan.chords[step.chordIndex];
   const beatSeconds=60/this.tempo,barSeconds=4*beatSeconds;
   this.playChord(chord,this.nextBarTime,barSeconds,step.barInChord===1?1:.7);
   if(this.clickEnabled){for(let beat=0;beat<4;beat++)this.click(this.nextBarTime+beat*beatSeconds,beat===0);}
   this.position={...step,chord,label:chord.label,barNumber:this.barNumber+1};
   this.onPosition(this.position);
   this.nextBarTime+=barSeconds;this.barNumber++;
  }
 }
}
