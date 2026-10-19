// Pure modal-improvisation note targets for standard-tuned guitar.
import {scaleFor} from './theory-lab.js';
import {keyPc,noteName} from './music.js';
const OPEN=[64,59,55,50,45,40];
export const MODAL_CHALLENGES=Object.freeze([
 {id:'ionian',label:'Imaj7',targets:[4,11]},
 {id:'dorian',label:'i m7 / ii m7',targets:[3,10]},
 {id:'lydian-dominant',label:'7♯11',targets:[4,6,10]},
 {id:'mixolydian-flat6',label:'7♭13',targets:[4,8,10]},
 {id:'altered',label:'7alt',targets:[4,1,3,10]},
 {id:'harmonic-minor',label:'i m(maj7)',targets:[3,11]}
]);
function location(midi,prev){
 const options=OPEN.map((pitch,string)=>({string,fret:midi-pitch})).filter(x=>x.fret>=0&&x.fret<=22);
 if(!options.length)throw Error('Target pitch unavailable on standard guitar');
 return options.sort((a,b)=>(Math.abs(a.fret-(prev?.fret??8))+.4*Math.abs(a.string-(prev?.string??3)))-(Math.abs(b.fret-(prev?.fret??8))+.4*Math.abs(b.string-(prev?.string??3))))[0];
}
export function modalChallenge(id,key='C'){
 const item=MODAL_CHALLENGES.find(c=>c.id===id);
 if(!item)throw Error('Unknown modal challenge');
 const mode=scaleFor(id,key),root=keyPc(key);
 for(const interval of item.targets)if(!mode.intervals.includes(interval))throw Error('Target outside selected mode');
 let last=null;
 const notes=item.targets.map((interval,index)=>{
  const midi=60+root+interval;
  const pos=location(midi,last);last=pos;
  return {...pos,midi,name:noteName(midi),pc:midi%12,interval:mode.degrees[mode.intervals.indexOf(interval)],index,pick:index%2?'U':'D'};
 });
 return {key,id,chord:item.label,mode:mode.title,notes};
}
