import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS,DRILL_BY_ID} from '../data.js';
import {referenceDominant7} from '../reference-patterns.js';
const opens=[64,59,55,50,45,40];
test('dominant route stages alternate E and A root locations',()=>{
 const stages=DRILL_BY_ID['arp-dom7'].stages;
 assert.deepEqual(stages.map(s=>s.rootString),['E','A','A']);
 assert.ok(stages.every(s=>s.instructions.length>=2));
});
for(const key of KEYS)for(const root of ['E','A'])test(`${key} dominant route with ${root} root has correct pitch and sequence`,()=>{
 const route=referenceDominant7(key,root);
 assert.equal(route.notes.length,9);
 assert.deepEqual(route.notes.map(n=>n.interval),['1','3','5','♭7','1','3','5','♭7','1']);
 for(const n of route.notes){assert.equal(opens[n.string]+n.fret,n.midi);assert.ok(n.fret>=0&&n.fret<=22);}
 assert.ok(route.notes.every((n,i,a)=>!i||n.midi>a[i-1].midi));
});
