/* Bump cache name when updating app scripts. Network-first keeps the latest config. */
const BX_CACHE='biznexa-v1_2-sheet-bound-20261117';
const BX_FILES=['./','./index.html','./login.html','./admin.html','./app.html','./card.html','./catalog.html','./invoice.html','./config.js','./shared.js','./style.css','./login.js','./admin.js','./client.js','./public.js','./invoice.js','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(BX_CACHE).then(c=>c.addAll(BX_FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==BX_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(BX_CACHE).then(cache=>cache.put(e.request,copy)).catch(()=>{});}return res}).catch(()=>caches.match(e.request)))});
