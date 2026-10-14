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

test('drill library categories use accessible clickable pills without removing existing search',()=>{
 assert.match(app,/function renderDrills\(\)/);
 assert.match(app,/data-action="drill-filter:/);
 assert.match(app,/aria-pressed=/);
 assert.match(app,/role="group" aria-label="Filter drills by category"/);
 assert.match(app,/categoryCount\(id\)/);
 assert.match(app,/function setDrillCategory\(category\)/);
 assert.match(app,/function filterDrills\(\)/);
 assert.match(app,/selectedDrillCategory/);
 assert.match(app,/drillSearchText/);
 assert.match(app,/if\(visible\)count\+\+/);
 assert.match(app,/drill-filter-empty/);
 assert.match(app,/drill-filter-result/);
 assert.match(app,/if\(r.page==='drills'\)filterDrills\(\)/);
 assert.doesNotMatch(app,/<select id="drill-category"/);
 assert.match(css,/\.drill-filter-pill\.active/);
 assert.match(css,/\.drill-filter-pills\{display:flex/);
});
test('new pill design preserves all existing drill categories and search wiring',()=>{
 const data=readFileSync(new URL('../data.js',import.meta.url),'utf8');
 for(const category of ['picking','muting','arpeggio','pentatonic','jazz','comping','ear'])
  assert.match(data,new RegExp("\\['"+category+"'"));
 assert.match(app,/if\(name\?\.startsWith\('drill-filter:'\)\)/);
 assert.match(app,/if\(ev.target.id==='drill-search'\)/);
 assert.match(app,/data-search=/);
 assert.match(app,/data-category=/);
});

test('practice keyboard shortcuts are scoped and do not hijack form editing or native controls',()=>{
 const shortcut=app.split('function handlePracticeShortcut(ev){')[1].split("document.addEventListener('keydown',handlePracticeShortcut);")[0];
 assert.ok(shortcut,'shortcut handler exists');
 assert.match(shortcut,/route\(\)\.page!=='practice'/);
 assert.match(shortcut,/!state\.active/);
 assert.match(shortcut,/!currentDrill\(\)/);
 assert.match(shortcut,/showRating/);
 assert.match(shortcut,/ev\.defaultPrevented/);
 for(const key of ['altKey','ctrlKey','metaKey','shiftKey','isComposing'])assert.ok(shortcut.includes(key),key+' must be guarded');
 assert.match(shortcut,/input,textarea,select,button,a,\[contenteditable\]/);
 assert.match(shortcut,/\[role="textbox"\]/);
 assert.match(shortcut,/\[role="slider"\]/);
 assert.match(shortcut,/ev\.key===' '/);
 assert.match(shortcut,/ev\.code==='Space'/);
 assert.match(shortcut,/ev\.key==='ArrowUp'/);
 assert.match(shortcut,/ev\.key==='ArrowDown'/);
 assert.match(shortcut,/ev\.key==='Enter'/);
 assert.match(shortcut,/toggleTimer\(\)/);
 assert.match(shortcut,/changeTempo\(ev\.key==='ArrowUp'\?5:-5\)/);
 assert.match(shortcut,/stageCount\(drill\)<1/);
 assert.match(shortcut,/movePracticeStage\(1\)/);
 assert.doesNotMatch(shortcut,/metronome\.stop\(\)/);
});
test('practice UI shows keyboard hints and respects stages for Enter',()=>{
 assert.match(app,/practice-shortcuts/);
 assert.match(app,/<kbd>Space<\/kbd>/);
 assert.match(app,/<kbd>↑<\/kbd>\/\<kbd>↓<\/kbd>/);
 assert.match(app,/<kbd>Enter<\/kbd> Next stage/);
 assert.match(css,/\.practice-shortcuts/);
});

test('Home offers selectable 7/14/30-day history, detailed exercise logs and real practice statistics',()=>{
 assert.match(app,/import \{buildPracticeDashboard,DASHBOARD_RANGES\} from '\.\/dashboard\.js'/);
 assert.match(app,/function renderHomeDashboard\(\)/);
 assert.match(app,/buildPracticeDashboard\(state\.records,new Date\(\),selectedHomeRange\)/);
 assert.match(app,/data-action="home-range:/);
 assert.match(app,/data-action="home-day:/);
 assert.match(app,/aria-pressed=/);
 assert.match(app,/aria-live="polite"/);
 assert.match(app,/home-days-chart/);
 assert.match(app,/home-day-details/);
 assert.match(app,/home-focus-line/);
 assert.match(app,/home-week-stat/);
 assert.match(app,/renderHomeDashboard\(\)/);
 assert.match(css,/\.home-dashboard-grid/);
 assert.match(css,/\.home-day-bar-track/);
 assert.match(css,/\.home-days-scroller\{overflow-x:auto/);
 assert.match(css,/\.home-kpis/);
});
test('Home dashboard uses real historical records and no external data API',()=>{
 const source=readFileSync(new URL('../dashboard.js',import.meta.url),'utf8');
 assert.match(source,/records=\[\]/);
 assert.match(source,/validRatingPercent/);
 assert.match(source,/fullPracticeDays/);
 assert.match(source,/sessionsWithTimedDrills/);
 assert.match(source,/localDayKey/);
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|localStorage\./);
 assert.match(sw,/'\.\/dashboard\.js'/);
});
