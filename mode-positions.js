// Five position-bounded, standard-tuning fretboard regions anchored to CAGED root shapes.
// References:
// Berklee Online Guitar Scales 101 — "One Scale in Five Positions on the Guitar"
// https://online.berklee.edu/courses/guitar-scales-101
// Berklee Online — How to Start Learning Your Guitar Scales
// https://online.berklee.edu/takenote/how-to-start-learning-your-guitar-scales/
// Leavitt, A Modern Method for Guitar, Vol. 1–2 (Berklee Press; positional techniques).
// These are newly calculated mode note maps inside five conventional CAGED ROOT
// neighborhoods, not facsimiles of proprietary scale fingerings or textbook figures.
import {keyPc,noteName} from './music.js';

export const STRING_OPEN_MIDI=Object.freeze([64,59,55,50,45,40]); // 1st high e to 6th low E
export const CAGED_REGIONS=Object.freeze([
 Object.freeze({id:'C',label:'C shape',start:0,end:3,rootAnchors:[[4,3],[1,1]],description:'A-string / B-string root landmarks'}),
 Object.freeze({id:'A',label:'A shape',start:3,end:6,rootAnchors:[[4,3],[2,5]],description:'A-string / G-string root landmarks'}),
 Object.freeze({id:'G',label:'G shape',start:5,end:8,rootAnchors:[[5,8],[2,5]],description:'Low-E / G-string root landmarks'}),
 Object.freeze({id:'E',label:'E shape',start:8,end:11,rootAnchors:[[5,8],[3,10]],description:'Low-E / D-string root landmarks'}),
 Object.freeze({id:'D',label:'D shape',start:10,end:13,rootAnchors:[[3,10],[0,8]],description:'D-string / high-E root landmarks'})
]);
export function positionForMode(scale,shapeId='G'){
 if(!scale?.intervals?.length||!Array.isArray(scale.pitchClasses)||!Array.isArray(scale.degrees))
  throw new Error('A valid modal scale is required');
 const shape=CAGED_REGIONS.find(s=>s.id===shapeId);
 if(!shape)throw new Error('Unknown CAGED root region');
 const root=keyPc(scale.key);
 if(!Number.isInteger(root)||root<0||root>11)throw new Error('Unsupported key');
 // Transpose the C-root regions chromatically; wrap only complete position regions
 // down one octave when necessary to keep every target on a standard 22-fret guitar.
 let first=shape.start+root,last=shape.end+root,shift=root;
 if(last>22){first-=12;last-=12;shift-=12;}
 if(first<0||last>22)throw new Error('CAGED position out of fretboard bounds');
 const degreeByPc=new Map(scale.pitchClasses.map((pc,index)=>[pc,{degreeIndex:index,interval:scale.degrees[index]}]));
 const notes=[];
 for(let string=5;string>=0;string--){
  for(let fret=first;fret<=last;fret++){
   const midi=STRING_OPEN_MIDI[string]+fret,info=degreeByPc.get(midi%12);
   if(!info)continue;
   // Four adjacent fret positions: index/middle/ring/pinky, open string uses 0.
   // Fingering is a POSITION GUIDE, not a claim that every guitarist must use
   // identical finger assignments for every articulation.
   const finger=fret===0?0:fret-(first===0?1:first)+1;
   if(finger<0||finger>4)throw new Error('Fingering out of standard four-fret hand frame');
   notes.push({
    midi,pc:midi%12,name:noteName(midi),string,fret,
    finger,interval:info.interval,degreeIndex:info.degreeIndex,
    pick:notes.length%2?'U':'D',index:notes.length,
    root:info.degreeIndex===0
   });
  }
 }
 const roots=shape.rootAnchors.map(([string,baseFret])=>({
  string,fret:baseFret+shift,midi:STRING_OPEN_MIDI[string]+baseFret+shift
 })).filter(x=>x.fret>=first&&x.fret<=last);
 if(!roots.length||roots.some(x=>x.midi%12!==root))throw new Error('CAGED root landmark is incorrect');
 for(const anchor of roots){
  if(!notes.some(note=>note.string===anchor.string&&note.fret===anchor.fret&&note.root))
   throw new Error('CAGED root missing from modal note map');
 }
 if(notes.length<12)throw new Error('Incomplete six-string position');
 return {
  id:shape.id,label:shape.label,description:shape.description,key:scale.key,
  fretRange:[first,last],rootLandmarks:roots,
  notes,
  maxFretJump:notes.slice(1).reduce((max,n,i)=>Math.max(max,Math.abs(n.fret-notes[i].fret)),0),
  // Shape labels identify where chord-root landmarks lie, not literal major
  // chord grips for altered, diminished or melodic-minor harmony.
  guidance:'Play from low E through high E, ascending on each string. Use one finger per fret where comfortable (0=open, 1=index, 2=middle, 3=ring, 4=pinky). This is a scale POSITION anchored to CAGED roots, not a prescribed major chord shape.'
 };
}
export function allModePositions(scale){
 return CAGED_REGIONS.map(shape=>positionForMode(scale,shape.id));
}
