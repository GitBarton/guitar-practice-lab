import test from 'node:test';
import assert from 'node:assert/strict';

test('full app boots the minor zone and real DOM handlers preserve and save a lesson draft',async t=>{
 // Minimal DOM adapter, not a browser/layout or listening test. Import the real app and all its modules.
 const listeners={document:new Map(),window:new Map()},elements=new Map(),stored=new Map();
 const listen=(area,type,fn)=>{const list=listeners[area].get(type)||[];list.push(fn);listeners[area].set(type,list);};
 function element(){let html='';return {dataset:{},value:'',textContent:'',classList:{toggle(){}},
  set innerHTML(value){html=value;for(const [,id] of value.matchAll(/id="([^"]+)"/g))if(!elements.has(id))elements.set(id,element());},get innerHTML(){return html;}};}
 const app=element();elements.set('app',app);
 stored.set('guitar-practice-lab-v1',JSON.stringify({records:[{id:'old',kind:'drill',created_at:'2026-10-21T10:00:00Z',payload:{drillId:'picking-reset'}}],settings:{harmony:{key:'C',mode:'minor'}}}));
 const values={window:{GPL_CONFIG:{},addEventListener:(type,fn)=>listen('window',type,fn)},
  document:{body:{dataset:{}},getElementById:id=>elements.get(id)||null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(type,fn)=>listen('document',type,fn)},
  location:{hash:'#harmony',protocol:'http:'},navigator:{},
  localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)}};
 for(const [name,value] of Object.entries(values)){
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,name);
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
  t.after(()=>descriptor?Object.defineProperty(globalThis,name,descriptor):delete globalThis[name]);
 }
 t.mock.method(globalThis,'setInterval',()=>1);t.mock.method(globalThis,'clearInterval',()=>{});
 t.mock.method(globalThis,'setTimeout',()=>1);t.mock.method(globalThis,'clearTimeout',()=>{});
 await import('../app.js?reactive-zone-bootstrap');
 assert.match(app.innerHTML,/ii–V–I Practice Zone/);assert.match(app.innerHTML,/Cm6/);assert.match(app.innerHTML,/Reactive harmony lesson/);
 const fire=async(type,target)=>{for(const fn of listeners.document.get(type)||[])await fn({target,preventDefault(){}});};
 await fire('change',{dataset:{harmonySetting:'focus'},value:'guide'});
 await fire('input',{id:'harmony-notes',value:'Keep this draft'});
 await fire('input',{id:'harmony-next-focus',value:'Minor-third resolution'});
 await fire('input',{id:'harmony-score',value:'90'});
 const click=action=>fire('click',{closest:()=>({dataset:{action}})});
 await click('harmony-preview-next');assert.match(elements.get('harmony-lesson-target').innerHTML,/G7♭9/);
 await click('harmony-preview-next');assert.match(elements.get('harmony-lesson-target').innerHTML,/no seventh/);
 await click('harmony-challenge');await click('harmony-repeat-focus');
 elements.get('harmony-score').value='90';elements.get('harmony-notes').value='Keep this draft';
 await click('harmony-log');
 const state=JSON.parse(stored.get('guitar-practice-lab-v1')),record=state.records.at(-1).payload;
 assert.equal(state.records[0].id,'old');assert.equal(record.notes,'Keep this draft');
 assert.equal(record.focus,'guide');assert.equal(record.harmonyMode,'minor');assert.equal(record.ratingPct,90);
 assert.equal(record.nextFocus,'Minor-third resolution');
 for(const route of ['#today','#drills','#harmony']){
  values.location.hash=route;for(const fn of listeners.window.get('hashchange'))fn();
  assert.ok(app.innerHTML.includes('<main'));
 }
});
