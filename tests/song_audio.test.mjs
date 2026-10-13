import test from 'node:test';
import assert from 'node:assert/strict';
import {SongTrackPlayer,songClock,validateLocalTrack,MAX_LOCAL_TRACK_BYTES} from '../song-audio.js';

test('accept standard local MP3 and WAV files, including uppercase extensions',()=>{
 const sample={name:'Backing.MP3',size:42000};
 assert.equal(validateLocalTrack(sample),sample);
 assert.equal(validateLocalTrack({name:'Solo.WAV',size:600000}).name,'Solo.WAV');
});
test('reject unsupported, empty and oversized files',()=>{
 for(const x of [null,{name:'x.flac',size:100},{name:'x.mp3',size:0},
  {name:'x.wav',size:MAX_LOCAL_TRACK_BYTES+1}]){
  assert.throws(()=>validateLocalTrack(x));
 }
});
test('show readable audio positions',()=>{
 assert.equal(songClock(0),'0:00');
 assert.equal(songClock(69.8),'1:09');
 assert.equal(songClock(3600),'60:00');
 assert.equal(songClock(NaN),'0:00');
});
test('local player loops A to B and releases temporary blob URL',async()=>{
 const originalAudio=globalThis.Audio;
 const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
 let counter=0;const revoked=[];
 class FakeAudio{
  constructor(){this.preload='';this.paused=true;this.ended=false;this.currentTime=0;this.duration=90;this.volume=.7;this.loop=false;this.src='';}
  pause(){this.paused=true;this.onpause?.();}
  async play(){this.paused=false;this.onplay?.();}
  load(){this.onloadedmetadata?.();}
  removeAttribute(attr){if(attr==='src')this.src='';}
 }
 try{
  globalThis.Audio=FakeAudio;
  URL.createObjectURL=()=> 'blob:test-'+(++counter);
  URL.revokeObjectURL=url=>revoked.push(url);
  const p=new SongTrackPlayer();
  p.load({name:'test.wav',size:1234},'autumn-leaves');
  assert.equal(p.snapshot().loaded,true);
  assert.equal(p.snapshot().fileName,'test.wav');
  assert.equal(p.snapshot().songId,'autumn-leaves');
  await p.play();
  assert.equal(p.snapshot().playing,true);
  p.audio.currentTime=15;
  assert.equal(p.markA(),true);
  p.audio.currentTime=17;
  assert.equal(p.markB(),true);
  assert.equal(p.snapshot().abLoop,true);
  p.audio.currentTime=17.5;p.audio.ontimeupdate();
  assert.equal(p.audio.currentTime,15);
  p.clearAB();assert.equal(p.snapshot().abLoop,false);
  p.setFullLoop(true);assert.equal(p.audio.loop,true);
  p.setVolume(.4);assert.equal(p.audio.volume,.4);
  p.seek(24);assert.equal(p.audio.currentTime,24);
  p.load({name:'vocal.mp3',size:2000},'all-of-me');
  assert.deepEqual(revoked,['blob:test-1']);
  assert.equal(p.snapshot().abStart,null);
  p.dispose();assert.deepEqual(revoked,['blob:test-1','blob:test-2']);
  assert.equal(p.snapshot().loaded,false);
 }finally{
  globalThis.Audio=originalAudio;
  URL.createObjectURL=originalCreate;
  URL.revokeObjectURL=originalRevoke;
 }
});
