// Original, pitch-checked Barry Harris-inspired major/minor 6-diminished lessons.
// Chord family method: I6 or i6 and ii°7 form disjoint four-tone groups.
// Background: https://jgmusiclessons.com/barry-harris-major-6th-diminished-scale-on-guitar/
// Minor: https://www.jazz-guitar-licks.com/pages/guitar-scales-modes/other-scales/the-minor-sixth-diminished-scale-for-guitar-barry-harris-concept.html
import {KEYS} from './data.js';
import {keyPc,noteName} from './music.js';
import {diatonicSevenths} from './theory-lab.js';
const OPENS=[64,59,55,50,45,40]; // high e, B, G, D, A, low E
const NATURAL={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
export const SIXTH_DIM_FORMULAS=Object.freeze({
 major:Object.freeze([0,2,4,5,7,8,9,11]),
 minor:Object.freeze([0,2,3,5,7,8,9,11])
});
const DEGREE_NAMES={major:['1','2','3','4','5','♭6','6','7'],minor:['1','2','♭3','4','5','♭6','6','7']};
function spellDegree(letter,targetPc){
 const natural=NATURAL[letter[0]];
 let diff=((targetPc-natural+18)%12)-6;
 if(diff<-2||diff>2)throw Error('Cannot spell expected scale degree');
 return letter[0]+({[-2]:'bb',[-1]:'b',0:'',[1]:'#',[2]:'##'}[diff]);
}
export function sixthDiminished(mode='major',key='C'){
 if(!Object.hasOwn(SIXTH_DIM_FORMULAS,mode)||!KEYS.includes(key))throw Error('Unsupported tonic or sixth-diminished quality');
 const degrees=diatonicSevenths(key).map(x=>x.root),pc=keyPc(key);
 const formula=SIXTH_DIM_FORMULAS[mode];
 const nameFor=[degrees[0],degrees[1],mode==='major'?degrees[2]:spellDegree(degrees[2],(pc+3)%12),
  degrees[3],degrees[4],spellDegree(degrees[5],(pc+8)%12),degrees[5],degrees[6]];
 const scale=formula.map((semitones,i)=>({
  semitones,pc:(pc+semitones)%12,degree:DEGREE_NAMES[mode][i],name:nameFor[i]
 }));
 const sixth=[scale[0],scale[2],scale[4],scale[6]];
 const dim=[scale[1],scale[3],scale[5],scale[7]];
 return {key,mode,scale,sixth,dim,
  sixthSymbol:key+(mode==='major'?'6':'m6'),
  diminishedSymbol:degrees[1]+'°7'};
}
function guitarLocation(midi,last){
 const positions=OPENS.map((open,string)=>({string,fret:midi-open}))
  .filter(pos=>pos.fret>=0&&pos.fret<=22);
 if(!positions.length)throw Error('Outside the standard 22-fret guitar');
 return positions.sort((a,b)=>{
  const cost=p=>Math.abs(p.fret-9)*.5+(last?Math.abs(p.fret-last.fret)*.75+Math.max(0,p.string-last.string)*10:0);
  return cost(a)-cost(b);
 })[0];
}
export function sixthDiminishedNotes(kind,key='C'){
 const parsed=/^barry6-(major|minor)-(sixth|diminished|scale|switch)$/.exec(kind||'');
 if(!parsed)throw Error('Unknown sixth-diminished exercise');
 const [,mode,part]=parsed,study=sixthDiminished(mode,key);
 // Two groups are chord arpeggios; the eight-note scale is a separate study.
 const positions=part==='sixth'?[0,mode==='major'?4:3,7,9,12]:
  part==='diminished'?[2,5,8,11,14]:
  part==='switch'?[0,mode==='major'?4:3,7,9,2,5,8,11,12]:
  [...SIXTH_DIM_FORMULAS[mode],12];
 const rootMidi=60+keyPc(key);
 let last=null;
 return positions.map((interval,index)=>{
  const midi=rootMidi+interval,pos=guitarLocation(midi,last);last=pos;
  const scaleTone=study.scale.find(x=>x.semitones===interval%12);
  return {...pos,midi,index,pc:midi%12,
   name:scaleTone?scaleTone.name+(Math.floor(midi/12)-1):noteName(midi),
   interval:scaleTone?.degree||'1',pick:index%2?'U':'D',
   chord:part==='diminished'?study.diminishedSymbol:part==='sixth'?study.sixthSymbol:
     part==='switch'&&index>=4&&index<=7?study.diminishedSymbol:study.sixthSymbol};
 });
}
