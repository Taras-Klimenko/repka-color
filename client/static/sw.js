const CACHE_VERSION = 'v0.0.0.8';
const CACHE_NAME = `brush-${CACHE_VERSION}`;
const urlsToCache = ['/', '/favicon.png'];

// Install event - cache resources
self.addEventListener('install', (event) => {
	console.log('Installing new service worker version:', CACHE_VERSION);
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return Promise.allSettled(
				urlsToCache.map((url) =>
					cache.add(url).catch((error) => {
						console.warn(`Failed to cache ${url}:`, error);
					})
				)
			);
		})
	);
	// Force activation of new service worker
	self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches
			.match(event.request)
			.then((response) => {
				// Return cached version or fetch from network
				return response || fetch(event.request);
			})
			.catch(() => {
				// Return offline page if both cache and network fail
				if (event.request.destination === 'document') {
					return caches.match('/offline');
				}
			})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	console.log('Activating new service worker version:', CACHE_VERSION);
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log('Deleting old Brush cache:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	// Take control immediately
	event.waitUntil(self.clients.claim());
});
