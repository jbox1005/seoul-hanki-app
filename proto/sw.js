/* AIBK 한끼 서비스 워커 — build-proto.js 가 a2c2af856f/data.ceb86d5cfc.json 을 채워 sw.js 로 낸다.
 * 껍데기(HTML·manifest·아이콘)는 버전별 캐시, 데이터(data.<해시>.json)는 해시로 캐시.
 * HTML 은 네트워크 우선(4초) → 캐시. 데이터는 캐시 우선. notices.json 등 나머지는 손대지 않는다. */
const VER = '__VER__';
const DATA_URL = '__DATA_URL__';
const BUILD = 'ceb86d5cfc';
const SHELL = 'aibk-shell-' + VER;
const DATAC = 'aibk-data';
const PRECACHE = ['lunch-proto.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL); await c.addAll(PRECACHE);
    const d = await caches.open(DATAC); if (!(await d.match(DATA_URL))) await d.add(DATA_URL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('aibk-shell-') && k !== SHELL) await caches.delete(k);
    const d = await caches.open(DATAC);
    for (const req of await d.keys()) if (!req.url.includes('.' + BUILD + '.json')) await d.delete(req);
    await self.clients.claim();
  })());
});

function withTimeout(p, ms) { return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), ms); p.then((v) => { clearTimeout(t); res(v); }, (e) => { clearTimeout(t); rej(e); }); }); }

self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const file = url.pathname.split('/').pop();
  if (/\.[0-9a-f]{10}\.json$/.test(decodeURIComponent(file))) {
    e.respondWith((async () => { const d = await caches.open(DATAC); const hit = await d.match(req); if (hit) return hit; const r = await fetch(req); if (r.ok) d.put(req, r.clone()); return r; })());
    return;
  }
  if (file === 'lunch-proto.html' || req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(SHELL);
      try { const r = await withTimeout(fetch(req), 4000); if (r.ok) c.put('lunch-proto.html', r.clone()); return r; }
      catch { return (await c.match('lunch-proto.html')) || Response.error(); }
    })());
    return;
  }
  if (PRECACHE.includes(file)) {
    e.respondWith((async () => { const c = await caches.open(SHELL); return (await c.match(req)) || fetch(req); })());
  }
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });
