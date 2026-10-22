// Functional ii–V–I target-tone studies: real notes, no copyrighted solos.
// Standard tuning is high e, B, G, D, A, low E; pitch checked before rendering.
import {keyPc,noteName} from './music.js';
import {buildTwoFiveOne} from './harmony.js';
const OPEN=[64,59,55,50,45,40];
const VALID=new Set(['coach-thirds','coach-sevenths','coach-roots','coach-seconds','coach-fifths','coach-guide','coach-v-third','coach-lower-approach','coach-enclosure','coach-tonic-third']);
function targetAt(pc,anchor=65){
 // Correct pitch class near an ordinary melodic register (C4-C5).
 const candidates=Array.from({length:25},(_,i)=>60+i).filter(n=>n%12===pc);
 return candidates.sort((a,b)=>Math.abs(a-anchor)-Math.abs(b-anchor))[0];
}
function fingerPosition(midi,previous,fretAnchor=8){
 const spots=OPEN.map((open,string)=>({string,fret:midi-open})).filter(p=>p.fret>=0&&p.fret<=22);
 if(!spots.length)throw Error('Pitch unavailable on standard guitar');
 return spots.sort((a,b)=>{
  const score=p=>Math.abs(p.fret-fretAnchor)*.55+(previous?Math.abs(p.fret-previous.fret)*.75+Math.max(0,p.string-previous.string)*9:0);
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
  kind==='coach-roots'?[0,0,0]:kind==='coach-seconds'?[2,2,2]:kind==='coach-fifths'?[7,7,7]:null;
 let sequence;
 if(degrees){
  sequence=roles.map((chord,i)=>({pc:(chord.rootPc+degrees[i])%12,chord:chord.label,
   role:chord.role,degree:kind==='coach-thirds'?(i===0?'♭3':'3'):
    kind==='coach-sevenths'?(i===2?'7':'♭7'):kind==='coach-roots'?'1':kind==='coach-seconds'?'2 / 9':'5'}));
 }else if(kind==='coach-guide'){
  sequence=[{root:roles[0],offset:3,degree:'♭3'},{root:roles[0],offset:10,degree:'♭7'},
   {root:roles[1],offset:4,degree:'3'},{root:roles[1],offset:10,degree:'♭7'},
   {root:roles[2],offset:4,degree:'3'},{root:roles[2],offset:11,degree:'7'}]
   .map(x=>({pc:(x.root.rootPc+x.offset)%12,chord:x.root.label,role:x.root.role,degree:x.degree}));
 }else{
  const dominantThird=(tonic+11)%12,majorThird=(tonic+4)%12;
  const dominantMidi=targetAt(dominantThird,70);
  const target={pc:dominantThird,midiHint:dominantMidi,chord:roles[1].label,role:'V',degree:'3'};
  const low={pc:(dominantThird+11)%12,midiHint:dominantMidi-1,chord:roles[1].label,role:'V',degree:'chromatic lower'};
  const high={pc:(dominantThird+1)%12,midiHint:dominantMidi+1,chord:roles[1].label,role:'V',degree:'chromatic upper'};
  sequence=kind==='coach-v-third'?[target]:
   kind==='coach-lower-approach'?[low,target]:
   kind==='coach-enclosure'?[high,low,target]:
   [{pc:majorThird,chord:roles[2].label,role:'I',degree:'3'}];
 }
 let previous=null;
 return sequence.map((item,index)=>{
  const midi=item.midiHint??targetAt(item.pc,previous?.midi??65),position=fingerPosition(midi,previous);previous={...position,midi};
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
  'coach-seconds':'Hear degree 2 (the ninth) above each chord root as a melodic extension.',
  'coach-fifths':'Connect each fifth; finish on the fifth of the major tonic.',
  'coach-guide':'Sing the third/seventh pairs and target the next chord before playing.',
  'coach-v-third':'Hear the major third of '+V+' before looking at the note.',
  'coach-lower-approach':'Play one semitone BELOW the third of '+V+', then land on the third.',
  'coach-enclosure':'Play upper neighbor → lower neighbor → third of '+V+'; land on a strong beat.',
  'coach-tonic-third':'Resolve the tension onto the major third of '+I+'.'
 };
 return {heading:narratives[kind],targetName:target?.name||'—',notes};
}

// Dedicated-zone lessons share the backing engine's current chord; no second transport.
export const HARMONY_LESSON_FOCI=Object.freeze([
 {id:'roots',label:'Hear and play roots'},
 {id:'guide',label:'Connect guide tones'},
 {id:'arpeggio',label:'Navigate chord arpeggios'},
 {id:'enclosure',label:'Enclose V, resolve to tonic'},
 {id:'phrase',label:'Question and answer'}
]);
export function harmonyLesson({key='C',mode='major',focus='roots',chordIndex=0,position='low',challenge=0}={}){
 if(!HARMONY_LESSON_FOCI.some(f=>f.id===focus))throw Error('Choose a lesson focus.');
 if(!Number.isInteger(chordIndex)||chordIndex<0||chordIndex>2)throw Error('Choose ii, V or tonic.');
 if(!['low','mid'].includes(position))throw Error('Choose a guitar register.');
 const plan=buildTwoFiveOne(key,mode),chord=plan.chords[chordIndex];
 const variation=Number.isInteger(challenge)?((challenge%4)+4)%4:0;
 const degrees=chord.degrees.map(n=>({0:'1',3:'♭3',4:'3',6:'♭5',7:'5',9:'6',10:'♭7',11:'7',13:'♭9'})[n]);
 const member=i=>({pc:chord.midi[i]%12,interval:degrees[i],spelling:chord.noteNames?.[i]});
 let sequence,cue;
 if(focus==='roots'){
  sequence=[member(0)];cue='Hear '+chord.label+', sing its root, then play one clear note on the change.';
 }else if(focus==='guide'){
  sequence=[member(1),member(3)];
  cue=chord.quality==='min6'?'Minor-six tonic: connect ♭3 and 6. This chord has no seventh.':'Connect the third and seventh; hear their motion into the next chord.';
 }else if(focus==='arpeggio'){
  sequence=chord.midi.map((_,i)=>member(i));cue='Name each degree, then play the chord tones with small, comfortable position changes.';
 }else if(focus==='enclosure'){
  const target=member(1);
  sequence=chordIndex===1?[{pc:(target.pc+1)%12,interval:'upper neighbor'},{pc:(target.pc+11)%12,interval:'lower neighbor'},target]:[target];
  cue=chordIndex===1?'Upper neighbor → lower neighbor → V third. Put the final target on a strong beat.':chordIndex===2?'Resolve the dominant enclosure to the '+(mode==='minor'?'minor':'major')+' third of tonic.':'Hear ii and locate its third; prepare the enclosure for V.';
 }else{
  sequence=[member(0),member(1),member(2)];
  cue=chordIndex===2?'Answer: finish a short phrase on the tonic third; leave space.':'Question: use the shown chord tones in a two-bar idea; leave space for a tonic answer.';
 }
 if(variation%2&&focus!=='enclosure')sequence=sequence.slice().reverse();
 const anchor=(position==='mid'?72:62)+(variation%2?12:0)+(variation>=2?5:0);let previous=null;
 const notes=sequence.map((item,index)=>{
  const midi=targetAt(item.pc,previous?.midi??anchor),spot=fingerPosition(midi,previous,position==='mid'?12:5);
  previous={...spot,midi};let name=noteName(midi);
  if(item.spelling){
   const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
   const absolute=natural[item.spelling[0]]+[...item.spelling.slice(1)].reduce((n,a)=>n+(a==='#'?1:-1),0);
   name=item.spelling+((midi-absolute)/12-1);
  }
  return {...spot,midi,pc:midi%12,name,interval:item.interval,chord:chord.label,index,pick:index%2?'U':'D'};
 });
 return {key,mode,focus,chordIndex,chord,nextChord:plan.chords[(chordIndex+1)%3],notes,cue,position,variation,
  targetSummary:notes.map(n=>n.name+' ('+n.interval+')').join(' → ')};
}
