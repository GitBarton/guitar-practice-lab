const CACHE='gpl-app-v1.2.0-rhythm-integrated-20261017';
const ASSETS=['./rhythm-variations.js','./practice-coach.js','./reference-studies.js','./staff-notation.js','./vocabulary.js','./manual-songs.js','./modal-harmony.js','./mode-positions.js','./reference-patterns.js','./','./index.html','./styles.css','./app.js','./data.js','./music.js','./song-audio.js','./reference-pitch.js','./storage.js','./config.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./harmony.js','./theory-lab.js','./backing-audio.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}return response;}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
});
