import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNotePath,INTERVALS,renderTabSvg,renderFretboardSvg,shellShapes,progressionFor,enclosureGuide,enclosureInstructions,keyPc,buildExample} from '../music.js';
import {makeSession,SESSION_DURATIONS,SESSION_MODES,KEYS,DRILLS,DRILL_BY_ID,SONGS,stageCount,currentStage,clampedStageIndex} from '../data.js';
test('twelve keys in cycle of fourths',()=>{assert.deepEqual(KEYS,['C','F','Bb','Eb','Ab','Db','Gb','B','E','A','D','G']);for(let i=0;i<12;i++)assert.equal(makeSession(i).key,KEYS[i]);});
test('chord formulas',()=>{assert.deepEqual(INTERVALS.maj7,[0,4,7,11]);assert.deepEqual(INTERVALS.m7b5,[0,3,6,10]);assert.deepEqual(INTERVALS.dim7,[0,3,6,9]);assert.deepEqual(INTERVALS.aug,[0,4,8]);assert.deepEqual(INTERVALS.dim,[0,3,6]);});
test('2 octaves end two octaves above root and have valid fret positions',()=>{for(const key of KEYS)for(const q of ['major','minor','dim','maj7','m7','7','m7b5','dim7','aug','pentMajor','pentMinor']){const path=buildNotePath(key,q,2);assert.equal(path.length,INTERVALS[q].length*2+1,key+' '+q);assert.equal(path.at(-1).midi-path[0].midi,24);for(const n of path){assert.ok(n.fret>=0&&n.fret<=22,key+' '+q);assert.ok(n.string>=0&&n.string<=5);}}});
test('3 octave paths span 36 semitones and playable standard guitar range',()=>{for(const k of KEYS)for(const q of ['major','minor']){const path=buildNotePath(k,q,3);if(k==='Eb'){assert.equal(path.length,0,'Eb cannot span 3 octaves on a 22-fret standard guitar');continue;}assert.equal(path.length,10,k+' '+q);assert.equal(path.at(-1).midi-path[0].midi,36);}});
test('svg produces accessible diagrams',()=>{const notes=buildNotePath('C','maj7',2);assert.match(renderTabSvg(notes),/<svg/);assert.match(renderTabSvg(notes),/aria-label=/);assert.match(renderFretboardSvg(notes),/<circle/);});
test('ii-V-I chord-name basics',()=>{assert.deepEqual(progressionFor('C').map(c=>c.name),['Dm7','G7','Cmaj7']);assert.equal(shellShapes('C')[0].shape[1],5);assert.equal(keyPc('Bb'),10);});
test('45-minute session shape and repertoire catalogue',()=>{for(const mode of ['technique','repertoire']){const s=makeSession(3,mode);assert.equal(s.entries.reduce((n,x)=>n+x.minutes,0),45);assert.ok(s.entries.every(x=>x.id==='song'||DRILLS.find(d=>d.id===x.id)));}assert.equal(SONGS.length,8);});

test('dominant bebop fragment places chord tones on even indexes',()=>{const seq=buildExample('barry','C');assert.equal(seq.length,9);assert.deepEqual(seq.filter((_,i)=>i%2===0).map(n=>n.pc),[7,5,2,11,7]);});

test('chromatic enclosures target the dominant third in selected key',()=>{
 const cases={C:['G7','B','C','Bb'],Bb:['F7','A','Bb','Ab'],Db:['Ab7','C','Db','B'],Eb:['Bb7','D','Eb','Db']};
 for(const [key,want] of Object.entries(cases)){
  const guide=enclosureGuide(key);
  assert.deepEqual([guide.dominant,guide.target,guide.above,guide.below],want);
  const instructions=enclosureInstructions(key);
  assert.equal(instructions.length,3);
  assert.ok(instructions[1].includes(guide.above+' (one semitone ABOVE)'));
  assert.ok(instructions[1].includes(guide.below+' (one semitone BELOW)'));
  assert.deepEqual(buildExample('enclosure',key).map(n=>n.name),[guide.above,guide.below,guide.target]);
 }
});
test('C enclosure describes Bb clearly, not A sharp',()=>{
 const explanation=enclosureInstructions('C').join(' ');
 assert.match(explanation,/Bb/);
 assert.doesNotMatch(explanation,/A#/);
});

test('selected drills have correctly sized, human-readable, nonempty practice stages',()=>{
 for(const id of ['picking-reset','penta-major','muting-vibrato-g']){
  const d=DRILL_BY_ID[id];
  assert.ok(d,id+' exists');
  assert.ok(stageCount(d)>=4,id+' has at least four stages');
  assert.equal(currentStage(d,-500),d.stages[0]);
  assert.equal(currentStage(d,999),d.stages[d.stages.length-1]);
  assert.equal(clampedStageIndex(d,2),2);
  for(const stage of d.stages){
   assert.ok(stage.title?.length>4,id+' stage title');
   assert.ok(stage.focus?.length>10,id+' stage objective');
   assert.ok(stage.instructions?.length>=2,id+' stage instructions');
   assert.ok(buildExample(stage.exampleKind||d.kind).length>0,id+' stage diagram exists');
  }
 }
 for(const d of DRILLS.filter(d=>!d.stages))assert.equal(stageCount(d),0);
});
test('G-string vibrato diagram shows playable, isolated G string positions only',()=>{
 const vibrato=DRILL_BY_ID['muting-vibrato-g'];
 assert.equal(vibrato.stages.length,5);
 const notes=buildExample('vibrato-g');
 assert.ok(notes.every(n=>n.string===2),'all notes belong to the G string');
 assert.deepEqual(notes.slice(0,4).map(n=>[n.fret,n.name]),[[5,'C4'],[6,'Db4'],[7,'D4'],[8,'Eb4']]);
 assert.deepEqual(notes.slice(4).map(n=>n.fret),[5,7,5]);
 assert.deepEqual(notes.slice(4).map(n=>n.pick),['D','H','P']);
 assert.deepEqual(vibrato.stages.slice(0,4).map(s=>s.activeNote),[0,1,2,3]);
 assert.ok(vibrato.stages[4].instructions.join(' ').includes('pull off'));
});
test('double stops and octave-pair diagrams use the named physical strings',()=>{
 const ds=buildExample('double-stop');
 assert.deepEqual(ds.map(n=>[n.string,n.fret]),[[2,5],[1,5]]);
 const oct=buildExample('octave');
 assert.deepEqual(oct.map(n=>[n.string,n.fret]),[[5,8],[3,10]]);
 assert.ok(renderTabSvg(ds).includes('5'));
 assert.ok(renderFretboardSvg(oct).includes('C3'));
});

test('session planner supports distinct focus types at six lengths',()=>{
 assert.deepEqual(SESSION_DURATIONS,[30,45,60,75,90,120]);
 assert.deepEqual(SESSION_MODES.map(item=>item[0]),['technique','repertoire','soloing','comping','ear','mixed']);
 for(const [mode] of SESSION_MODES)for(const duration of SESSION_DURATIONS){
  const plan=makeSession(4,mode,'autumn-leaves',duration);
  assert.equal(plan.mode,mode);
  assert.equal(plan.durationMinutes,duration);
  assert.equal(plan.entries.reduce((sum,item)=>sum+item.minutes,0),duration,mode+' '+duration);
  assert.ok(plan.entries.length>=6);
  assert.ok(plan.entries.every(entry=>entry.minutes>=1&&Number.isInteger(entry.minutes)));
  assert.ok(plan.entries.every(entry=>entry.id==='song'||DRILL_BY_ID[entry.id]),mode+' '+duration+' unrecognized drill');
  assert.ok(plan.entries.every(entry=>entry.done===false));
 }
});
test('45-minute original Technique and Repertoire templates remain recognizable',()=>{
 for(const mode of ['technique','repertoire']){
  const plan=makeSession(0,mode);
  assert.equal(plan.durationMinutes,45);
  assert.equal(plan.entries.reduce((sum,item)=>sum+item.minutes,0),45);
  assert.equal(plan.entries.length,7);
 }
});
test('session types produce different musical priorities rather than identical queues',()=>{
 const types=SESSION_MODES.map(([mode])=>makeSession(1,mode,'autumn-leaves',60));
 const categories=types.map(plan=>plan.entries.map(item=>item.id==='song'?'song':DRILL_BY_ID[item.id].category));
 const byMode=Object.fromEntries(SESSION_MODES.map(([mode],i)=>[mode,categories[i]]));
 assert.ok(byMode.soloing.filter(c=>['arpeggio','pentatonic','jazz'].includes(c)).length>=4);
 assert.ok(byMode.comping.filter(c=>c==='comping').length>=3);
 assert.ok(byMode.ear.filter(c=>c==='ear').length>=4);
 assert.ok(byMode.repertoire.includes('song'));
 assert.ok(byMode.mixed.includes('song'));
 assert.ok(new Set(categories.map(c=>c.join(','))).size>=5);
});
test('invalid lengths and modes safely revert to legacy 45-minute technique plan',()=>{
 for(const [mode,length] of [['wrong',120],['technique',0],['soloing',500],['comping','bad']]){
  const session=makeSession(0,mode,'autumn-leaves',length);
  assert.ok(SESSION_MODES.some(([id])=>id===session.mode));
  assert.ok(SESSION_DURATIONS.includes(session.durationMinutes));
 }
});

test('circle-of-fourths/fifths intervals and named scale targets match all 12 tonal centers',()=>{
 const drill=DRILL_BY_ID['circle-recall'];
 assert.ok(drill&&drill.stages.length===3);
 for(const key of KEYS){
  const start=keyPc(key);
  for(const [kind,distance] of [['circle-fourths',5],['circle-fifths',7]]){
   const notes=buildExample(kind,key);
   assert.equal(notes.length,5);
   assert.deepEqual(notes.map(n=>n.pc),Array.from({length:5},(_,i)=>(start+i*distance)%12));
   assert.ok(notes.every(n=>n.fret>=0&&n.fret<=22&&n.string>=0&&n.string<6));
  }
  for(const [kind,offset] of [['target-third',11],['target-seventh',5],['target-root',0]]){
   const note=buildExample(kind,key)[0];
   assert.equal(note.pc,(start+offset)%12);
   assert.ok(note.fret<=22);
  }
 }
});
test('simultaneous double-stop and octave notes share one TAB beat column',()=>{
 for(const kind of ['double-stop','octave']){
  const notes=buildExample(kind,'C');
  assert.equal(notes.length,2);
  assert.equal(notes[0].beat,0);
  assert.equal(notes[1].beat,0);
  const tab=renderTabSvg(notes);
  assert.match(tab,/notes in one column play together/);
  // Both fret labels belong at the same x coordinate (104px).
  assert.ok(tab.includes('x="104" y="'+(46+notes[0].string*23+5)+'"'));
  assert.ok(tab.includes('x="104" y="'+(46+notes[1].string*23+5)+'"'));
 }
});
test('ear and approach exercises now have explicit changing target stages',()=>{
 for(const id of ['ear-guide','jazz-approach']){
  const d=DRILL_BY_ID[id];
  assert.ok(stageCount(d)>=3);
  assert.ok(d.stages.every(st=>buildExample(st.exampleKind,'Bb').length>0));
 }
});

test('extended jazz arpeggio qualities are theoretically distinct and transposable',()=>{
 const expected={
  '6':[0,4,7,9],m6:[0,3,7,9],mMaj7:[0,3,7,11],
  '7sus4':[0,5,7,10],'7b5':[0,4,6,10],
  '7#5':[0,4,8,10],'maj7#5':[0,4,8,11]
 };
 const ids=['arp-6','arp-m6','arp-mMaj7','arp-7sus4','arp-7b5','arp-7sharp5','arp-maj7sharp5'];
 for(let index=0;index<ids.length;index++){
  const drill=DRILL_BY_ID[ids[index]];
  assert.ok(drill,ids[index]+' should be in Drill library');
  assert.deepEqual(INTERVALS[drill.quality],expected[drill.quality]);
  assert.equal(drill.octaves??2,2);
  for(const key of KEYS)for(const position of ['low','mid','high']){
   const notes=buildNotePath(key,drill.quality,2,position);
   assert.equal(notes.length,9,key+' '+drill.quality+' '+position);
   const root=notes[0].midi;
   assert.deepEqual(notes.map(n=>n.midi-root),[...expected[drill.quality],...expected[drill.quality].map(x=>x+12),24]);
   assert.ok(notes.every(n=>n.fret>=0&&n.fret<=22&&n.midi>=40&&n.midi<=86));
  }
 }
});
test('diminished triad and fully diminished seventh are separate audible sets',()=>{
 const ctriad=buildNotePath('C','dim',2),cseventh=buildNotePath('C','dim7',2);
 assert.deepEqual(INTERVALS.dim,[0,3,6]);
 assert.deepEqual(INTERVALS.dim7,[0,3,6,9]);
 assert.deepEqual(ctriad.slice(0,3).map(n=>n.pc),[0,3,6]);
 assert.deepEqual(cseventh.slice(0,4).map(n=>n.pc),[0,3,6,9]);
 assert.equal(cseventh[3].interval,'𝄫7');
 assert.equal(buildNotePath('C','m6',2)[3].interval,'6');
 assert.equal(buildNotePath('C','7b5',2)[2].interval,'♭5');
 const dim=DRILL_BY_ID['arp-dim'];
 assert.equal(stageCount(dim),2);
 assert.equal(currentStage(dim,1).exampleKind,'arpeggio-dim7');
 assert.deepEqual(buildExample('arpeggio-dim7','C','dim',2).map(x=>x.midi),cseventh.map(x=>x.midi));
 assert.match(dim.summary,/THREE|three-note/);
 assert.match(dim.instructions.join(' '),/B𝄫/);
});
test('all 7 new arpeggio families appear in automatic multi-day practice rotation',()=>{
 const proposed=['arp-6','arp-m6','arp-mMaj7','arp-7sus4','arp-7b5','arp-7sharp5','arp-maj7sharp5'];
 for(const id of proposed){
  assert.ok(DRILL_BY_ID[id]);
  assert.ok(Array.from({length:80},(_,day)=>makeSession(day,'soloing')).some(plan=>plan.entries.some(e=>e.id===id)),
   id+' never scheduled');
 }
 for(const mode of ['technique','repertoire','soloing','mixed']){
  for(const duration of [30,45,60,90,120]){
   const p=makeSession(16,mode,'autumn-leaves',duration);
   assert.equal(p.entries.reduce((n,x)=>n+x.minutes,0),duration);
  }
 }
});
