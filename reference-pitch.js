// Reference-pitch oscillator: plays a selected note for tuning by ear.
// No microphone request, recording, pitch detection, storage or network access.
export const OPEN_STRING_PITCHES=Object.freeze([
 {id:'E2',label:'Low E',midi:40,string:'6'},
 {id:'A2',label:'A',midi:45,string:'5'},
 {id:'D3',label:'D',midi:50,string:'4'},
 {id:'G3',label:'G',midi:55,string:'3'},
 {id:'B3',label:'B',midi:59,string:'2'},
 {id:'E4',label:'High E',midi:64,string:'1'}
]);
const CHROMATIC_NAMES=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
export const PITCH_CHOICES=Object.freeze(Array.from({length:49},(_,index)=>{
 const midi=index+40;
 return Object.freeze({midi,label:CHROMATIC_NAMES[midi%12]+(Math.floor(midi/12)-1)});
}));
export function pitchFrequency(midi,concertA=440){
 if(!Number.isInteger(midi)||midi<0||midi>127)throw new RangeError('MIDI pitch must be 0–127');
 if(!Number.isFinite(concertA)||concertA<400||concertA>480)throw new RangeError('Reference A must be 400–480 Hz');
 return concertA*2**((midi-69)/12);
}
export function registerTempoTap(previous=[],timeMs=Date.now()){
 if(!Number.isFinite(timeMs))return {taps:[],bpm:null};
 const taps=Array.isArray(previous)?previous.filter(t=>Number.isFinite(t)&&t<=timeMs&&timeMs-t<2100).slice(-3):[];
 if(taps.length&&timeMs-taps.at(-1)<250)return {taps,bpm:null}; // ignore accidental double clicks
 taps.push(timeMs);
 if(taps.length<2)return {taps,bpm:null};
 const intervals=taps.slice(1).map((t,i)=>t-taps[i]);
 if(intervals.some(ms=>ms<250||ms>2000))return {taps:[timeMs],bpm:null};
 const average=intervals.reduce((a,b)=>a+b,0)/intervals.length;
 return {taps,bpm:Math.max(30,Math.min(240,Math.round(60000/average)))};
}
export class ReferencePitchPlayer{
 constructor(AudioContextClass=null){
  this.AudioContextClass=AudioContextClass;
  this.ctx=null;this.activeMidi=null;this.oscillators=[];this.output=null;
  this.generation=0;
 }
 get playing(){return this.activeMidi!==null;}
 async toggle(midi){
  const note=Number(midi);pitchFrequency(note);
  if(this.activeMidi===note){this.stop();return false;}
  this.stop();
  const generation=this.generation;
  try{
   const Audio=this.AudioContextClass||globalThis.AudioContext||globalThis.webkitAudioContext;
   if(!Audio)throw new Error('Web Audio not supported by this browser');
   this.ctx=this.ctx||new Audio();
   await this.ctx.resume();
   if(generation!==this.generation)return false; // prevents delayed resume after Stop
   const ctx=this.ctx,at=ctx.currentTime+.015,base=pitchFrequency(note);
   const bus=ctx.createGain();
   bus.gain.setValueAtTime(.0001,at);
   bus.gain.linearRampToValueAtTime(.065,at+.055);
   bus.connect(ctx.destination);
   const oscillators=[];
   try{
    for(const [harmonic,level] of [[1,1],[2,.14]]){
     const osc=ctx.createOscillator(),individual=ctx.createGain();
     osc.type='sine';
     osc.frequency.setValueAtTime(base*harmonic,at);
     individual.gain.value=level;
     osc.connect(individual).connect(bus);
     osc.start(at);
     oscillators.push(osc);
    }
   }catch(error){
    for(const osc of oscillators){try{osc.stop();}catch{}}
    bus.disconnect();
    throw error;
   }
   this.output=bus;this.oscillators=oscillators;this.activeMidi=note;
   return true;
  }catch(error){this.stop();throw error;}
 }
 stop(){
  this.generation++;
  const ctx=this.ctx,output=this.output,oscillators=this.oscillators;
  this.activeMidi=null;this.output=null;this.oscillators=[];
  if(!ctx)return;
  const now=ctx.currentTime;
  if(output){
   try{output.gain.cancelScheduledValues(now);output.gain.setTargetAtTime(.0001,now,.022);}catch{}
  }
  for(const osc of oscillators){try{osc.stop(now+.12);}catch{}}
 }
 dispose(){
  this.stop();
  const ctx=this.ctx;this.ctx=null;
  if(ctx?.close){const closed=ctx.close();closed?.catch?.(()=>{});}
 }
}
