import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS,DRILL_BY_ID,stageCount,makeSession} from '../data.js';
import {diatonicSevenths} from '../theory-lab.js';
import {rhythmFigure,rhythmChordShapes,rhythmProgressionLabels} from '../rhythm-variations.js';
const OPEN=[64,59,55,50,45,40];
const minor=new Set(['m7','m7♭5']);
test('1-5-3 is authentic to each diatonic chord degree in all 12 keys',()=>{
 for(const key of KEYS){
  const chords=diatonicSevenths(key);
  for(const kind of ['rhythm-153-primary','rhythm-153-minors','rhythm-153-all','rhythm-153-251','rhythm-153-turnaround']){
   const notes=rhythmFigure(kind,key);
   assert.equal(notes.length,rhythmProgressionLabels(kind,key).length*3);
   for(let start=0;start<notes.length;start+=3){
    const group=notes.slice(start,start+3),chord=chords.find(c=>c.symbol===group[0].chord);
    assert.ok(chord);
    assert.deepEqual(group.map(n=>n.string),[4,2,1]);
    assert.deepEqual(group.map(n=>n.interval),['1',chord.quality==='m7♭5'?'♭5':'5',minor.has(chord.quality)?'♭3':'3']);
    assert.deepEqual(group.map(n=>n.pc),[chord.rootPc,chord.pitchClasses[2],chord.pitchClasses[1]]);
    for(const note of group){
     assert.ok(note.fret>=0&&note.fret<=22);
     assert.equal(note.midi,OPEN[note.string]+note.fret);
    }
   }
  }
 }
});
test('C-major four-chord turnaround has correct note spellings and explicit string skips',()=>{
 const notes=rhythmFigure('rhythm-153-turnaround','C');
 assert.deepEqual(rhythmProgressionLabels('rhythm-153-turnaround','C'),['Cmaj7','Am7','Dm7','G7']);
 assert.deepEqual(notes.slice(0,3).map(n=>n.name),['C3','G3','E4']);
 assert.deepEqual(notes.slice(3,6).map(n=>n.name),['A3','E4','C5']);
});
test('muted shell grips do not include non-chord tones, in all keys and rotations',()=>{
 for(const key of KEYS){
  const chords=diatonicSevenths(key);
  for(const kind of ['rhythm-chords-251','rhythm-chords-1625','rhythm-chords-1451']){
   const patterns=rhythmChordShapes(kind,key);
   assert.deepEqual(patterns.map(x=>x.name),rhythmProgressionLabels(kind,key));
   for(const pattern of patterns){
    const chord=chords.find(x=>x.symbol===pattern.name),allowed=new Set(chord.pitchClasses);
    assert.equal(pattern.shape.length,6);
    assert.equal(pattern.noteMidis.length,3);
    assert.equal(pattern.shape.filter(n=>n!==null).length,3);
    assert.ok(pattern.noteMidis.every(m=>allowed.has(m%12)));
    for(let string=0;string<6;string++){
     const fret=pattern.shape[string];
     if(fret===null)continue;
     assert.ok(fret>=0&&fret<=22);
     assert.ok(allowed.has((OPEN[string]+fret)%12));
    }
   }
  }
 }
});
test('C-major shells are recognizable and un-inverted bass roots',()=>{
 const chords=rhythmChordShapes('rhythm-chords-1625','C');
 assert.deepEqual(chords.map(x=>x.name),['Cmaj7','Am7','Dm7','G7']);
 assert.deepEqual(chords[0].shape,[null,null,4,2,3,null]);
 assert.deepEqual(chords[1].shape,[null,null,5,5,null,5]);
 assert.deepEqual(chords[2].shape,[null,null,5,3,5,null]);
 assert.deepEqual(chords[3].shape,[null,null,4,3,null,3]);
});
test('swing, 1-5-3 muting skips and comping all have changing 3-stage practice',()=>{
 for(const id of ['picking-swing','muting-skip','muting-chord']){
  const d=DRILL_BY_ID[id];
  assert.equal(stageCount(d),3);
  assert.ok(d.stages.every(stage=>stage.focus&&stage.instructions.length>=2));
  for(const st of d.stages){
   if(st.exampleKind.startsWith('rhythm-153-'))assert.ok(rhythmFigure(st.exampleKind,'Bb').length>0);
   else assert.ok(rhythmChordShapes(st.exampleKind,'Bb').length>=3);
  }
 }
 assert.equal(makeSession(9).entries.reduce((n,e)=>n+e.minutes,0),45);
});
test('unknown patterns and key inputs fail closed',()=>{
 assert.throws(()=>rhythmFigure('rhythm-notreal','C'));
 assert.throws(()=>rhythmFigure('rhythm-153-all','H'));
 assert.throws(()=>rhythmChordShapes('rhythm-153-all','C'));
 assert.throws(()=>rhythmChordShapes('rhythm-chords-251','H'));
});
