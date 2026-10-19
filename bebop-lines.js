// Original dominant-bebop eighth-note line, not a published transcription.
// Descending V7 root, passing major seventh, chord flat seventh, sixth,
// fifth, fourth, third, second, root. Starting on a downbeat gives G7
// chord tones (1, b7, 5, 3, 1) on successive strong beats.
import {keyPc,noteName} from './music.js';
import {KEYS} from './data.js';
const OPEN=[64,59,55,50,45,40];
export const BEBOP_DESCENDING_OFFSETS=Object.freeze([0,-1,-2,-3,-5,-7,-8,-10,-12]);
const ROLES=Object.freeze(['1','7 (passing)','♭7','6','5','4','3','2','1']);
function place(midi,previous){
 const spots=OPEN.map((open,string)=>({string,fret:midi-open})).filter(x=>x.fret>=0&&x.fret<=22);
 if(!spots.length)throw Error('Unplayable note');
 return spots.sort((a,b)=>(Math.abs(a.fret-(previous?.fret??8))+.4*Math.abs(a.string-(previous?.string??2)))-(Math.abs(b.fret-(previous?.fret??8))+.4*Math.abs(b.string-(previous?.string??2))))[0];
}
export function dominantBebopDescending(key='C'){
 if(!KEYS.includes(key))throw Error('Invalid major tonal center');
 const dominantPc=(keyPc(key)+7)%12,topMidi=72+dominantPc;
 let previous=null;
 const notes=BEBOP_DESCENDING_OFFSETS.map((offset,index)=>{
  const midi=topMidi+offset,spot=place(midi,previous);previous=spot;
  return {...spot,midi,pc:midi%12,name:noteName(midi),interval:ROLES[index],
   chord:index%2===0?'V7 chord tone':'passing or diatonic scale tone',
   beat:index/2+1,index,pick:index%2?'U':'D'};
 });
 return {key,dominantPc,notes,description:'Downbeat start: indices 0,2,4,6,8 are V7 chord tones. An upbeat start changes that alignment.'};
}
