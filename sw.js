/* Service Worker — Oficios YA! PWA + Firebase Cloud Messaging */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
importScripts('./firebase-sw-config.js');

const CACHE_NAME = 'oficiosya-v13';
const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './firebase-config.js',
  './firebase-sw-config.js',
  './manifest.webmanifest',
  './logo.jpg',
  './icon-192.png',
  './icon-512.png',
  './oficio-plomeria.jpg',
  './oficio-gasista.jpg',
  './oficio-electricista.jpg',
  './oficio-pintor.jpg',
  './oficio-albanil.jpg',
  './oficio-carpintero.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('firestore.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});

try {
  const cfg = self.__FIREBASE_CONFIG__;
  if (cfg && cfg.apiKey && cfg.apiKey !== 'TU_API_KEY') {
    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title =
        (payload.notification && payload.notification.title) ||
        (payload.data && payload.data.title) ||
        'Oficios YA!';
      const body =
        (payload.notification && payload.notification.body) ||
        (payload.data && payload.data.body) ||
        'Tenés una nueva notificación';
      const options = {
        body: body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        data: payload.data || {},
        tag: (payload.data && payload.data.tag) || 'oficiosya',
        renotify: true
      };
      return self.registration.showNotification(title, options);
    });
  }
} catch (err) {
  console.warn('FCM SW:', err);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './#notifications';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus();
          if (client.navigate) client.navigate(target);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
