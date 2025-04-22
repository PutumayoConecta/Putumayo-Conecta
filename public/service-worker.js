const CACHE_NAME = 'putumayo-conecta-v3';
const DYNAMIC_CACHE_NAME = 'putumayo-conecta-dynamic-v3';

const urlsToCache = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/styles.css',
    '/script.js',
    '/dashboard.js',              // Añadido para el dashboard
    '/manifest.json',             // Añadido para la PWA
    '/images/selva2.jpg',
    '/images/icon-192x192.png',   // Añadido para los íconos de la PWA
    '/images/icon-512x512.png',   // Añadido para los íconos de la PWA
    '/images/logo.png'            // Añadido para el logo
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

self.addEventListener('fetch', event => {
    const requestUrl = event.request.url;

    // Manejar imágenes dinámicamente (cache-first strategy)
    if (requestUrl.includes('/images/') && requestUrl.match(/\.(jpg|jpeg|png|gif)$/)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Si la imagen está en caché, devolverla
                    if (response) {
                        return response;
                    }
                    // Si no está en caché, obtenerla de la red y almacenarla
                    return fetch(event.request)
                        .then(networkResponse => {
                            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                                return networkResponse;
                            }
                            // Clonar la respuesta para almacenarla en caché
                            const responseToCache = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                            return networkResponse;
                        })
                        .catch(error => {
                            console.error('Error al obtener la imagen:', requestUrl, error);
                            // Opcional: devolver una imagen por defecto si falla
                        });
                })
        );
    } else {
        // Para otros recursos, usar cache-first strategy
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
                .catch(error => {
                    console.error('Error al manejar la solicitud fetch:', error);
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