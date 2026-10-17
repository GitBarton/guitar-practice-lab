// Original 1–5–3 diatonic string-skip practice and pitch-validated shell grips.
// Patterns are constructed from major-key diatonic seventh chords; they are not
// transcriptions of any copyrighted Eric Johnson recording.
import {KEYS} from './data.js';
import {diatonicSevenths} from './theory-lab.js';
import {keyPc,noteName} from './music.js';
const OPENS=[64,59,55,50,45,40]; // high e to low E
const FIGURES={
 'rhythm-153-primary':[0,3,4],
 'rhythm-153-minors':[1,2,5],
 'rhythm-153-all':[0,1,2,3,4,5,6],
 'rhythm-153-251':[1,4,0],
 'rhythm-153-turnaround':[0,5,1,4]
};
const GRIPS={
 0:[null,null,4,2,3,null],  // Cmaj7 x324xx, C–E–B
 1:[null,null,5,3,5,null],  // Dm7 x535xx, D–F–C
 3:[null,null,2,2,null,1],  // Fmaj7 1x22xx, F–E–A
 4:[null,null,4,3,null,3],  // G7 3x34xx, G–F–B
 5:[null,null,5,5,null,5]   // Am7 5x55xx, A–G–C
};
const CHORD_SEQUENCES={
 'rhythm-chords-251':[1,4,0],
 'rhythm-chords-1625':[0,5,1,4],
 'rhythm-chords-1451':[0,3,4,0]
};
const TRIADS_QUALITY={'maj7':4,'m7':3,'7':4,'m7♭5':3};
export function rhythmFigure(kind,key='C'){
 if(!Object.hasOwn(FIGURES,kind)||!KEYS.includes(key))throw Error('Unsupported rhythm figure/key');
 const chords=diatonicSevenths(key);
 let index=0;
 const notes=[];
 for(const degree of FIGURES[kind]){
  const chord=chords[degree],root=48+chord.rootPc;
  const third=root+12+(TRIADS_QUALITY[chord.quality]??4);
  const steps=[
   {midi:root,string:4,interval:'1'},      // A string
   {midi:root+7,string:2,interval:'5'},    // G string; D is silent
   {midi:third,string:1,interval:chord.quality==='m7'||chord.quality==='m7♭5'?'♭3':'3'} // B string
  ];
  for(const note of steps){
   const fret=note.midi-OPENS[note.string];
   if(fret<0||fret>22)throw Error('Generated skip outside a standard 22-fret guitar');
   notes.push({...note,fret,name:noteName(note.midi),pc:note.midi%12,index:index++,
    pick:index%2?'D':'U',role:chord.role,chord:chord.symbol});
  }
 }
 return notes;
}
function shiftFor(key,ids){
 const tonic=keyPc(key);
 const shifts=[tonic-12,tonic,tonic+12].filter(shift=>
  ids.every(id=>GRIPS[id].every(fret=>fret==null||(fret+shift>=0&&fret+shift<=22))));
 if(!shifts.length)throw Error('No playable shape position');
 return shifts.sort((a,b)=>Math.abs(a+5)-Math.abs(b+5))[0];
}
export function rhythmChordShapes(kind,key='C'){
 if(!Object.hasOwn(CHORD_SEQUENCES,kind)||!KEYS.includes(key))throw Error('Unsupported chord sequence/key');
 const ids=CHORD_SEQUENCES[kind],chords=diatonicSevenths(key),shift=shiftFor(key,ids);
 return ids.map(degree=>{
  const chord=chords[degree],shape=GRIPS[degree].map(fret=>fret===null?null:fret+shift);
  const noteMidis=shape.map((fret,string)=>fret===null?null:OPENS[string]+fret).filter(n=>n!==null);
  const allowed=new Set(chord.pitchClasses);
  if(!noteMidis.every(note=>allowed.has(note%12)))throw Error('Chord grip contains a foreign note');
  return {label:chord.role,name:chord.symbol,quality:chord.quality,shape,noteMidis,
   requiredRoot:chord.rootPc};
 });
}
export function rhythmProgressionLabels(kind,key='C'){
 if(Object.hasOwn(FIGURES,kind)){
  const chords=diatonicSevenths(key);
  return FIGURES[kind].map(i=>chords[i].symbol);
 }
 return rhythmChordShapes(kind,key).map(c=>c.name);
}
