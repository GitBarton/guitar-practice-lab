import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS,DRILL_BY_ID} from '../data.js';
import {MODAL_CHALLENGES,modalChallenge} from '../modal-improv.js';
import {scaleFor} from '../theory-lab.js';
const opens=[64,59,55,50,45,40];
for(const key of KEYS)for(const challenge of MODAL_CHALLENGES)test(key+' '+challenge.id+' modal targets',()=>{
 const result=modalChallenge(challenge.id,key),scale=scaleFor(challenge.id,key);
 assert.equal(result.notes.length,challenge.targets.length);
 for(const n of result.notes){assert.equal(opens[n.string]+n.fret,n.midi);assert.ok(n.fret>=0&&n.fret<=22);assert.ok(scale.pitchClasses.includes(n.pc));}
});
test('dynamic mode curriculum retains 2-min per stage structure',()=>{
 const d=DRILL_BY_ID['jazz-modal-color-targets'];assert.equal(d.minutes,12);assert.equal(d.stages.length,6);
 assert.ok(d.stages.every(s=>s.exampleKind.startsWith('modal-target-')));
});
