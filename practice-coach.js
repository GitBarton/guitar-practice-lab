// Functional ii–V–I target-tone studies: real notes, no copyrighted solos.
// Standard tuning is high e, B, G, D, A, low E; pitch checked before rendering.
import {keyPc,noteName} from './music.js';
import {buildTwoFiveOne} from './harmony.js';
const OPEN=[64,59,55,50,45,40];
const VALID=new Set(['coach-thirds','coach-sevenths','coach-roots','coach-fifths','coach-guide','coach-v-third','coach-lower-approach','coach-enclosure','coach-tonic-third']);
function targetAt(pc,anchor=65){
 // Correct pitch class near an ordinary melodic register (C4-C5).
 const candidates=Array.from({length:25},(_,i)=>60+i).filter(n=>n%12===pc);
 return candidates.sort((a,b)=>Math.abs(a-anchor)-Math.abs(b-anchor))[0];
}
function fingerPosition(midi,previous){
 const spots=OPEN.map((open,string)=>({string,fret:midi-open})).filter(p=>p.fret>=0&&p.fret<=22);
 if(!spots.length)throw Error('Pitch unavailable on standard guitar');
 return spots.sort((a,b)=>{
  const score=p=>Math.abs(p.fret-8)*.55+(previous?Math.abs(p.fret-previous.fret)*.75+Math.max(0,p.string-previous.string)*9:0);
  return score(a)-score(b);
 })[0];
}
export function coachTargets(kind,key='C'){
 if(!VALID.has(kind))throw Error('Unsupported coach exercise: '+kind);
 const tonic=keyPc(key);
 if(tonic<0)throw Error('Unsupported key');
 const plan=buildTwoFiveOne(key,'major');
 const roles=plan.chords;
 // Degrees relative to each chord root. ii and V are minor / dominant sevenths.
 const degrees=kind==='coach-thirds'?[3,4,4]:kind==='coach-sevenths'?[10,10,11]:
  kind==='coach-roots'?[0,0,0]:kind==='coach-fifths'?[7,7,7]:null;
 let sequence;
 if(degrees){
  sequence=roles.map((chord,i)=>({pc:(chord.rootPc+degrees[i])%12,chord:chord.label,
   role:chord.role,degree:kind==='coach-thirds'?(i===0?'♭3':'3'):
    kind==='coach-sevenths'?(i===2?'7':'♭7'):kind==='coach-roots'?'1':'5'}));
 }else if(kind==='coach-guide'){
  sequence=[{root:roles[0],offset:3,degree:'♭3'},{root:roles[0],offset:10,degree:'♭7'},
   {root:roles[1],offset:4,degree:'3'},{root:roles[1],offset:10,degree:'♭7'},
   {root:roles[2],offset:4,degree:'3'},{root:roles[2],offset:11,degree:'7'}]
   .map(x=>({pc:(x.root.rootPc+x.offset)%12,chord:x.root.label,role:x.root.role,degree:x.degree}));
 }else{
  const dominantThird=(tonic+11)%12,majorThird=(tonic+4)%12;
  const target={pc:dominantThird,chord:roles[1].label,role:'V',degree:'3'};
  const low={pc:(dominantThird+11)%12,chord:roles[1].label,role:'V',degree:'chromatic lower'};
  const high={pc:(dominantThird+1)%12,chord:roles[1].label,role:'V',degree:'chromatic upper'};
  sequence=kind==='coach-v-third'?[target]:
   kind==='coach-lower-approach'?[low,target]:
   kind==='coach-enclosure'?[high,low,target]:
   [{pc:majorThird,chord:roles[2].label,role:'I',degree:'3'}];
 }
 let previous=null;
 return sequence.map((item,index)=>{
  const midi=targetAt(item.pc,previous?.midi??65),position=fingerPosition(midi,previous);previous={...position,midi};
  return {...position,midi,pc:midi%12,name:noteName(midi),pick:index%2?'U':'D',index,
   interval:item.degree,chord:item.chord,role:item.role};
 });
}
export function coachStageDescription(kind,key='C'){
 const plan=buildTwoFiveOne(key,'major'),V=plan.chords[1].label,I=plan.chords[2].label;
 const notes=coachTargets(kind,key),target=notes.at(-1);
 const narratives={
  'coach-thirds':'Land on each chord third, in ii → V → I order.',
  'coach-sevenths':'Connect each seventh, preserving its actual chord quality.',
  'coach-roots':'Name the root of each changing chord.',
  'coach-fifths':'Connect each fifth; finish on the fifth of the major tonic.',
  'coach-guide':'Sing the third/seventh pairs and target the next chord before playing.',
  'coach-v-third':'Hear the major third of '+V+' before looking at the note.',
  'coach-lower-approach':'Play one semitone BELOW the third of '+V+', then land on the third.',
  'coach-enclosure':'Play upper neighbor → lower neighbor → third of '+V+'; land on a strong beat.',
  'coach-tonic-third':'Resolve the tension onto the major third of '+I+'.'
 };
 return {heading:narratives[kind],targetName:target?.name||'—',notes};
}
