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
// An unbarred pitch-and-fingering display. Without duration data, noteheads are stemless:
// never imply false quarter notes, time signature, rests or barlines.
export function renderStaffTabSvg(notes=[],key='C',active=-1,options={}){
 const sig=keySignature(key),shown=notes.slice(0,48),{count,positions}=notationColumns(shown);
 const valid=shown.map((n,i)=>{
  const string=Number(n.string),fret=Number(n.fret);
  if(!Number.isInteger(string)||string<0||string>5||!Number.isInteger(fret)||fret<0||fret>22)return null;
  // The fretboard position is the pitch authority; never draw contradictory TAB/notation.
  const midi=OPENS[string]+fret;
  return {n,i,string,fret,midi,written:writtenNote(midi,key)};
 });
 const written=valid.filter(Boolean).map(v=>v.written.step);
 const high=written.length?Math.max(...written):38,low=written.length?Math.min(...written):30;
 const bottom=Math.max(148,36+(high-30)*6);
 const staffTop=bottom-48;
 const tabStart=bottom+Math.max(91,39+(30-low)*6);
 const height=tabStart+6*22+47;
 const startX=Math.max(192,125+Math.abs(sig.fifths)*13);
 const width=Math.max(700,startX+Math.max(1,count)*64+28);
 const staff=[bottom-48,bottom-36,bottom-24,bottom-12,bottom];
 const tab=Array.from({length:6},(_,i)=>tabStart+i*22);
 const line=(x,y,xx,yy,opacity=.78,weight=1)=>'<line x1="'+x+'" y1="'+y+'" x2="'+xx+'" y2="'+yy+'" stroke="var(--fret-line,currentColor)" opacity="'+opacity+'" stroke-width="'+weight+'"/>';
 const t=(x,y,label,size=13,extra='')=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" fill="currentColor" font-size="'+size+'" font-family="system-ui,sans-serif" '+extra+'>'+esc(label)+'</text>';
 let body='<rect x="0" y="0" width="'+width+'" height="'+height+'" rx="10" fill="transparent"/>';
 body+=t(26,23,'STAFF',11,'font-weight="800" letter-spacing="1.2"');
 body+=t(26,tabStart-14,'TAB',11,'font-weight="800" letter-spacing="1.2"');
 staff.forEach(y=>{body+=line(24,y,width-22,y,.65,1.5);});
 tab.forEach(y=>{body+=line(24,y,width-22,y,.68,1.4);});
 // 8vb treble clef: guitar sounds an octave below written pitch.
 body+='<text x="35" y="'+(bottom+3)+'" font-family="Noto Music,Segoe UI Symbol,DejaVu Sans,serif" font-size="60" fill="currentColor">𝄞</text>';
 body+=t(52,bottom+22,'8',11,'font-weight="700"');
 const signatureNotes=sig.fifths>=0?['F5','C5','G5','D5','A4','E5','B4']:['B4','E5','A4','D5','G4','C5','F4'];
 const order=sig.fifths>=0?'♯':'♭';
 for(let i=0;i<Math.abs(sig.fifths);i++){
  const m=/^([A-G])(\d)$/.exec(signatureNotes[i]);
  const step=Number(m[2])*7+LETTER_INDEX[m[1]];
  body+=t(87+i*13,bottom-(step-30)*6+7,order,23,'font-family="Noto Music,Segoe UI Symbol,serif"');
 }
 body+=t(118,staffTop-18,key+' major key signature',11,'font-weight="700"');
 ['e','B','G','D','A','E'].forEach((label,i)=>{body+=t(13,tab[i]+5,label,13,'font-weight="750"');});
 const history=new Map(),clickPrefix=/^[a-z][a-z0-9-]*$/.test(options.actionPrefix||'')?options.actionPrefix:null;
 for(const row of valid){
  if(!row)continue;
  const {n,i,string,fret,midi,written:note}=row,x=startX+positions[i]*64;
  const y=bottom-(note.step-30)*6,tabY=tab[string],focused=i===active;
  const noteLabel=note.letter+(note.alter===1?'♯':note.alter===-1?'♭':'')+note.octave;
  const histKey=note.letter+note.octave;
  const old=history.has(histKey)?history.get(histKey):sig.alters[note.letter];
  const accidental=old===note.alter?'':note.alter===0?'♮':note.alter===1?'♯':'♭';
  if(accidental)body+=t(x-21,y+6,accidental,21,'font-family="Noto Music,Segoe UI Symbol,serif"');
  history.set(histKey,note.alter);
  if(y>bottom)for(let ly=bottom+12;ly<=y+.5;ly+=12)body+=line(x-15,ly,x+15,ly,1,1.5);
  if(y<staffTop)for(let ly=staffTop-12;ly>=y-.5;ly-=12)body+=line(x-15,ly,x+15,ly,1,1.5);
  const action=clickPrefix?' data-action="'+clickPrefix+':'+i+'" role="button" tabindex="0" aria-label="Focus '+esc(noteLabel+' on '+['high E','B','G','D','A','low E'][string]+' string fret '+fret)+'"':'';
  body+='<g class="score-note'+(focused?' selected':'')+'" data-note-index="'+i+'"'+action+'>';
  if(focused)body+='<rect x="'+(x-25)+'" y="'+(staffTop-8)+'" width="50" height="'+(tab[5]-staffTop+18)+'" rx="8" fill="var(--teal)" opacity=".10"/>';
  body+='<ellipse cx="'+x+'" cy="'+y+'" rx="8.1" ry="5.8" transform="rotate(-17 '+x+' '+y+')" fill="'+(focused?'var(--teal)':'var(--text,currentColor)')+'"/>';
  if(focused)body+='<circle cx="'+x+'" cy="'+y+'" r="13" fill="none" stroke="var(--teal)" stroke-width="1.8"/>';
  body+='<rect x="'+(x-18)+'" y="'+(tabY-11)+'" width="36" height="22" rx="6" fill="var(--panel-bg,#292737)" stroke="'+(focused?'var(--teal)':'transparent')+'" stroke-width="2"/>';
  body+=t(x,tabY+5,fret,15,'font-weight="800"');
  // Label the sounded pitch; notation above follows the octave-transposing guitar convention.
  body+=t(x,tab[5]+29,noteLabel,10,'opacity=".77"');
  if(clickPrefix)body+='<rect x="'+(x-23)+'" y="'+(staffTop-8)+'" width="46" height="'+(tab[5]-staffTop+20)+'" fill="transparent" pointer-events="all"/>';
  body+='</g>';
 }
 body+=t(width/2,height-12,'Pitch and fingering alignment only · rhythm/durations are not specified',11,'opacity=".7"');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" width="'+width+'" height="'+height+'" class="guitar-staff-tab" role="img" aria-label="'+esc('Guitar treble staff with key signature in '+key+' and aligned six-string tablature')+'" style="display:block;width:'+width+'px;max-width:none">'+body+'</svg>';
}
