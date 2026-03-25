// 服务工作线程 - 用于离线支持和PWA功能

const CACHE_NAME = 'red-alert-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/config.js',
    '/js/utils.js',
    '/js/map.js',
    '/js/fog.js',
    '/js/building.js',
    '/js/unit.js',
    '/js/economy.js',
    '/js/ai.js',
    '/js/input.js',
    '/js/renderer.js',
    '/js/game.js',
    '/js/main.js',
    '/manifest.json'
];

// 安装时缓存资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// 拦截请求并从缓存中响应
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果缓存中有，返回缓存
                if (response) {
                    return response;
                }
                // 否则发起网络请求
                return fetch(event.request);
            })
    );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});
