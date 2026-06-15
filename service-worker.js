// 🌳 情绪树洞 - Service Worker
const CACHE_NAME = 'treehole-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/post.html',
  '/wall.html',
  '/me.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// 安装
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 激活
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', event => {
  // API 请求不缓存，走网络
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      // 有缓存先用缓存，同时更新
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      
      return cached || fetchPromise;
    })
  );
});
