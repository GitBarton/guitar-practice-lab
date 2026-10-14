// ORIGINAL exercises: pedagogical concepts associated with named guitarists.
// These are NOT transcriptions or claims to reproduce any copyrighted solo.
// Guitar theory notes are grounded in musician interviews / published lessons.
import {KEYS} from './data.js';
import {keyPc,noteName} from './music.js';
export const ARTIST_PROFILES=[
 {id:'montgomery',name:'Wes Montgomery',theme:'Octaves, melodic chord-tone lines',
  source:'https://www.premierguitar.com/wes-montgomery-octaves',
  provenance:'Octave pairing and thumb-style phrasing are discussed in this published lesson.'},
 {id:'metheny',name:'Pat Metheny',theme:'Long melodic development and narrative phrasing',
  source:'https://www.patmetheny.com/qa/questionView.cfm?queID=233',
  provenance:'Metheny describes developing an idea through repetition, accents, transformation and reduction.'},
 {id:'stern',name:'Mike Stern',theme:'Chromatic-target bebop and modern fusion phrases',
  source:'https://online.berklee.edu/courses/jazz-guitar-101',
  provenance:'Berklee teaches chord-tone targets and jazz approaches, citing Mike Stern among performance examples; this is an original teaching phrase.'},
 {id:'scofield',name:'John Scofield',theme:'Blues-inflected phrasing, sideslipping and double-stops',
  source:'https://www.premierguitar.com/lessons/jazz/john-scofield-guitar-lesson',
  provenance:'Published instruction discusses blues lines, double-stops and chromatic sideslipping.'}
];
export const VOCAB_STUDIES=[
 {id:'wes-octave',artist:'montgomery',title:'Octave blues question',type:'octave',
  offsets:[0,2,3,5],focus:'Strike the octave as one event, muting the middle string.',
  instructions:['Play a four-note rising question on A and G strings, using both notes at once.','Do not play the skipped D string; make all four octave pairs even.','Answer the phrase with your own four-note octave line.']},
 {id:'wes-thirds',artist:'montgomery',title:'Chord-tone phrase into a gentle ending',type:'line',
  offsets:[0,4,7,11,7,4,0],focus:'Phrase 1–3–5–7 before returning to a stable tonic.',
  instructions:['Play the original chord-tone cell as an unhurried melody.','Repeat at half-speed, emphasizing the final root.','Do not confuse this teaching etude with a transcribed Wes Montgomery lick.']},
 {id:'metheny-motif',artist:'metheny',title:'Develop one melodic idea',type:'line',
  offsets:[0,4,7,4,2,0,2,4],focus:'Develop the same small motif through different accents.',
  instructions:['Play the original eight-note melodic cell, then sing it.','Use the same pitch order but move the rhythmic emphasis to another beat.','Remove two notes and create an answer with the remaining material.']},
 {id:'metheny-intervals',artist:'metheny',title:'Lyrical leap and melodic response',type:'line',
  offsets:[0,7,9,7,4,2,0],focus:'Use one wider leap followed by a smaller descending answer.',
  instructions:['Do not rush the first leap. Hear the fifth before playing it.','Let the top note ring and answer with the descending notes.','Shift the phrasing or dynamics without randomly changing all the pitches.']},
 {id:'stern-target',artist:'stern',title:'Chromatic approach to V7 third',type:'line',
  offsets:[10,11,14,12],focus:'Bb–B over G7, resolving to C in the key of C.',
  instructions:['In C, place Bb on a weaker subdivision before landing B on a strong beat over G7.','Use D as another G7 chord tone, then resolve to the tonic C.','Transpose the functional target relative to the selected key.']},
 {id:'stern-sequence',artist:'stern',title:'Dominant guide-tone answer',type:'line',
  offsets:[5,7,10,11,12],focus:'Connect V7 guide tones with a melodic tonic resolution.',
  instructions:['Treat the two first notes as a pickup into dominant color.','Hear the V7 flat-seventh and third before the tonic root.','Turn this into a two-bar call-and-response rather than a fixed fast lick.']},
 {id:'scofield-side',artist:'scofield',title:'Blues side-step and homecoming',type:'line',
  offsets:[0,3,5,6,7,6,5,3,0],focus:'Step outside briefly by one semitone, then resolve.',
  instructions:['Play a blues-rooted cell and deliberately touch the chromatic outside tone.','Return to a stable chord tone rather than prolonging the outside phrase.','Accent an offbeat and imitate a blues vocalist, not a machine-gun scale.']},
 {id:'scofield-double',artist:'scofield',title:'Blues double-stop call-and-response',type:'minor-third-dyads',
  offsets:[0,5,7,0],focus:'Four simple minor-third dyads and intentional silence.',
  instructions:['Play each two-note grip at the same time; the TAB is vertically aligned.','Leave silence between attacks and vary strong/weak beat placement.','Change the accents and answer with one original single-note phrase.']}
];
const OPEN=[64,59,55,50,45,40];
function locate(midi,previous){
 const options=OPEN.map((open,string)=>({string,fret:midi-open,midi})).filter(n=>n.fret>=0&&n.fret<=22);
 if(!options.length)throw Error('Note outside the standard-tuning fretboard');
 return options.sort((a,b)=>{
  const score=p=>Math.abs(p.fret-7)*.4+(previous?(Math.abs(p.fret-previous.fret)*.85+(p.string>previous.string?11:0)):0);
  return score(a)-score(b);
 })[0];
}
export function vocabularyNotes(id,key='C'){
 if(!KEYS.includes(key))throw Error('Unsupported practice key');
 const study=VOCAB_STUDIES.find(s=>s.id===id);
 if(!study)throw Error('Unknown vocabulary study');
 const base=48+keyPc(key);
 if(study.type==='octave')return study.offsets.flatMap((offset,beat)=>{
  const lower=base+offset,upper=lower+12;
  const a={string:4,fret:lower-OPEN[4],midi:lower,name:noteName(lower),index:beat*2,beat,pc:lower%12,pick:'D'};
  const b={string:2,fret:upper-OPEN[2],midi:upper,name:noteName(upper),index:beat*2+1,beat,pc:upper%12,pick:'D'};
  if([a,b].some(n=>n.fret<0||n.fret>22))throw Error('Octave pair is out of range');
  return [a,b];
 });
 if(study.type==='minor-third-dyads')return study.offsets.flatMap((offset,beat)=>{
  const lower=base+offset,upper=lower+3;
  const a={string:4,fret:lower-OPEN[4],midi:lower,name:noteName(lower),index:beat*2,beat,pc:lower%12,pick:'D'};
  const b={string:3,fret:upper-OPEN[3],midi:upper,name:noteName(upper),index:beat*2+1,beat,pc:upper%12,pick:'D'};
  if([a,b].some(n=>n.fret<0||n.fret>22))throw Error('Dyad is out of range');
  return [a,b];
 });
 let prev=null;
 return study.offsets.map((offset,index)=>{
  const midi=base+offset,p=locate(midi,prev);prev=p;
  return {...p,pc:midi%12,name:noteName(midi),pick:index%2?'U':'D',index};
 });
}
