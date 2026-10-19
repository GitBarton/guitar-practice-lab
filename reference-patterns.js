// Verified movable guitar positions from standard-tuning reference patterns.
// Pentatonic five-box convention: Sweetwater InSync and JustinGuitar lessons.
// Dominant 7th: interval-verified compact E/A-root arpeggio routes, NOT copied tabs.
import {keyPc,noteName} from './music.js';
import {KEYS} from './data.js';
const OPENS=[64,59,55,50,45,40]; // e B G D A E, 22-fret standard tuning
const A_MINOR_BOXES=[
 [[5,8],[5,8],[5,7],[5,7],[5,7],[5,8]],
 [[8,10],[8,10],[7,9],[7,10],[7,10],[8,10]],
 [[10,12],[10,13],[9,12],[10,12],[10,12],[10,12]],
 [[12,15],[13,15],[12,14],[12,14],[12,15],[12,15]],
 [[15,17],[15,17],[14,17],[14,17],[15,17],[15,17]]
]; // high e, B, G, D, A, low E
export const SCALE_BOXES=[1,2,3,4,5];
function noteAt(string,fret,rootPc,quality,index){
 if(!Number.isInteger(fret)||fret<0||fret>22)throw Error('Fret out of guitar range');
 const midi=OPENS[string]+fret,interval=((midi%12)-rootPc+12)%12;
 const scale=quality==='pentMajor'?[0,2,4,7,9]:[0,3,5,7,10];
 if(!scale.includes(interval))throw Error('Reference box contains note outside pentatonic scale');
 const labels=quality==='pentMajor'?['1','2','3','5','6']:['1','♭3','4','5','♭7'];
 return {midi,name:noteName(midi),pc:midi%12,string,fret,index,
  interval:labels[scale.indexOf(interval)],pick:index%2?'U':'D'};
}
export function referencePentatonicBox(key='A',quality='pentMinor',box=1){
 if(!KEYS.includes(key)||!['pentMajor','pentMinor'].includes(quality)||!SCALE_BOXES.includes(box))throw Error('Unsupported scale, key or box');
 const rootPc=keyPc(key);
 // Major pentatonic shares the same note pool as relative minor: e.g. C major / A minor.
 const relativeMinorPc=(rootPc+(quality==='pentMajor'?9:0))%12;
 const lowERootFret=(relativeMinorPc-4+12)%12;
 let shift=lowERootFret-5;
 const original=A_MINOR_BOXES[box-1];
 if(original.some(row=>row.some(f=>f+shift>22)))shift-=12;
 if(original.some(row=>row.some(f=>f+shift<0)))shift+=12;
 if(original.some(row=>row.some(f=>f+shift<0||f+shift>22)))throw Error('Box unavailable in the 0–22 fret range');
 const notes=[];
 for(let string=5;string>=0;string--){
  for(const fret of original[string]){
   const note=noteAt(string,fret+shift,rootPc,quality,notes.length);
   // Fingering is only stated for the standard two-notes-per-string root box.
   if(box===1){
    const base=5+shift,offset=note.fret-base;
    if([0,2,3].includes(offset))note.finger={0:1,2:3,3:4}[offset];
   }
   notes.push(note);
  }
 }
 // Preserve a predictable ascending route, then retrace it descending.
 // Each note remains an actual fretted location verified by noteAt.
 const ascending=notes.slice().sort((a,b)=>a.midi-b.midi||a.string-b.string);
 const descending=ascending.slice().reverse();
 return {key,quality,box,notes,ascending,descending,
  fretRange:[Math.min(...notes.map(n=>n.fret)),Math.max(...notes.map(n=>n.fret))],
  caption:box===1?'Root-box study: ascend from the lowest pitch and retrace the same notes down; finger numbers are suggested where practical.':'Pentatonic position study: ascend in pitch across adjacent strings, reverse descending, and avoid large fretting-hand jumps.'};
}
export function referencePentatonicSkip(key='A',quality='pentMinor',box=1){
 const source=referencePentatonicBox(key,quality,box);
 // String skipping uses A and G, leaving the D string silent; not a scale run.
 const a=source.notes.filter(n=>n.string===4),g=source.notes.filter(n=>n.string===2);
 const notes=[a[0],g[0],a[1],g[1]].map((n,index)=>({...n,index,pick:index%2?'U':'D'}));
 return {...source,notes,caption:'String-skip variant from a verified pentatonic box. Jump A→G while keeping the D string silent.'};
}
const DOM_E=[[5,0],[4,-1],[4,2],[3,0],[3,2],[2,1],[2,4],[1,3],[1,5]];
const DOM_A=[[4,0],[3,-1],[3,2],[2,0],[2,2],[1,2],[0,0],[0,3],[0,5]];
export function referenceDominant7(key='G',rootString='E'){
 if(!KEYS.includes(key)||!['E','A'].includes(rootString))throw Error('Unsupported dominant route');
 const rootPc=keyPc(key),string=rootString==='E'?5:4;
 let fret=(rootPc-(OPENS[string]%12)+12)%12;
 if(fret===0)fret=12; // The major third cannot be placed at fret -1.
 const pattern=rootString==='E'?DOM_E:DOM_A;
 const intervals=[0,4,7,10,12,16,19,22,24];
 const midiRoot=OPENS[string]+fret;
 const notes=pattern.map(([st,offset],i)=>{
  const posFret=fret+offset,expected=midiRoot+intervals[i],midi=OPENS[st]+posFret;
  if(posFret<0||posFret>22||midi!==expected)throw Error('Dominant route fails standard-tuning note validation');
  return {midi,name:noteName(midi),pc:midi%12,string:st,fret:posFret,
   interval:['1','3','5','♭7','1','3','5','♭7','1'][i],
   pick:i%2?'U':'D',index:i};
 });
 return {key,quality:'7',rootString,notes,
  fretRange:[Math.min(...notes.map(n=>n.fret)),Math.max(...notes.map(n=>n.fret))],
  caption:'Two octaves, ascending root–3–5–♭7 with planned string changes. A 6-fret total window may require a position shift; do not stretch.'};
}
