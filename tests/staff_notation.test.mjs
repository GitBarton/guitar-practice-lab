import test from 'node:test';
import assert from 'node:assert/strict';
import {guitarMidi,keySignature,writtenNote,notationColumns,renderStaffTabSvg} from '../staff-notation.js';
import {referenceStudyNotes,REFERENCE_STUDY_IDS} from '../reference-studies.js';
import {KEYS} from '../data.js';

test('all twelve supported major keys have correct key-signature counts',()=>{
 const fifths={C:0,F:-1,Bb:-2,Eb:-3,Ab:-4,Db:-5,Gb:-6,B:5,E:4,A:3,D:2,G:1};
 for(const key of KEYS)assert.equal(keySignature(key).fifths,fifths[key],key);
 assert.equal(keySignature('G').alters.F,1);
 assert.equal(keySignature('F').alters.B,-1);
 assert.throws(()=>keySignature('H'));
});

test('guitar uses sounding midi and written treble at octave above',()=>{
 assert.equal(guitarMidi({string:5,fret:0}),40);
 assert.equal(guitarMidi({string:0,fret:0}),64);
 const lowE=writtenNote(40,'C');
 assert.equal(lowE.letter,'E');
 assert.equal(lowE.octave,3);
 const middle=writtenNote(60,'C');
 assert.equal(middle.letter,'C');
 assert.equal(middle.octave,5);
 assert.equal(writtenNote(65,'F').accidental,null);
 assert.equal(writtenNote(66,'C').accidental,'♯');
 assert.throws(()=>guitarMidi({string:0,fret:23}),RangeError);
});

test('simultaneous octave/dyad notes align in both staves',()=>{
 const notes=[{string:5,fret:8,beat:0},{string:3,fret:10,beat:0},{string:1,fret:5,beat:1}];
 const c=notationColumns(notes);
 assert.deepEqual(c.positions,[0,0,1]);
 assert.equal(c.count,2);
 const svg=renderStaffTabSvg(notes,'C',1);
 assert.match(svg,/Guitar treble staff/);
 assert.match(svg,/Pitch and fingering alignment only/);
 assert.match(svg,/STAFF/);
 assert.match(svg,/&#39;|8/);
 assert.match(svg,/aria-label=/);
 assert.match(svg,/viewBox=/);
});

test('reference-inspired lines transpose in all keys and stay physically playable',()=>{
 for(const id of REFERENCE_STUDY_IDS)for(const key of KEYS){
  const notes=referenceStudyNotes(id,key);
  assert.ok(notes.length>=4);
  for(const n of notes){
   assert.equal(guitarMidi(n),n.midi);
   assert.ok(n.fret>=0&&n.fret<=22);
   assert.ok(n.string>=0&&n.string<6);
  }
  assert.match(renderStaffTabSvg(notes,key),/<svg/);
 }
 assert.equal(referenceStudyNotes('missing'),null);
});

test('staff and TAB share columns with accessible interactive note selection',()=>{
 const notes=[{string:5,fret:8,beat:0},{string:3,fret:10,beat:0},{string:1,fret:5,beat:1}];
 const svg=renderStaffTabSvg(notes,'Bb',1,{actionPrefix:'score-focus'});
 assert.match(svg,/class="guitar-staff-tab"/);
 assert.match(svg,/data-action="score-focus:0"/);
 assert.match(svg,/data-action="score-focus:1"/);
 assert.match(svg,/data-action="score-focus:2"/);
 assert.match(svg,/tabindex="0"/);
 assert.match(svg,/Guitar treble staff/);
 assert.match(svg,/♭/);
 assert.match(svg,/Pitch and fingering alignment only/);
});
