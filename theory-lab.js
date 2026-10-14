// Reference-checked jazz chord-scale formulae, separate from physical guitar shapes.
// Berklee: https://online.berklee.edu/takenote/jazz-improvisation-10-scales/
// Berklee: https://online.berklee.edu/takenote/voice-leading-for-guitar/
import {keyPc,noteName} from './music.js';
import {KEYS} from './data.js';
export const MODE_FAMILIES=[
 {id:'major',title:'Major scale modes'},
 {id:'melodic',title:'Jazz melodic minor modes'},
 {id:'minor',title:'Minor, harmonic minor and diminished'}
];
export const MODE_DEFINITIONS=[
 ['ionian','major','Ionian (major)',[0,2,4,5,7,9,11],'maj7','Stable major tonic'],
 ['dorian','major','Dorian',[0,2,3,5,7,9,10],'m7','Minor sound with natural 6'],
 ['phrygian','major','Phrygian',[0,1,3,5,7,8,10],'m7','Minor sound with flat 2'],
 ['lydian','major','Lydian',[0,2,4,6,7,9,11],'maj7♯11','Major sound with sharp 4'],
 ['mixolydian','major','Mixolydian',[0,2,4,5,7,9,10],'7','Dominant 7 with natural tensions'],
 ['aeolian','major','Aeolian (natural minor)',[0,2,3,5,7,8,10],'m7','Natural minor with flat 6'],
 ['locrian','major','Locrian',[0,1,3,5,6,8,10],'m7♭5','Half-diminished chord scale'],
 ['melodic-minor','melodic','Jazz melodic minor',[0,2,3,5,7,9,11],'m(maj7)','Natural 6 and 7 in both directions'],
 ['dorian-flat2','melodic','Dorian ♭2',[0,1,3,5,7,9,10],'m7♭9','Dorian with flat 2'],
 ['lydian-augmented','melodic','Lydian augmented',[0,2,4,6,8,9,11],'maj7♯5','Major seventh with raised fourth and fifth'],
 ['lydian-dominant','melodic','Lydian dominant',[0,2,4,6,7,9,10],'7♯11','Dominant with ♯11, natural 13'],
 ['mixolydian-flat6','melodic','Mixolydian ♭6',[0,2,4,5,7,8,10],'7♭13','Dominant with minor sixth'],
 ['locrian-natural2','melodic','Locrian natural 2',[0,2,3,5,6,8,10],'m7♭5','Half-diminished with natural ninth'],
 ['altered','melodic','Altered (super-Locrian)',[0,1,3,4,6,8,10],'7alt','1 ♭9 ♯9 3 ♭5/♯11 ♭13 ♭7'],
 ['harmonic-minor','minor','Harmonic minor',[0,2,3,5,7,8,11],'m(maj7)','Minor scale with major seventh'],
 ['diminished-hw','minor','Half–whole diminished',[0,1,3,4,6,7,9,10],'7♭9','Dominant diminished; H–W alternating'],
 ['diminished-wh','minor','Whole–half diminished',[0,2,3,5,6,8,9,11],'°7','Fully diminished; W–H alternating']
].map(([id,family,title,intervals,chord,use])=>Object.freeze({id,family,title,intervals:Object.freeze(intervals),chord,use}));
export const DIATONIC_QUALITY=['maj7','m7','m7','maj7','7','m7','m7♭5'];
const DIATONIC_ROLE=['I','ii','iii','IV','V','vi','viiø'];
const KEY_NAMES={
 C:['C','D','E','F','G','A','B'],
 F:['F','G','A','Bb','C','D','E'],
 Bb:['Bb','C','D','Eb','F','G','A'],
 Eb:['Eb','F','G','Ab','Bb','C','D'],
 Ab:['Ab','Bb','C','Db','Eb','F','G'],
 Db:['Db','Eb','F','Gb','Ab','Bb','C'],
 Gb:['Gb','Ab','Bb','Cb','Db','Eb','F'],
 B:['B','C#','D#','E','F#','G#','A#'],
 E:['E','F#','G#','A','B','C#','D#'],
 A:['A','B','C#','D','E','F#','G#'],
 D:['D','E','F#','G','A','B','C#'],
 G:['G','A','B','C','D','E','F#']
};
export function scaleFor(id,key='C'){
 const def=MODE_DEFINITIONS.find(d=>d.id===id);
 if(!def||!KEYS.includes(key))throw Error('Unsupported musical mode or key');
 const tonic=keyPc(key);
 return {...def,key,pitchClasses:def.intervals.map(semitones=>(tonic+semitones)%12)};
}
export function diatonicSevenths(key='C'){
 if(!KEYS.includes(key))throw Error('Unsupported tonal center');
 const names=KEY_NAMES[key],major=[0,2,4,5,7,9,11],pc=keyPc(key);
 return names.map((name,i)=>({
  role:DIATONIC_ROLE[i],root:name,rootPc:(pc+major[i])%12,
  quality:DIATONIC_QUALITY[i],symbol:name+DIATONIC_QUALITY[i],
  // 1,3,5,7 by diatonic degree -- no guessed chord extensions.
  pitchClasses:[i,i+2,i+4,i+6].map(j=>(pc+major[j%7]+12*Math.floor(j/7))%12)
 }));
}
// These are accurately pitched one-octave NOTE LOCATIONS, not published fingerings.
// Exact physical finger routes will be separately audited against textbook shapes.
const OPENS=[64,59,55,50,45,40];
export function scaleTabTargets(scale){
 if(!scale?.pitchClasses?.length) return [];
 const root=keyPc(scale.key);
 const rootMidi=48+root; // C3–B3 keeps notes in standard, accessible guitar range.
 let previous=null;
 return [...scale.intervals,12].map((interval,i)=>{
  const midi=rootMidi+interval;
  const choices=OPENS.map((open,string)=>({string,fret:midi-open,midi}))
   .filter(p=>p.fret>=0&&p.fret<=22);
  if(!choices.length)throw Error('Scale note not playable on a 22-fret guitar');
  const best=choices.sort((a,b)=>{
   const score=p=>Math.abs(p.fret-6)*.45+(previous?Math.abs(p.fret-previous.fret)*.7+Math.max(0,p.string-previous.string)*15:0);
   return score(a)-score(b);
  })[0];
  previous=best;
  return {...best,pc:midi%12,name:noteName(midi),index:i,
   interval:i===scale.intervals.length?'1 (octave)':String(i+1),pick:i%2?'U':'D'};
 });
}
