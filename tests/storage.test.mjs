import test from 'node:test';
import assert from 'node:assert/strict';
import {validRatingPercent,isHighQualityDrill,ratingDisplay,exportCsv,weeklyReport} from '../storage.js';
import {APP_VERSION,RELEASE_NOTES} from '../data.js';

test('only exact 0–100 scores in 10% increments are accepted',()=>{
 for(const n of [0,10,20,30,40,50,60,70,80,90,100]) assert.equal(validRatingPercent({ratingPct:n}),n);
 for(const bad of [-10,101,105,35,80.2,'80',undefined,NaN,Infinity]) assert.equal(validRatingPercent({ratingPct:bad}),null);
});
test('legacy assessments are never silently converted to percentages',()=>{
 for(const rating of ['clean','almost','retry']){
  assert.equal(validRatingPercent({rating}),null);
  assert.equal(ratingDisplay({rating}),rating+' (legacy)');
 }
 assert.equal(isHighQualityDrill({rating:'clean'}),true);
 assert.equal(isHighQualityDrill({rating:'almost'}),false);
});
test('high-quality threshold begins at 90 percent, zero score stays valid',()=>{
 assert.equal(ratingDisplay({ratingPct:0}),'0%');
 assert.equal(ratingDisplay({ratingPct:100}),'100%');
 assert.equal(isHighQualityDrill({ratingPct:80}),false);
 assert.equal(isHighQualityDrill({ratingPct:90}),true);
 assert.equal(isHighQualityDrill({ratingPct:100}),true);
});
test('CSV distinguishes numeric scores from historical labels',()=>{
 const state={records:[
  {created_at:new Date().toISOString(),kind:'drill',payload:{drillId:'a',key:'C',bpm:70,ratingPct:0}},
  {created_at:new Date().toISOString(),kind:'drill',payload:{drillId:'b',key:'C',bpm:80,rating:'clean'}}
 ]};
 const csv=exportCsv(state);
 assert.match(csv,/rating_percent/);
 assert.match(csv,/"0"/);
 assert.match(csv,/"clean"/);
 assert.doesNotMatch(csv,/ratingPct/);
});
test('weekly report separates legacy ratings from numeric ratings',()=>{
 const now=new Date().toISOString(),mk=p=>({created_at:now,kind:'drill',payload:{drillId:'picking-reset',key:'C',bpm:70,subdivision:'quarter',...p}});
 const report=weeklyReport({records:[mk({ratingPct:80}),mk({ratingPct:100}),mk({rating:'almost'})]});
 assert.match(report,/90% average across 2 rated drills/);
 assert.match(report,/Historical 3-level ratings \(not converted into percentages\)/);
 assert.match(report,/mostly clean 1/);
});
test('releases are synchronized with package version',()=>{
 assert.equal(APP_VERSION,'1.2.0');
 assert.equal(RELEASE_NOTES[0].version,APP_VERSION);
 assert.ok(RELEASE_NOTES.length>=2);
});
