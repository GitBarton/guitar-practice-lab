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
 assert.match(sw,/gpl-app-v1\.1\.0/);
});
