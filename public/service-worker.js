const CACHE_NAME = 'putumayo-conecta-v5';
const DYNAMIC_CACHE_NAME = 'putumayo-conecta-dynamic-v5';

const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    '/images/selva2.jpg', // Confirmado en HTML y CSS
    '/images/icon-192x192.png', // Confirmado en HTML
    '/images/logo.png' // Confirmado en JS
    // Nota: Verifica si necesitas selva1.jpg, selva3.jpg, icon-512x512.png, wood-texture.jpg, vine-texture.png
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Abriendo caché:', CACHE_NAME);
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.error(`Error al almacenar en caché el recurso: ${url}`, error);
                            return Promise.resolve();
                        });
                    })
                );
            })
            .then(() => {
                console.log('Todos los recursos válidos fueron almacenados en caché');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Error al abrir el caché:', error);
            })
    );
});

function limitDynamicCache(cacheName, maxItems) {
    caches.open(cacheName).then(cache => {
        cache.keys().then(keys => {
            if (keys.length > maxItems) {
                cache.delete(keys[0]).then(() => limitDynamicCache(cacheName, maxItems));
            }
        });
    });
}

self.addEventListener('fetch', event => {
    const requestUrl = event.request.url;

    if (requestUrl.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    console.error('Error al obtener datos de la API:', requestUrl, error);
                    return new Response(JSON.stringify({ error: 'No se pudo conectar a la API' }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
    } else if (requestUrl.includes('/images/') && requestUrl.match(/\.(jpg|jpeg|png|gif)$/)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request)
                        .then(networkResponse => {
                            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                                return networkResponse;
                            }
                            const responseToCache = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                    limitDynamicCache(DYNAMIC_CACHE_NAME, 50); // Límite de 50 imágenes
                                });
                            return networkResponse;
                        })
                        .catch(error => {
                            console.error('Error al obtener la imagen:', requestUrl, error);
                            return caches.match('/images/logo.png'); // Imagen de fallback
                        });
                })
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
                .catch(error => {
                    console.error('Error al manejar la solicitud fetch:', error);
                    return caches.match('/index.html');
                })
        );
    }
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('Activación completada, caché limpia');
            return self.clients.claim();
        })
    );
});