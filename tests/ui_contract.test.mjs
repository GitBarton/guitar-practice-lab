import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
test('release notes are accessible through a dedicated route',()=>{
 assert.match(app,/case 'releases':html=renderReleases\(\)/);
 assert.match(app,/href="#releases"/);
 assert.match(app,/RELEASE_NOTES\.map/);
});
test('10 percent chips and bump buttons are wired for user interaction',()=>{
 assert.match(app,/Array\.from\(\{length:11\}/);
 assert.match(app,/data-rating-value=/);
 assert.match(app,/rating-decrement/);
 assert.match(app,/rating-increment/);
 assert.match(app,/rating-set:/);
 assert.match(app,/rating-save/);
 assert.doesNotMatch(app,/'rate-clean':/);
});
test('rating control and release timeline have responsive styles and changed offline cache',()=>{
 assert.match(css,/\.rating-scale/);
 assert.match(css,/\.release-timeline/);
 assert.match(css,/@media\(max-width:410px\)/);
 assert.match(sw,/gpl-app-v1\.2\.0/);
 assert.match(sw,/'\.\/song-audio\.js'/);
 assert.match(sw,/'\.\/backing-audio\.js'/);
 assert.match(sw,/'\.\/harmony\.js'/);
});

test('changing BPM keeps an active metronome running',()=>{
 const start=app.indexOf('function changeTempo(n){');
 assert.ok(start>=0,'changeTempo should exist');
 const changeTempo=app.slice(start,app.indexOf('function pauseTimer()',start));
 assert.match(changeTempo,/state\.settings\.defaultBpm=bpm/);
 assert.doesNotMatch(changeTempo,/metronome\.stop\(\)/);
 const schedulerStart=app.indexOf(' schedule(){');
 assert.ok(schedulerStart>=0,'metronome scheduler should exist');
 const schedule=app.slice(schedulerStart,app.indexOf(' stop(){',schedulerStart));
 assert.match(schedule,/state\.settings\.defaultBpm/,'audio scheduler must dynamically use updated BPM');
});

test('staged practice has navigation and does not stop the metronome or timer',()=>{
 assert.match(app,/stage-prev/);
 assert.match(app,/stage-next/);
 assert.match(app,/stage-panel/);
 assert.match(app,/entry\.stageIndex=next;diagramStep/);
 const action=app.split('function movePracticeStage(delta){')[1].split('const actions={')[0];
 assert.doesNotMatch(action,/metronome\.stop/);
 assert.doesNotMatch(action,/pauseTimer\(/);
 assert.doesNotMatch(action,/elapsedMs=0/);
});
