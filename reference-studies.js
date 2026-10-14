// Original, pitch-verified jazz studies inspired by conventional method-book ideas.
// Three note sequences; chord-label/rhythm choices are explained in drill instructions.
import {keyPc,noteName} from './music.js';
const OPENS=[64,59,55,50,45,40];
const DEFINITIONS={
 'study-chromatic-target':{c:[60,58,59,64],roles:['Upper neighbor','Lower neighbor','V7 third','I major third']},
 'study-guide-tones':{c:[53,60,59,65,64,59],roles:['ii minor third','ii minor seventh','V major third','V minor seventh','I major third','I major seventh']},
 'study-tritone-sub':{c:[53,60,53,59,64,59],roles:['ii minor third','ii minor seventh','subV major third','subV minor seventh','I major third','I major seventh']}
};
export const REFERENCE_STUDY_IDS=Object.freeze(Object.keys(DEFINITIONS));
export function referenceStudyNotes(id,key='C'){
 const study=DEFINITIONS[id];if(!study) return null;
 const tonic=keyPc(key);if(!Number.isInteger(tonic)||tonic<0)throw new Error('Unknown tonic');
 // C-root templates transposed by pitch class; route stays within standard guitar range.
 const trans=tonic===0?0:tonic>6?tonic-12:tonic;
 return study.c.map((base,index)=>{
  const midi=base+trans,options=OPENS.map((open,string)=>({string,fret:midi-open})).filter(p=>p.fret>=0&&p.fret<=22);
  if(!options.length)throw new RangeError('Unplayable study note');
  const chosen=options.sort((a,b)=>Math.abs(a.fret-7)-Math.abs(b.fret-7))[0];
  return {...chosen,midi,name:noteName(midi),pc:midi%12,index,beat:index,pick:index%2?'U':'D',interval:study.roles[index]};
 });
}
export function studyPitchClasses(id,key='C'){return referenceStudyNotes(id,key)?.map(n=>n.pc)||[];}
