// Pure music logic + SVG renderers; no dependencies or network access.
const PC_NAMES=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const SHARP_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const STRING_MIDIS=[64,59,55,50,45,40]; // display high e, B, G, D, A, low E
const STRING_NAMES=['e','B','G','D','A','E'];
const INTERVALS={major:[0,4,7],minor:[0,3,7],dim:[0,3,6],maj7:[0,4,7,11],m7:[0,3,7,10],7:[0,4,7,10],m7b5:[0,3,6,10],dim7:[0,3,6,9],aug:[0,4,8],6:[0,4,7,9],m6:[0,3,7,9],mMaj7:[0,3,7,11],'7sus4':[0,5,7,10],'7b5':[0,4,6,10],'7#5':[0,4,8,10],'maj7#5':[0,4,8,11],pentMajor:[0,2,4,7,9],pentMinor:[0,3,5,7,10]};
const INTERVAL_LABEL={0:'1',2:'2',3:'♭3',4:'3',5:'4',6:'♭5',7:'5',8:'♯5',9:'6',10:'♭7',11:'7'};
export {INTERVALS,PC_NAMES};
export const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function keyPc(key){const v={Bb:10,Eb:3,Ab:8,Db:1,Gb:6};return v[key]??SHARP_NAMES.indexOf(key);}
export function noteName(midi){return PC_NAMES[((midi%12)+12)%12]+(Math.floor(midi/12)-1);}
export function pitchName(pc){return PC_NAMES[((pc%12)+12)%12];}
export function enclosureGuide(key='C'){
 const tonic=keyPc(key);
 if(tonic<0)throw new Error('Unrecognized key for enclosure: '+key);
 const third=(tonic+11)%12;
 return {key,dominant:pitchName(tonic+7)+'7',target:pitchName(third),above:pitchName(third+1),below:pitchName(third-1)};
}
export function enclosureInstructions(key='C'){
 const {dominant,target,above,below}=enclosureGuide(key);
 return [
  'In '+key+' major, the V7 chord is '+dominant+'. Its major third, '+target+', is your destination.',
  'Play '+above+' (one semitone ABOVE) → '+below+' (one semitone BELOW) → '+target+'. Count '+above+' on beat 4, '+below+' on the “and” of 4, then land on '+target+' on beat 1.',
  'Repeat slowly twice. Then add two '+dominant+' chord tones and resolve to the I chord in '+key+'. Keep the target louder than the two approach notes.'
 ];
}
function rootPitch(pc,octaves){const lo=octaves===3?40:45;const hi=octaves===3?50:56;const options=[];for(let m=lo;m<=hi;m++)if(m%12===pc)options.push(m); if(!options.length)return null;return options.sort((a,b)=>Math.abs(a-(octaves===3?43:49))-Math.abs(b-(octaves===3?43:49)))[0];}
function pitchCandidates(midi){return STRING_MIDIS.flatMap((open,i)=>{const f=midi-open;return f>=0&&f<=22?[{string:i,fret:f}]:[];});}
function qualityIntervals(quality,octaves){const ints=INTERVALS[quality]||INTERVALS.maj7;return Array.from({length:octaves},(_,o)=>ints.map(v=>v+12*o)).flat().concat([12*octaves]);}
export function buildNotePath(key='C',quality='maj7',octaves=2,position='low'){
 const pc=keyPc(key),root=rootPitch(pc,octaves);if(root===null)return [];
 const pitches=qualityIntervals(quality,octaves).map(semi=>root+semi);const anchor={low:4,mid:9,high:13}[position]||4;
 let states=pitchCandidates(pitches[0]).map(pos=>({pos,cost:(pos.string===0?8:0)+pos.fret*.05+Math.abs(pos.fret-anchor)*.32,path:[pos]}));
 if(!states.length)return [];
 for(let n=1;n<pitches.length;n++){
  const candidates=pitchCandidates(pitches[n]); const next=[];
  for(const c of candidates){let best=null;
   for(const s of states){const prev=s.pos;
    // Penalize moving back to a physically lower string while ascending in pitch.
    const lowerStringPenalty=c.string>prev.string?11:0;
    const stringJump=Math.abs(c.string-prev.string);
    const shift=Math.abs(c.fret-prev.fret);
    const stretch=shift>6?(shift-6)*.5:0;
    const openPenalty=c.fret===0?1.2:0;
    const score=s.cost+lowerStringPenalty+stringJump*.7+shift*.31+stretch+openPenalty+(c.fret>17?1:0)+Math.abs(c.fret-anchor)*.25;
    if(!best||score<best.cost)best={pos:c,cost:score,path:s.path.concat([c])};
   }if(best)next.push(best);
  }states=next;if(!states.length)return [];
 }
 const best=states.sort((a,b)=>a.cost-b.cost)[0];
 return pitches.map((midi,i)=>({midi,name:noteName(midi),pc:midi%12,interval:quality==='dim7'&&((midi-root)%12)===9?'𝄫7':quality==='7b5'&&((midi-root)%12)===6?'♭5':quality==='7sus4'&&((midi-root)%12)===5?'4':INTERVAL_LABEL[(midi-root)%12]??'',fret:best.path[i].fret,string:best.path[i].string,pick:i%2?'U':'D',index:i}));
}
function cell(note, string, fret,pick){return {name:note,fret,string,pick};}
export function buildExample(kind,key='C',quality='maj7',octaves=2,position='low'){
 if(kind==='arpeggio'||kind==='scale')return buildNotePath(key,quality,octaves,position);
 if(kind==='arpeggio-dim7')return buildNotePath(key,'dim7',octaves,position);

 // Stage-specific G-string targets; fixed technique frets deliberately do not transpose with session key.
 if(/^vibrato-g-[1-4]$/.test(kind)){
  const finger=Number(kind.at(-1)),fret=4+finger,midi=55+fret;
  return [{...cell(noteName(midi),2,fret,'D'),midi,finger,index:0}];
 }
 if(kind==='vibrato-g-legato')return [[5,1,'D'],[7,3,'H'],[5,1,'P']].map(([fret,finger,pick],index)=>({
  ...cell(noteName(55+fret),2,fret,pick),midi:55+fret,finger,index
 }));

 // Fingering targets for a G-only vibrato isolation drill (not simultaneous notes).
 if(kind==='vibrato-g')return [
  cell('C4',2,5,'D'),cell('Db4',2,6,'D'),cell('D4',2,7,'D'),cell('Eb4',2,8,'D'),
  cell('C4',2,5,'D'),cell('D4',2,7,'H'),cell('C4',2,5,'P')
 ];
 // Pairs are visual fret targets; strike together when the drill instructions say so.
 if(kind==='double-stop')return [{...cell('C4',2,5,'D'),beat:0},{...cell('E4',1,5,'D'),beat:0}];
 if(kind==='octave')return [{...cell('C3',5,8,'D'),beat:0},{...cell('C4',3,10,'D'),beat:0}];
 // Interval-recall and responsive guide-tone exercises use actual pitch candidates.
 if(kind==='circle-fourths'||kind==='circle-fifths'||kind==='circle-recall'){
  const root=keyPc(key),step=kind==='circle-fifths'?7:5;
  const pitches=Array.from({length:5},(_,i)=>(root+i*step)%12);
  return pitches.map((pc,i)=>{
   // Place notes within a compact readable C4–B4 register; pitch classes are exact.
   const midi=60+pc,candidates=pitchCandidates(midi),position=candidates.find(p=>p.string===2)||candidates[0];
   if(!position)return null;
   return {...position,midi,pc,name:pitchName(pc),pick:i%2?'U':'D',index:i,interval:i===0?'1':kind==='circle-fifths'?'5':'4'};
  }).filter(Boolean);
 }
 if(kind==='target-third'||kind==='target-seventh'||kind==='target-root'){
  const root=keyPc(key),offset=kind==='target-third'?11:kind==='target-seventh'?5:0;
  const targetPc=(root+offset)%12,midi=60+targetPc,positions=pitchCandidates(midi);
  const position=positions.find(p=>p.string===2)||positions[0];
  return position?[{...position,midi,pc:targetPc,name:pitchName(targetPc),pick:'D',index:0,interval:kind==='target-third'?'3 of V':kind==='target-seventh'?'b7 of V':'1 of I'}]:[];
 }
 if(kind==='skip')return [cell('D',4,5,'D'),cell('C',2,5,'U'),cell('F',1,6,'D'),cell('C',2,5,'U')];
 if(kind==='wide')return [cell('G',3,5,'D'),cell('A',0,5,'U'),cell('G',3,5,'D'),cell('A',0,5,'U')];
 if(kind==='single')return [cell('C',2,5,'D'),cell('C',2,5,'U'),cell('C',2,5,'D'),cell('C',2,5,'U')];
 if(kind==='triplet')return [cell('G',2,0,'D'),cell('B',1,0,'U'),cell('G',2,0,'D'),cell('B',1,0,'U'),cell('G',2,0,'D'),cell('B',1,0,'U')];
 if(kind==='swing')return [cell('G',2,0,'D'),cell('B',1,0,'U'),cell('G',2,0,'D'),cell('B',1,0,'U')];
 if(kind==='enclosure'){
  const target=(keyPc(key)+11)%12;const pitches=[(target+1)%12,(target+11)%12,target];return pitches.map((pc,i)=>{
   const root=buildNotePath(key,'maj7',2);const targetMidi=(root[0]?.midi||48)+11+(i===0?1:i===1?-1:0);
   let candidates=pitchCandidates(targetMidi);const pos=candidates.find(p=>p.string===1)||candidates[0]||{string:1,fret:8};
   return {name:pitchName(pc),string:pos.string,fret:pos.fret,pick:i%2?'U':'D',pc,index:i};
  });
 }
 if(kind==='barry'){
  // Descending dominant bebop cell: V 7  b7 6 5 4 3 2 1.
  // At steady eighth notes from the first beat, V7 chord tones land on beats.
  const vpc=(keyPc(key)+7)%12;let high=Array.from({length:12},(_,i)=>60+i).find(m=>m%12===vpc)||67;
  const offsets=[0,-1,-2,-3,-5,-7,-8,-10,-12];let prev=null;
  return offsets.map((delta,i)=>{
   const midi=high+delta,opts=pitchCandidates(midi);
   const choices=opts.sort((a,b)=>{
    const score=c=>Math.abs(c.fret-7)*.28+(prev?Math.abs(c.fret-prev.fret)*.3+(c.string<prev.string?9:0):0);
    return score(a)-score(b);
   });const pos=choices[0]||{string:2,fret:5};prev=pos;
   return {...pos,midi,name:noteName(midi),pc:midi%12,pick:i%2?'U':'D',index:i};
  });
 }
 if(kind==='approach'){
  const tonic=(keyPc(key)+12)%12;const root=buildNotePath(key,'maj7',2);const targetMidi=(root[0]?.midi||48)+4;return [targetMidi-1,targetMidi,targetMidi+3,targetMidi+7].map((midi,i)=>{const opts=pitchCandidates(midi);const pos=opts.find(p=>p.string===2)||opts[0]||{string:0,fret:5};return {...pos,name:noteName(midi),pc:midi%12,pick:i%2?'U':'D',index:i};});
 }
 // ii-v-i / ear: ascending guide tone fragment, with string selection from real pitches.
 const tonic=keyPc(key);const root=buildNotePath(key,'maj7',2)[0]?.midi||48;
 const seq=[root+5,root+5,root+4,root+7].map((midi,i)=>{const options=pitchCandidates(midi);const p=options.find(o=>o.string===2)||options[0]||{string:1,fret:5};return {...p,name:noteName(midi),pc:midi%12,pick:i%2?'U':'D',index:i};});
 return seq;
}
function svgWrap(content,w,h,label){return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(label)}" viewBox="0 0 ${w} ${h}" style="max-width:100%;display:block" width="${w}" height="${h}">${content}</svg>`;}
const svgText=(x,y,text,cls='',size=12)=>`<text x="${x}" y="${y}" fill="currentColor" font-size="${size}" font-family="system-ui, sans-serif" text-anchor="middle" class="${cls}">${escapeHtml(text)}</text>`;
export function renderTabSvg(notes=[],active=-1,labels='note'){
 const shown=notes.slice(0,35);
 // Notes with the same finite beat index are attacked together: TAB vertically aligns them.
 const columns=[],positions=[];
 shown.forEach((note,i)=>{
  const beat=Number.isInteger(note.beat)&&note.beat>=0?'beat:'+note.beat:'note:'+i;
  let index=columns.indexOf(beat);
  if(index===-1){index=columns.length;columns.push(beat);}
  positions.push(index);
 });
 const n=columns.length,w=Math.max(640,100+n*53),h=226;
 let body=`<rect width="${w}" height="${h}" rx="12" fill="transparent"/>`;
 for(let string=0;string<6;string++){
  const y=46+string*23;
  body+=`<line x1="72" y1="${y}" x2="${w-15}" y2="${y}" stroke="var(--fret-line,#687785)" stroke-width="1" opacity=".63"/>${svgText(35,y+4,STRING_NAMES[string])}`;
 }
 const emitted=new Set();
 shown.forEach((note,i)=>{
  const col=positions[i],x=104+col*53,y=46+note.string*23,highlight=active===i;
  body+=`<rect x="${x-20}" y="${y-15}" width="40" height="30" fill="var(--panel-bg,#171f2d)"/>`;
  body+=`<rect x="${x-19}" y="${y-16}" width="38" height="32" rx="8" fill="${highlight?'#315fa8':'transparent'}"/>`;
  body+=svgText(x,y+5,note.fret,highlight?'on-note':'',16);
  if(labels!=='hidden'&&!emitted.has(col)){
   body+=svgText(x,22,note.pick||((i%2)?'U':'D'),'pick-label',13);
   body+=svgText(x,206,labels==='interval'?(note.interval||note.name||''):(note.name||''),'',12);
   emitted.add(col);
  }
 });
 if(labels!=='hidden'){body+=svgText(35,22,'PICK','',9);body+=svgText(35,206,labels==='interval'?'DEGREE':'NOTE','',9);}
 return svgWrap(body,w,h,'Guitar tablature: notes in one column play together, with pick direction and note names');
}
export function renderFretboardSvg(notes=[],active=-1,labels='note'){
 const used=notes.filter(n=>Number.isFinite(n.fret)).map(n=>n.fret),mn=Math.min(...used,0),mx=Math.max(...used,8);
 const start=mx-mn>11?Math.max(0,Math.min(...used)-1):Math.max(0,Math.min(...used.filter(n=>n>0),3)-1);
 const end=Math.min(22,Math.max(start+7,...used)+1),cell=58,w=105+(end-start+1)*cell,h=240;
 let body=`<rect width="${w}" height="${h}" rx="12" fill="transparent"/>`;
 for(let f=start;f<=end;f++){const x=94+(f-start)*cell;body+=`<line x1="${x}" y1="47" x2="${x}" y2="193" stroke="var(--fret-line,#8091a3)" stroke-width="${f===0?4:1.8}" opacity=".55"/>`;if(f%3===0||f===start)body+=svgText(x+cell/2,29,f===0?'OPEN':f,'',11);}
 const yByS=s=>52+s*28;
 for(let s=0;s<6;s++){const y=yByS(s);body+=`<line x1="94" y1="${y}" x2="${94+(end-start+1)*cell}" y2="${y}" stroke="var(--fret-line,#8091a3)" stroke-width="${1+s*.4}" opacity=".7"/>${svgText(36,y+4,STRING_NAMES[s])}`;}
 notes.forEach((no,i)=>{if(no.fret<start||no.fret>end)return;const x=94+(no.fret-start+.5)*cell,y=yByS(no.string),root=no.interval==='1'||i===0;
 const color=active===i?'#f4b740':root?'#3767d7':'#169b91';
 const c=labels==='interval'?(no.interval||no.name):no.name;
 body+=`<circle cx="${x}" cy="${y}" r="${active===i?19:16}" fill="${color}" stroke="${active===i?'#fff':'#132030'}" stroke-width="${active===i?2.2:1.5}"/>${labels==='hidden'?'':svgText(x,y+4,c||'','',(c||'').length>3?9:11)}`;
 if(labels!=='hidden'&&notes.length<15)body+=svgText(x,y-22,(i+1),'',10);
 });
 return svgWrap(body,w,h,'Fretboard with positions, finger targets and notes');
}
export function shellShapes(key='C'){
 const pc=keyPc(key),shift=(pc+12)%12; // shift 0..11, slightly high in some keys but fully movable.
 const bases=[{label:'ii m7',name:pitchName(pc+2)+'m7',shape:[null,5,3,5,null,null]},{label:'V7',name:pitchName(pc+7)+'7',shape:[3,null,3,4,null,null]},{label:'I maj7',name:pitchName(pc)+'maj7',shape:[null,3,2,4,null,null]}];
 const offset=shift===11?-1:shift===10?-2:shift; // Bb and B can shift down.
 return bases.map(b=>({...b,shape:b.shape.map(f=>f===null?null:f+offset)}));
}
export function chordDiagramSvg(chord){
 const shape=chord.shape,vals=shape.filter(v=>v!==null&&v>0),base=Math.max(1,Math.min(...vals)-1),w=198,h=191,xx=s=>40+s*24;
 let body=`<rect x="0" y="0" width="${w}" height="${h}" rx="10" fill="transparent"/>`;
 for(let s=0;s<6;s++)body+=`<line x1="${xx(s)}" y1="34" x2="${xx(s)}" y2="150" stroke="var(--fret-line,#899aaa)" opacity=".7"/>`;
 for(let r=0;r<5;r++)body+=`<line x1="40" y1="${34+r*29}" x2="160" y2="${34+r*29}" stroke="var(--fret-line,#899aaa)" stroke-width="${r===0&&base===1?3:1}" opacity=".7"/>`;
 shape.forEach((f,s)=>{if(f===null){body+=svgText(xx(s),23,'×','',16);return;}if(f===0){body+=svgText(xx(s),23,'○','',15);return;}const y=34+(f-base+.5)*29;if(y<34||y>150)return;body+=`<circle cx="${xx(s)}" cy="${y}" r="10" fill="#169b91"/>${svgText(xx(s),y+4,f,'',10)}`;});
 body+=svgText(22,48,base+'fr','',10);
 return svgWrap(body,w,h,`${chord.name}: muted strings marked X`);
}
export function progressionFor(key='C') {const pc=keyPc(key);return [{name:pitchName(pc+2)+'m7',role:'ii'},{name:pitchName(pc+7)+'7',role:'V'},{name:pitchName(pc)+'maj7',role:'I'}];}
export function buildSongReport(records, songId){return records.filter(r=>r.kind==='song'&&r.payload?.songId===songId).sort((a,b)=>b.created_at.localeCompare(a.created_at));}
