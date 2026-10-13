// Browser-only playback for user-selected files. No uploads or persistence.
export const MAX_LOCAL_TRACK_BYTES=250*1024*1024;
export function validateLocalTrack(file){
 if(!file||typeof file.name!=='string')throw Error('Choose a local MP3 or WAV file.');
 if(!/\.(mp3|wav)$/i.test(file.name))throw Error('Choose an MP3 (.mp3) or WAV (.wav) file.');
 if(!Number.isFinite(file.size)||file.size<=0)throw Error('That audio file is empty or unreadable.');
 if(file.size>MAX_LOCAL_TRACK_BYTES)throw Error('This file is over 250 MB. Choose a smaller rehearsal file.');
 return file;
}
export function songClock(seconds){
 if(!Number.isFinite(seconds)||seconds<0)return '0:00';
 const s=Math.floor(seconds);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
}
export class SongTrackPlayer{
 constructor(onChange=()=>{}){
  this.onChange=onChange;this.audio=null;this.objectUrl=null;this.songId=null;this.fileName='';
  this.abStart=null;this.abEnd=null;this.abLoop=false;this.fullLoop=false;this.volume=.7;this.error='';
 }
 ensureAudio(){
  if(this.audio)return this.audio;
  const Audio=globalThis.Audio;
  if(!Audio)throw Error('Browser audio playback is unavailable.');
  this.audio=new Audio();
  this.audio.preload='metadata';this.audio.volume=this.volume;
  this.audio.onloadedmetadata=()=>this.onChange();
  this.audio.ontimeupdate=()=>{
   if(this.abLoop&&this.abStart!==null&&this.abEnd!==null&&this.audio.currentTime>=this.abEnd){
    this.audio.currentTime=this.abStart;
   }
   this.onChange();
  };
  this.audio.onplay=()=>this.onChange();
  this.audio.onpause=()=>this.onChange();
  this.audio.onended=()=>this.onChange();
  this.audio.onerror=()=>{this.error='This browser could not play the selected file. Try a different MP3 or WAV.';this.onChange();};
  return this.audio;
 }
 load(file,songId){
  validateLocalTrack(file);
  if(!songId||typeof songId!=='string')throw Error('Select a song first.');
  const url=URL.createObjectURL(file);
  this.pause();
  if(this.objectUrl)URL.revokeObjectURL(this.objectUrl);
  const a=this.ensureAudio();
  this.objectUrl=url;this.songId=songId;this.fileName=file.name;
  this.abStart=null;this.abEnd=null;this.abLoop=false;this.fullLoop=false;this.error='';
  a.loop=false;a.src=url;a.load();this.onChange();
 }
 async play(){
  if(!this.audio||!this.objectUrl)throw Error('Choose an MP3 or WAV file first.');
  this.error='';
  await this.audio.play();
  this.onChange();
 }
 pause(){if(this.audio)this.audio.pause();this.onChange();}
 stop(){
  if(!this.audio)return;
  this.audio.pause();
  try{this.audio.currentTime=0;}catch{/* unavailable until metadata */}
  this.onChange();
 }
 setVolume(value){
  this.volume=Math.max(0,Math.min(1,Number(value)||0));
  if(this.audio)this.audio.volume=this.volume;
  this.onChange();
 }
 setFullLoop(enabled){this.fullLoop=Boolean(enabled);if(this.fullLoop)this.abLoop=false;this.applyLoop();this.onChange();}
 markA(){if(!this.audio)return false;this.abStart=this.audio.currentTime;this.abEnd=null;this.abLoop=false;this.applyLoop();this.onChange();return true;}
 markB(){
  if(!this.audio||this.abStart===null||this.audio.currentTime<=this.abStart+.2)return false;
  this.abEnd=this.audio.currentTime;this.abLoop=true;this.fullLoop=false;this.applyLoop();this.onChange();return true;
 }
 clearAB(){this.abStart=null;this.abEnd=null;this.abLoop=false;this.applyLoop();this.onChange();}
 applyLoop(){if(this.audio)this.audio.loop=this.fullLoop&&!this.abLoop;}
 seek(value){
  if(!this.audio||!Number.isFinite(this.audio.duration))return;
  this.audio.currentTime=Math.max(0,Math.min(this.audio.duration,Number(value)||0));
  this.onChange();
 }
 snapshot(){
  const a=this.audio;
  return {songId:this.songId,fileName:this.fileName,loaded:Boolean(this.objectUrl),
   current:a&&Number.isFinite(a.currentTime)?a.currentTime:0,
   duration:a&&Number.isFinite(a.duration)?a.duration:0,
   playing:Boolean(a&&!a.paused&&!a.ended),volume:this.volume,fullLoop:this.fullLoop,
   abStart:this.abStart,abEnd:this.abEnd,abLoop:this.abLoop,error:this.error};
 }
 dispose(){
  this.stop();
  if(this.objectUrl)URL.revokeObjectURL(this.objectUrl);
  this.objectUrl=null;this.songId=null;this.fileName='';
  if(this.audio){this.audio.removeAttribute('src');this.audio.load();}
  this.onChange();
 }
}
