import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {DRILL_BY_ID,currentStage,stageCount,clampedStageIndex} from '../data.js';
import {buildExample,renderTabSvg} from '../music.js';
const drill=DRILL_BY_ID['muting-vibrato-g'];

test('every finger stage shows only its precise G-string target and both neighboring-string checks',()=>{
 for(const finger of [1,2,3,4]){
  const stage=drill.stages[finger-1];assert.equal(stage.finger,finger);
  for(const key of ['C','Bb','Db','Eb']){
   const notes=buildExample(stage.exampleKind,key);
   assert.equal(notes.length,1);assert.equal(notes[0].string,2);assert.equal(notes[0].fret,4+finger);
   assert.equal(notes[0].midi,55+notes[0].fret);assert.equal(notes[0].finger,finger);
   assert.equal(stage.activeNote,0);assert.ok(renderTabSvg(notes).includes(String(notes[0].fret)));
  }
  const cues=stage.instructions.join(' ');assert.match(cues,/D/);assert.match(cues,/B/);assert.match(cues,/G/);
  assert.ok(stage.seconds>=45&&stage.seconds<=90);
 }
});
test('legato shows the 1-3-1 hammer-on/pull-off phrase and width/bend stages keep a single target',()=>{
 const legato=buildExample(drill.stages[4].exampleKind);
 assert.deepEqual(legato.map(n=>[n.string,n.fret,n.finger,n.pick]),[[2,5,1,'D'],[2,7,3,'H'],[2,5,1,'P']]);
 for(const stage of drill.stages.slice(5)){
  assert.equal(buildExample(stage.exampleKind).length,1);
  assert.match(stage.instructions.join(' '),/D/);assert.match(stage.instructions.join(' '),/B/);
 }
 assert.match(drill.stages[5].instructions.join(' '),/optional|only if/);
 assert.match(drill.stages[6].instructions.join(' '),/return|returned/);
});
test('finger selection and repeat preserve running clock, ratings, labels, BPM and past records',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const source=app.slice(app.indexOf('function movePracticeStage(delta){'),app.indexOf('const actions={'));
 const entry={id:drill.id,stageIndex:6,minutes:7,elapsedMs:19800};
 const state={active:{entries:[entry],position:0,startedAt:1000,elapsedMs:19800},settings:{defaultBpm:82,labels:'hidden',diagram:'fretboard'},records:[{id:'existing'}]};
 const before=JSON.stringify(state);let renders=0,saves=0;
 const ctx={DRILL_BY_ID,clampedStageIndex,currentStage,stageCount,currentDrill:()=>entry,state,diagramStep:-1,ratingPercent:70,saveState:()=>saves++,render:()=>renders++};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 for(const finger of [1,3,2,4]){ctx.selectVibratoFinger(finger);assert.equal(entry.stageIndex,finger-1);assert.equal(ctx.diagramStep,0);}
 ctx.repeatVibratoStage();assert.equal(entry.stageIndex,3);assert.equal(ctx.ratingPercent,70);
 for(const invalid of [0,5,1.2,NaN,'3'])ctx.selectVibratoFinger(invalid);
 assert.equal(entry.stageIndex,3);assert.equal(saves,4);assert.equal(renders,5);
 entry.stageIndex=6;assert.equal(JSON.stringify(state),before);
 entry.id='picking-reset';ctx.selectVibratoFinger(2);ctx.repeatVibratoStage();assert.equal(renders,5);
});
