import test from 'node:test';
import assert from 'node:assert/strict';
import {ARTIST_PROFILES,VOCAB_STUDIES,vocabularyNotes} from '../vocabulary.js';
import {KEYS} from '../data.js';
import {keyPc,renderTabSvg} from '../music.js';
test('four documented artist themes, exactly two ORIGINAL etudes per player',()=>{
 assert.deepEqual(ARTIST_PROFILES.map(a=>a.name),['Wes Montgomery','Pat Metheny','Mike Stern','John Scofield']);
 assert.equal(VOCAB_STUDIES.length,8);
 for(const player of ARTIST_PROFILES){
  assert.ok(player.source.startsWith('https://'));
  assert.equal(VOCAB_STUDIES.filter(s=>s.artist===player.id).length,2);
 }
});
test('musical pitch classes transpose accurately to every key on standard tuning',()=>{
 const opens=[64,59,55,50,45,40];
 for(const key of KEYS)for(const study of VOCAB_STUDIES){
  const notes=vocabularyNotes(study.id,key);
  const root=48+keyPc(key);
  assert.ok(notes.length>=4);
  for(let i=0;i<notes.length;i++){
   const n=notes[i];
   assert.equal(n.midi,opens[n.string]+n.fret,study.id+' '+key+' note '+i);
   assert.equal(n.pc,n.midi%12);
   assert.ok(n.fret>=0&&n.fret<=22);
  }
  const expected=study.type==='line'?study.offsets.map(x=>(root+x)%12):
    study.offsets.flatMap(x=>study.type==='octave'?[(root+x)%12,(root+x)%12]:[(root+x)%12,(root+x+3)%12]);
  assert.deepEqual(notes.map(n=>n.pc),expected,study.id+' '+key);
 }
});
test('octave pairs and Scofield-style dyads are vertically aligned in TAB',()=>{
 for(const id of ['wes-octave','scofield-double']){
  const notes=vocabularyNotes(id,'C');
  assert.equal(notes.length,8);
  for(let i=0;i<notes.length;i+=2){
   assert.equal(notes[i].beat,notes[i+1].beat);
   assert.notEqual(notes[i].string,notes[i+1].string);
  }
  // Renderer in main currently treats all note objects as sequential; this
  // study only carries shared beat IDs until the coordinated TAB renderer
  // fix from PR #33 is merged. Do not claim the visuals already line up.
  assert.match(renderTabSvg(notes),/<svg/);
 }
});
test('original studies reject unsupported keys and IDs',()=>{
 assert.throws(()=>vocabularyNotes('no-study','C'));
 assert.throws(()=>vocabularyNotes('wes-octave','H'));
});
