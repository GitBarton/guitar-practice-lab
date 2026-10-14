import test from 'node:test';
import assert from 'node:assert/strict';
import {SONGS,DRILL_BY_ID} from '../data.js';
import {mergeRecords,defaultState,createRecord} from '../storage.js';
import {CUSTOM_SONG_KIND,SONG_METERS,completeSongLibrary,manualSongs,newCustomSong,MAX_USER_SONGS} from '../manual-songs.js';
test('manual song validation keeps safe stable identity and connected technique',()=>{
 const s=newCustomSong({title:'  Blue Bossa  ',meter:'4/4',focus:'Minor ii–V–i with shell voicings',suggested:'jazz-251',
 notes:'AABB form, solo on chorus 2',initialKey:'Cm',initialTempo:'120'},SONGS,()=> '123e4567-e89b-12d3-a456-426614174000');
 assert.equal(s.id,'custom-123e4567-e89b-12d3-a456-426614174000');
 assert.equal(s.title,'Blue Bossa');
 assert.equal(s.meter,'4/4');
 assert.equal(s.initialKey,'Cm');
 assert.equal(s.initialTempo,120);
 assert.equal(s.suggested,'jazz-251');
 assert.ok(DRILL_BY_ID[s.suggested]);
 assert.equal(CUSTOM_SONG_KIND,'custom-song');
 assert.ok(SONG_METERS.includes('6/8'));
 assert.equal(MAX_USER_SONGS,250);
});
test('a user-added song joins existing library without modifying built-in repertoire',()=>{
 const builtInIds=SONGS.map(song=>song.id);
 const custom=newCustomSong({title:'Blue Bossa',focus:'Tonal center',notes:'AABB'},SONGS,()=> '123e4567-e89b-12d3-a456-426614174001');
 const records=[{id:'record-one',kind:CUSTOM_SONG_KIND,created_at:new Date().toISOString(),payload:custom}];
 const library=completeSongLibrary(records);
 assert.equal(library.length,SONGS.length+1);
 assert.deepEqual(SONGS.map(song=>song.id),builtInIds);
 const added=library.find(song=>song.id===custom.id);
 assert.ok(added.manual);
 assert.equal(added.title,'Blue Bossa');
 assert.equal(added.focus,'Tonal center');
 assert.equal(added.suggested,'jazz-guide');
 assert.equal(added.meter,'4/4');
});
test('manual song survives JSON backup/import/record merge with no schema changes',()=>{
 const state=defaultState(),custom=newCustomSong({title:'All Blues',meter:'6/8'},SONGS,()=> '123e4567-e89b-12d3-a456-426614174002');
 const record=createRecord(CUSTOM_SONG_KIND,custom);
 const json=JSON.stringify({records:[record],settings:state.settings});
 const imported=JSON.parse(json);
 const added=mergeRecords(state,imported.records);
 assert.equal(added,1);
 assert.equal(mergeRecords(state,imported.records),0);
 assert.equal(manualSongs(state.records)[0].title,'All Blues');
 assert.equal(manualSongs(state.records)[0].meter,'6/8');
 assert.ok(completeSongLibrary(state.records).some(s=>s.id===custom.id));
});
test('invalid, duplicate or excessive additions are rejected rather than damaging existing catalogue',()=>{
 assert.throws(()=>newCustomSong({title:'   '},SONGS),/Enter a song title/);
 assert.throws(()=>newCustomSong({title:'Autumn Leaves'},SONGS),/already in your repertoire/);
 assert.throws(()=>newCustomSong({title:'New Song',initialTempo:999},SONGS),/tempo must be/);
 assert.throws(()=>newCustomSong({title:'New Song',initialTempo:-30},SONGS),/tempo must be/);
 assert.throws(()=>newCustomSong({title:'New Song'},Array.from({length:MAX_USER_SONGS+SONGS.length},(_,i)=>({id:String(i),title:String(i)}))),/limit/);
 assert.throws(()=>newCustomSong({title:'New Song'},SONGS,()=> '../evil'),/safe song identifier/);
});
test('untrusted or corrupt custom song records are ignored; controlled fields are sanitized',()=>{
 const records=[
  {kind:CUSTOM_SONG_KIND,payload:{id:'autumn-leaves',title:'Override built-in'}},
  {kind:CUSTOM_SONG_KIND,payload:{id:'custom-invalid',title:''}},
  {kind:CUSTOM_SONG_KIND,payload:{id:'custom-abcdefgh',title:'<b>Not markup</b>',focus:'Short'}},
  {kind:'song',payload:{songId:'unrelated'}}
 ];
 const songs=manualSongs(records);
 assert.equal(songs.length,1);
 assert.equal(songs[0].title,'<b>Not markup</b>'); // UI must escape HTML
 assert.ok(!songs.some(s=>s.id==='autumn-leaves'));
});
test('custom-song definitions are not embedded MP3/WAV data and do not add new permissions',()=>{
 const custom=newCustomSong({title:'Independent',notes:'No audio attached',suggested:'comp-shell'},SONGS,()=> '123e4567-e89b-12d3-a456-426614174003');
 assert.ok(!('audio' in custom));
 assert.ok(!('file' in custom));
 assert.ok(!('url' in custom));
 assert.equal(completeSongLibrary([]).length,SONGS.length);
});
