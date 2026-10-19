import test from 'node:test';
import assert from 'node:assert/strict';
import {SongTrackPlayer} from '../song-audio.js';

test('missing browser Audio never allocates an object URL',()=>{
 const previous=globalThis.Audio; const oldURL=globalThis.URL.createObjectURL; let created=0;
 try{
  globalThis.Audio=undefined;globalThis.URL.createObjectURL=()=>{created++;return 'blob:test';};
  assert.throws(()=>new SongTrackPlayer().load({name:'private.mp3',size:120},'song'),/unavailable/);
  assert.equal(created,0);
 }finally{globalThis.Audio=previous;globalThis.URL.createObjectURL=oldURL;}
});
