// Pitch-only treble staff + TAB for standard guitar, intentionally not a rhythmic transcription.
// Guitar sounds one octave below written treble; this page renders written pitches (+12 semitones).
// Every TAB column and corresponding staff column uses exactly the same horizontal coordinate.
const OPENS=[64,59,55,50,45,40];
const FIFTHS={C:0,G:1,D:2,A:3,E:4,B:5,'F#':6,'C#':7,F:-1,Bb:-2,Eb:-3,Ab:-4,Db:-5,Gb:-6,Cb:-7};
const SHARPS=['F','C','G','D','A','E','B'],FLATS=['B','E','A','D','G','C','F'];
const NAMES_SHARP=['C','C','D','D','E','F','F','G','G','A','A','B'];
const NAMES_FLAT=['C','D','D','E','E','F','G','G','A','A','B','B'];
const ALTER_SHARP=[0,1,0,1,0,0,1,0,1,0,1,0],ALTER_FLAT=[0,-1,0,-1,0,0,-1,0,-1,0,-1,0];
const LETTER_INDEX={C:0,D:1,E:2,F:3,G:4,A:5,B:6};
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function guitarMidi(note){
 if(Number.isInteger(note.midi))return note.midi;
 const s=Number(note.string),f=Number(note.fret);
 if(!Number.isInteger(s)||s<0||s>5||!Number.isInteger(f)||f<0||f>22)throw new RangeError('Invalid standard guitar string or fret');
 return OPENS[s]+f;
}
export function keySignature(key='C'){
 if(!Object.hasOwn(FIFTHS,key))throw new RangeError('Unsupported major key');
 const fifths=FIFTHS[key],order=fifths>0?SHARPS:FLATS;
 const alters=Object.fromEntries([...SHARPS].map(s=>[s,0]));
 for(let i=0;i<Math.abs(fifths);i++)alters[order[i]]=Math.sign(fifths);
 return {key,fifths,alters};
}
export function writtenNote(midi,key='C'){
 if(!Number.isInteger(midi)||midi<0||midi>127)throw new RangeError('Invalid MIDI pitch');
 const sig=keySignature(key),written=midi+12,pc=((written%12)+12)%12;
 const preferFlat=sig.fifths<0;
 const letter=(preferFlat?NAMES_FLAT:NAMES_SHARP)[pc],alter=(preferFlat?ALTER_FLAT:ALTER_SHARP)[pc];
 const naturalPc={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[letter];
 const octave=Math.floor((written-naturalPc-alter)/12)-1;
 const step=octave*7+LETTER_INDEX[letter];
 return {letter,alter,octave,step,accidental:alter===sig.alters[letter]?null:alter===0?'♮':alter===1?'♯':'♭',midi:written};
}
export function notationColumns(notes){
 const columns=[],positions=[];
 for(let i=0;i<notes.length;i++){
  const n=notes[i],tag=Number.isInteger(n.beat)&&n.beat>=0?'beat:'+n.beat:'note:'+i;
  let c=columns.indexOf(tag);if(c<0){c=columns.length;columns.push(tag);}positions.push(c);
 }
 return {count:columns.length,positions};
}
export function renderStaffTabSvg(notes=[],key='C',active=-1){
 const sig=keySignature(key),shown=notes.slice(0,35),{count,positions}=notationColumns(shown);
 const width=Math.max(740,215+count*53),height=305,x0=187,stepPx=6;
 const bottomY=101,staffYs=[53,65,77,89,101],tabYs=[159,181,203,225,247,269];
 let s='<rect width="'+width+'" height="'+height+'" fill="transparent"/>';
 const line=(x1,y1,x2,y2,stroke='currentColor',weight=1,opacity=.7)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+stroke+'" stroke-width="'+weight+'" opacity="'+opacity+'"/>';
 const txt=(x,y,label,size=14,style='')=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" fill="currentColor" font-family="Georgia,serif" font-size="'+size+'" '+style+'>'+esc(label)+'</text>';
 staffYs.forEach(y=>s+=line(25,y,width-12,y,'var(--fret-line,currentColor)',1.3));
 tabYs.forEach(y=>s+=line(25,y,width-12,y,'var(--fret-line,currentColor)',1.2,.72));
 // Staff treble indicator includes the standard octave-lower mark used by guitar.
 s+=txt(44,106,'𝄞',54)+txt(44,123,'8',12)+txt(42,145,'STAFF',10);
 const sharpSteps=[('F'+5),('C'+5),('G'+5),('D'+5),('A'+4),('E'+5),('B'+4)];
 const flatSteps=['B4','E5','A4','D5','G4','C5','F4'];
 const signatureNotes=sig.fifths>=0?sharpSteps:flatSteps;
 const symbol=sig.fifths>=0?'♯':'♭';
 for(let i=0;i<Math.abs(sig.fifths);i++){
  const match=/^([A-G])(\d)$/.exec(signatureNotes[i]);
  const step=Number(match[2])*7+LETTER_INDEX[match[1]];
  const y=bottomY-(step-(4*7+2))*stepPx;
  s+=txt(79+i*12,y+7,symbol,25);
 }
 s+=txt(105,145,esc(key)+' major key signature',10);
 const labels=['e','B','G','D','A','E'];
 labels.forEach((label,i)=>s+=txt(16,tabYs[i]+4,label,12));
 const accidentalHistory=new Map();
 shown.forEach((n,i)=>{
  if(!Number.isInteger(n.string)||n.string<0||n.string>5||!Number.isInteger(n.fret)||n.fret<0||n.fret>22)return;
  const midi=guitarMidi(n),written=writtenNote(midi,key),x=x0+positions[i]*53;
  const y=bottomY-(written.step-(4*7+2))*stepPx;
  // Ledger lines are positioned at staff-line intervals (two diatonic steps).
  if(y>bottomY){for(let led=bottomY+12;led<=y+1;led+=12)s+=line(x-13,led,x+13,led,'currentColor',1.4);}
  if(y<staffYs[0]){for(let led=staffYs[0]-12;led>=y-1;led-=12)s+=line(x-13,led,x+13,led,'currentColor',1.4);}
  const used=accidentalHistory.get(written.letter+written.octave);
  const accidental=used===written.alter?null:written.accidental;
  if(accidental)s+=txt(x-18,y+5,accidental,19);
  accidentalHistory.set(written.letter+written.octave,written.alter);
  const selected=i===active;
  const fill=selected?'var(--teal,#389b91)':'currentColor';
  s+='<ellipse cx="'+x+'" cy="'+y+'" rx="8" ry="5.3" transform="rotate(-15 '+x+' '+y+')" fill="'+fill+'"/>';
  if(selected)s+='<circle cx="'+x+'" cy="'+y+'" r="13" fill="none" stroke="var(--teal,#389b91)" stroke-width="1.8"/>';
  const ty=tabYs[n.string];
  s+='<rect x="'+(x-16)+'" y="'+(ty-10)+'" width="32" height="21" fill="var(--panel-bg,#191b27)"/>';
  s+=txt(x,ty+5,n.fret,15,'font-family="system-ui,sans-serif" font-weight="700"');
  if(i===active)s+='<rect x="'+(x-16)+'" y="'+(ty-11)+'" width="32" height="22" rx="5" fill="none" stroke="var(--teal,#389b91)" stroke-width="2"/>';
 });
 s+=txt(width/2,298,'Pitch and fingering alignment only · rhythm/durations are not specified',12,'font-family="system-ui,sans-serif"');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" width="'+width+'" height="'+height+'" role="img" aria-label="'+esc('Guitar treble staff with key signature in '+key+' and aligned six-string tablature')+'" style="display:block;max-width:100%">'+s+'</svg>';
}
