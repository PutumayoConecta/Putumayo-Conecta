// service-worker.js

const CACHE_NAME = 'putumayo-conecta-v6';
const DYNAMIC_CACHE_NAME = 'putumayo-conecta-dynamic-v6';

// Recursos que se almacenarán en caché al instalar el service worker
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    '/images/selva2.jpg',
    '/images/icon-192x192.png',
    '/images/logo.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&display=swap'
];

// Evento 'install': se ejecuta cuando el service worker se instala
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

// Función para limitar el tamaño del caché dinámico
function limitDynamicCache(cacheName, maxItems) {
    caches.open(cacheName).then(cache => {
        cache.keys().then(keys => {
            if (keys.length > maxItems) {
                cache.delete(keys[0]).then(() => limitDynamicCache(cacheName, maxItems));
            }
        });
    });
}

// Evento 'fetch': se ejecuta cada vez que el navegador hace una solicitud
self.addEventListener('fetch', event => {
    const requestUrl = event.request.url;

    // Manejar solicitudes a la API
    if (requestUrl.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    console.error('Error al obtener datos de la API:', requestUrl, error);
                    return new Response(JSON.stringify({ error: 'No se pudo conectar al servidor. Verifica tu conexión o intenta de nuevo más tarde.' }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
    }
    // Manejar solicitudes de imágenes, fuentes, CSS y JS
    else if (requestUrl.match(/\.(jpg|jpeg|png|gif|css|js|woff|woff2|ttf|eot|svg)$/)) {
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
                                    limitDynamicCache(DYNAMIC_CACHE_NAME, 50);
                                });
                            return networkResponse;
                        })
                        .catch(error => {
                            console.error('Error al obtener el recurso:', requestUrl, error);
                            if (requestUrl.match(/\.(jpg|jpeg|png|gif)$/)) {
                                return caches.match('/images/logo.png');
                            }
                            return new Response('Recurso no disponible offline', { status: 404 });
                        });
                })
        );
    }
    // Manejar otras solicitudes (como HTML)
    else {
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

// Evento 'activate': se ejecuta cuando el service worker se activa
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