const CACHE_NAME = 'multi-lang-app-v1';
const ASSETS = [
'./',
'./index.html',
'./manifest.json',
'./icons/icon-192.png',
'./icons/icon-512.png',
'./styles.css',   // スタイルシート（存在する場合）
'./main.js'       // メインスクリプト（存在する場合）
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME) // 現在のバージョン以外のキャッシュを対象
            .map(key => caches.delete(key))     // 古いバージョンのキャッシュを削除
      )
    ).then(() => self.clients.claim()) // Service Workerの制御を新しいバージョンに移行
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // キャッシュに一致するレスポンスがあれば、それを返す
        }
        return fetch(event.request).then(
          fetchResponse => {
            // ネットワークからのレスポンスが有効か確認
            if(!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // 重要: レスポンスはストリームであり一度しか消費できないため、キャッシュ用とブラウザ表示用にクローンする
            const responseToCache = fetchResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          }
        );
      })
  );
});
