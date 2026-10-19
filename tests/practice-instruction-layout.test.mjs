import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
test('active exercise instructions precede coaching and notation in the practice template',()=>{
 const section=app.slice(app.indexOf('function renderPractice()'),app.indexOf('function renderEndSession()'));
 const guide=section.indexOf('id="practice-instructions"');
 assert.ok(guide>=0);
 assert.ok(section.indexOf('${stageBar}')<guide);
 assert.ok(section.indexOf('${coachPanel}',guide)>guide);
 assert.ok(section.indexOf('${diagram}',guide)>guide);
 assert.ok(section.includes('aria-label="Current exercise instructions"'));
});
test('compact instructions have mobile-responsive layout',()=>{
 assert.match(css,/\.practice-diagram>\.practice-instructions/);
 assert.match(css,/@media\(max-width:770px\)/);
});
