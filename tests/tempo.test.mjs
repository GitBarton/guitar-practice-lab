import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');

test('tempo +/- updates BPM without stopping a running metronome',()=>{
 const begin=app.indexOf('function changeTempo(n){');
 const end=app.indexOf('\nfunction pauseTimer()',begin);
 assert.ok(begin>=0&&end>begin,'changeTempo handler must exist');
 const handler=app.slice(begin,end);
 assert.match(handler,/state\.settings\.defaultBpm=bpm/);
 assert.match(handler,/saveState\(state\)/);
 assert.match(handler,/render\(\)/);
 assert.doesNotMatch(handler,/metronome\.stop\(/);
});

test('metronome scheduler reads the current tempo for subsequent beats',()=>{
 const begin=app.indexOf('schedule(){');
 const end=app.indexOf('\n stop(){',begin);
 assert.ok(begin>=0&&end>begin,'metronome scheduler must exist');
 assert.match(app.slice(begin,end),/state\.settings\.defaultBpm/);
});
