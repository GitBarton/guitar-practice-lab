// Local-only Web Audio accompaniment; deliberately no downloads or third-party samples.
import {chordAtBar,clampHarmonyTempo} from './harmony.js';
export function midiFrequency(midi){return 440*Math.pow(2,(midi-69)/12);}
export class ChordBacking{
 constructor(onPosition=()=>{}){
  this.onPosition=onPosition;this.ctx=null;this.timer=null;this.playing=false;
  this.position=null;this.plan=null;this.tempo=72;this.barsPerChord=2;
  this.masterVolume=.5;this.clickEnabled=false;this.barNumber=0;this.nextBarTime=0;
  this.activeVoices=new Set();
 }
 async start(plan,options={}){
  if(!plan||!Array.isArray(plan.chords)||plan.chords.length!==3)throw Error('Choose a major or minor ii–V–I.');
  this.stop();
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Audio)throw Error('Browser audio is not available.');
  this.ctx=this.ctx||new Audio();
  await this.ctx.resume();
  this.plan=plan;this.tempo=clampHarmonyTempo(options.tempo??72);
  this.barsPerChord=[1,2,4].includes(Number(options.barsPerChord))?Number(options.barsPerChord):2;
  this.masterVolume=Math.max(0,Math.min(1,Number(options.volume??.55)));
  this.clickEnabled=Boolean(options.click);
  this.barNumber=0;this.nextBarTime=this.ctx.currentTime+.09;
  this.playing=true;
  this.timer=setInterval(()=>this.schedule(),30);
  this.schedule();
 }
 setTempo(value){this.tempo=clampHarmonyTempo(value);}
 setVolume(value){this.masterVolume=Math.max(0,Math.min(1,Number(value)||0));}
 setClick(value){this.clickEnabled=Boolean(value);}
 stop(){
  if(this.timer!==null)clearInterval(this.timer);
  this.timer=null;this.playing=false;
  if(this.ctx){const now=this.ctx.currentTime;
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
  const peak=Math.max(.0002,Math.min(.055,level));
  gain.gain.setValueAtTime(.0001,when);
  gain.gain.exponentialRampToValueAtTime(peak,when+.016);
  gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(when);osc.stop(when+duration+.01);
  const voice={osc,gain};this.activeVoices.add(voice);
  osc.onended=()=>this.activeVoices.delete(voice);
 }
 playChord(chord,when,barDuration,velocity=1){
  const length=Math.max(.24,Math.min(1.7,barDuration*.79));
  const count=Math.max(1,chord.midi.length);
  const strength=.12*this.masterVolume*velocity/count;
  for(const midi of chord.midi)this.playNote(midi,when,length,strength);
  // Root in the lower register, quiet enough not to overwhelm the guitar.
  this.playNote(chord.bassMidi,when,Math.min(length,1.25),.027*this.masterVolume);
 }
 click(when,strong){
  const ctx=this.ctx,g=ctx.createGain(),o=ctx.createOscillator();
  o.type='sine';o.frequency.setValueAtTime(strong?1030:720,when);
  g.gain.setValueAtTime(.0001,when);
  g.gain.exponentialRampToValueAtTime((strong?.05:.026)*this.masterVolume,when+.006);
  g.gain.exponentialRampToValueAtTime(.0001,when+.075);
  o.connect(g).connect(ctx.destination);o.start(when);o.stop(when+.09);
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
