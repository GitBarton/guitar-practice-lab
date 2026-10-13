// Musical ii-V-I theory: pure functions, no browser APIs, no network.
import {keyPc} from './music.js';
const FLAT_NAMES=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const SHARP_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const SHARP_KEYS=new Set(['B','E','A','D','G']);
const KNOWN_KEYS=new Set(['C','F','Bb','Eb','Ab','Db','Gb','B','E','A','D','G']);
const CHORDS=Object.freeze({
  m7:{intervals:[0,3,7,10],third:3,seventh:10},
  dom7:{intervals:[0,4,7,10],third:4,seventh:10},
  maj7:{intervals:[0,4,7,11],third:4,seventh:11},
  halfdim:{intervals:[0,3,6,10],third:3,seventh:10},
  dom7b9:{intervals:[0,4,7,10,13],third:4,seventh:10},
  min6:{intervals:[0,3,7,9],third:3,seventh:null}
});
export function noteForKey(pc,key){const list=SHARP_KEYS.has(key)?SHARP_NAMES:FLAT_NAMES;return list[((pc%12)+12)%12];}
export function buildTwoFiveOne(key='C',mode='major'){
 if(!KNOWN_KEYS.has(key))throw new Error('Choose a supported key.');
 if(mode!=='major'&&mode!=='minor')throw new Error('Choose major or minor.');
 const tonic=keyPc(key);
 const defs=mode==='major'
 ? [{role:'ii',root:(tonic+2)%12,quality:'m7',suffix:'m7'},
    {role:'V',root:(tonic+7)%12,quality:'dom7',suffix:'7'},
    {role:'I',root:tonic,quality:'maj7',suffix:'maj7'}]
 : [{role:'iiø',root:(tonic+2)%12,quality:'halfdim',suffix:'m7♭5'},
    {role:'V',root:(tonic+7)%12,quality:'dom7b9',suffix:'7♭9'},
    {role:'i',root:tonic,quality:'min6',suffix:'m6'}];
 const chords=defs.map((d,index)=>{
  const form=CHORDS[d.quality],rootName=noteForKey(d.root,key);
  const midiRoot=(d.index===2?60:48)+d.root; // Bright root-position tonic (C4 for C), lower ii/V support.
  return {
   index,role:d.role,quality:d.quality,rootPc:d.root,rootName,
   label:rootName+d.suffix,
   degrees:form.intervals.slice(),
   midi:form.intervals.map(semi=>midiRoot+semi),
   bassMidi:36+d.root,
   guideTones:[form.third,form.seventh].filter(x=>x!==null).map(semi=>noteForKey(d.root+semi,key))
  };
 });
 return {key,mode,chords,description:mode==='major'?'ii–V–I major':'iiø–V7♭9–i minor'};
}
export function clampHarmonyTempo(value){const n=Math.round(Number(value)||70);return Math.max(40,Math.min(180,n));}
export function chordAtBar(barNumber,barsPerChord=2){
 const bar=Math.max(0,Math.floor(Number(barNumber)||0));
 const width=[1,2,4].includes(Number(barsPerChord))?Number(barsPerChord):2;
 return {chordIndex:Math.floor(bar/width)%3,barInChord:bar%width+1,loop:Math.floor(bar/(width*3))+1};
}
