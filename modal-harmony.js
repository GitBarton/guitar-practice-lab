// Theory-first modal seventh-chord stacks. No false "C major diatonic" fallback.
// One-based scale-degree stacking applies to seven distinct diatonic spellings;
// altered and octatonic diminished sets show actual chord-tone functions instead.
import {keyPc} from './music.js';

const LETTERS=['C','D','E','F','G','A','B'];
const NATURAL=[0,2,4,5,7,9,11];
const INTERVAL_QUALITY=new Map([
 ['0,4,7,11','maj7'],['0,4,7,10','7'],
 ['0,3,7,10','m7'],['0,3,7,11','m(maj7)'],
 ['0,3,6,10','m7♭5'],['0,3,6,9','°7'],
 ['0,4,8,11','maj7♯5'],['0,4,8,10','7♯5'],
 ['0,4,6,10','7♭5'],['0,4,6,11','maj7♭5'],
 ['0,3,8,10','m7♯5'],['0,3,8,11','m(maj7)♯5'],
 ['0,4,6,9','7♭5(bb7)']
]);
const roleLabels=['I','II','III','IV','V','VI','VII'];
export function spellScaleDegrees(scale){
 if(scale.intervals.length!==7||scale.id==='altered')
  throw new Error('Seven conventional diatonic spellings required');
 const match=/^([A-G])([b#]{0,2})$/.exec(scale.key);
 if(!match)throw new Error('Unsupported tonic note');
 const start=LETTERS.indexOf(match[1]),root=keyPc(scale.key);
 return scale.intervals.map((semitones,index)=>{
  const letterIndex=(start+index)%7,natural=NATURAL[letterIndex],pc=(root+semitones)%12;
  let diff=((pc-natural+18)%12)-6;
  if(diff<-2||diff>2)throw Error('Modal spelling requires an unsupported triple accidental');
  return LETTERS[letterIndex]+(diff>0?'#'.repeat(diff):diff<0?'b'.repeat(-diff):'');
 });
}
function stackedIntervals(scale,degree){
 const n=scale.intervals.length,base=scale.intervals[degree];
 return [0,2,4,6].map(step=>{
  const index=degree+step;
  return scale.intervals[index%n]+Math.floor(index/n)*12-base;
 });
}
function uniquePitchClasses(root,steps){return steps.map(step=>(root+step)%12);}
function specialHarmony(scale){
 const root=keyPc(scale.key);
 if(scale.id==='altered'){
  return {
   kind:'characteristic',title:'Dominant altered harmony · '+scale.key+'7alt',
   description:'Altered has enharmonic tension spellings and cannot be honestly displayed as seven simple conventional diatonic 7th chords. Practice its dominant chord tones and available altered tensions.',
   chords:[
    {role:'Dominant anchor',root:scale.key,symbol:scale.key+'7alt',quality:'1 · 3 · ♭7',intervals:[0,4,10],pitchClasses:uniquePitchClasses(root,[0,4,10])},
    {role:'Altered ninths',root:scale.key,symbol:'♭9 / ♯9',quality:'Two altered ninth colors',intervals:[1,3],pitchClasses:uniquePitchClasses(root,[1,3])},
    {role:'Altered fifths',root:scale.key,symbol:'♭5 / ♯11 · ♭13',quality:'Two altered fifth/sixth colors',intervals:[6,8],pitchClasses:uniquePitchClasses(root,[6,8])}
   ]
  };
 }
 if(scale.id==='diminished-hw'){
  return {kind:'characteristic',title:'Half–whole diminished harmony · '+scale.key,
   description:'Eight-note symmetric scale: common dominant-7♭9 anchor and diminished seventh cluster. These are not seven diatonic modes.',
   chords:[
    {role:'Dominant anchor',root:scale.key,symbol:scale.key+'7♭9',quality:'1 · 3 · 5 · ♭7 · ♭9',intervals:[0,4,7,10,1],pitchClasses:uniquePitchClasses(root,[0,4,7,10,1])},
    {role:'Diminished colors',root:scale.key,symbol:scale.key+'°7',quality:'1 · ♭3 · ♭5 · 𝄫7',intervals:[0,3,6,9],pitchClasses:uniquePitchClasses(root,[0,3,6,9])}
   ]};
 }
 if(scale.id==='diminished-wh'){
  return {kind:'characteristic',title:'Whole–half diminished harmony · '+scale.key,
   description:'Eight-note symmetric scale: the fully diminished seventh is the stable reference chord. The seventh-chord cycle of a seven-note scale does not apply.',
   chords:[
    {role:'Diminished anchor',root:scale.key,symbol:scale.key+'°7',quality:'1 · ♭3 · ♭5 · 𝄫7',intervals:[0,3,6,9],pitchClasses:uniquePitchClasses(root,[0,3,6,9])},
    {role:'Whole–half motion',root:scale.key,symbol:'2 · 4 · ♭6 · 7',quality:'Characteristic neighboring tones',intervals:[2,5,8,11],pitchClasses:uniquePitchClasses(root,[2,5,8,11])}
   ]};
 }
 throw Error('Unknown special harmonic family');
}
export function harmonizeSelectedMode(scale){
 if(!scale?.intervals||!scale?.key||!scale?.id)throw Error('Invalid mode');
 if(scale.id==='altered'||scale.id==='diminished-hw'||scale.id==='diminished-wh')
  return specialHarmony(scale);
 if(scale.intervals.length!==7)throw Error('Expected seven scale tones for diatonic harmonization');
 const roots=spellScaleDegrees(scale),rootPc=keyPc(scale.key);
 const chords=scale.intervals.map((interval,degree)=>{
  const tones=stackedIntervals(scale,degree),suffix=INTERVAL_QUALITY.get(tones.join(','));
  const quality=suffix||'unclassified tertian stack';
  const tonic=roots[degree],symbol=suffix?tonic+suffix:tonic+' (notes 1–3–5–7)';
  return {role:roleLabels[degree],degree:scale.degrees[degree],
   root:tonic,symbol,quality,intervals:tones,
   pitchClasses:uniquePitchClasses((rootPc+interval)%12,tones),
   ...(suffix?{}:{warning:'No conventional chord shorthand; inspect the four-note intervals.'})};
 });
 return {kind:'diatonic',title:'Seventh chords of '+scale.key+' '+scale.title,
  description:'Stack alternate notes (1–3–5–7) of the SELECTED seven-note mode. Labels, qualities and guide tones change with your scale choice—not the major-scale default.',chords};
}
