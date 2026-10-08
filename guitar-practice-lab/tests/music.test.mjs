import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNotePath,INTERVALS,renderTabSvg,renderFretboardSvg,shellShapes,progressionFor,keyPc,buildExample} from '../music.js';
import {makeSession,KEYS,DRILLS,SONGS} from '../data.js';
test('twelve keys in cycle of fourths',()=>{assert.deepEqual(KEYS,['C','F','Bb','Eb','Ab','Db','Gb','B','E','A','D','G']);for(let i=0;i<12;i++)assert.equal(makeSession(i).key,KEYS[i]);});
test('chord formulas',()=>{assert.deepEqual(INTERVALS.maj7,[0,4,7,11]);assert.deepEqual(INTERVALS.m7b5,[0,3,6,10]);assert.deepEqual(INTERVALS.dim7,[0,3,6,9]);assert.deepEqual(INTERVALS.aug,[0,4,8]);assert.deepEqual(INTERVALS.dim,[0,3,6]);});
test('2 octaves end two octaves above root and have valid fret positions',()=>{for(const key of KEYS)for(const q of ['major','minor','dim','maj7','m7','7','m7b5','dim7','aug','pentMajor','pentMinor']){const path=buildNotePath(key,q,2);assert.equal(path.length,INTERVALS[q].length*2+1,key+' '+q);assert.equal(path.at(-1).midi-path[0].midi,24);for(const n of path){assert.ok(n.fret>=0&&n.fret<=22,key+' '+q);assert.ok(n.string>=0&&n.string<=5);}}});
test('3 octave paths span 36 semitones and playable standard guitar range',()=>{for(const k of KEYS)for(const q of ['major','minor']){const path=buildNotePath(k,q,3);if(k==='Eb'){assert.equal(path.length,0,'Eb cannot span 3 octaves on a 22-fret standard guitar');continue;}assert.equal(path.length,10,k+' '+q);assert.equal(path.at(-1).midi-path[0].midi,36);}});
test('svg produces accessible diagrams',()=>{const notes=buildNotePath('C','maj7',2);assert.match(renderTabSvg(notes),/<svg/);assert.match(renderTabSvg(notes),/aria-label=/);assert.match(renderFretboardSvg(notes),/<circle/);});
test('ii-V-I chord-name basics',()=>{assert.deepEqual(progressionFor('C').map(c=>c.name),['Dm7','G7','Cmaj7']);assert.equal(shellShapes('C')[0].shape[1],5);assert.equal(keyPc('Bb'),10);});
test('45-minute session shape and repertoire catalogue',()=>{for(const mode of ['technique','repertoire']){const s=makeSession(3,mode);assert.equal(s.entries.reduce((n,x)=>n+x.minutes,0),45);assert.ok(s.entries.every(x=>x.id==='song'||DRILLS.find(d=>d.id===x.id)));}assert.equal(SONGS.length,8);});

test('dominant bebop fragment places chord tones on even indexes',()=>{const seq=buildExample('barry','C');assert.equal(seq.length,9);assert.deepEqual(seq.filter((_,i)=>i%2===0).map(n=>n.pc),[7,5,2,11,7]);});
