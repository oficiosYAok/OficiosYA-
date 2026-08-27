
/* Service Worker — Oficios YA! PWA + Firebase Cloud Messaging */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
importScripts('./firebase-sw-config.js');

const CACHE_NAME = 'oficiosya-v20';
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
      const data = Object.assign({}, payload.data || {});
      if (payload.notification) {
        if (!data.title) data.title = payload.notification.title || '';
        if (!data.body) data.body = payload.notification.body || '';
      }

      // Si FCM ya mostró el aviso del sistema, NO duplicar.
      // (en iOS el data igual viaja en el push para el click cuando está disponible)
      if (payload.notification && payload.notification.title) {
        console.log('FCM system notification, skip SW duplicate', data);
        return;
      }

      const title = data.title || 'Oficios YA!';
      const body = data.body || 'Tenés una nueva notificación';
      let tag = data.tag || 'oficiosya';
      if (data.quoteId) tag = 'quote-' + data.quoteId;
      else if (data.reviewId) tag = 'review-' + data.reviewId;

      return self.registration.showNotification(title, {
        body: body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        data: data,
        tag: tag,
        renotify: false
      });
    });

  }
} catch (err) {
  console.warn('FCM SW:', err);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const d = event.notification.data || {};

  let tipo = d.tipo || '';
  let quoteId = d.quoteId || '';
  let reviewId = d.reviewId || '';

  // Hash de la app
  let hash = '#notifications';
  if (tipo === 'presupuesto' && quoteId) {
    hash = '#notif/presupuesto/' + encodeURIComponent(quoteId);
  } else if ((tipo === 'resena' || tipo === 'reseña') && reviewId) {
    hash = '#notif/resena/' + encodeURIComponent(reviewId);
  } else if (d.url && String(d.url).indexOf('#') >= 0) {
    hash = '#' + String(d.url).split('#').pop();
  }

  // Query extra (más fiable en algunos móviles al abrir de cero)
  let query = '';
  if (tipo === 'presupuesto' && quoteId) {
    query = '?open=presupuesto&id=' + encodeURIComponent(quoteId);
  } else if ((tipo === 'resena' || tipo === 'reseña') && reviewId) {
    query = '?open=resena&id=' + encodeURIComponent(reviewId);
  }

  const scope = self.registration.scope.replace(/\/?$/, '/');
  const targetUrl = scope + 'index.html' + query + hash;

  const payload = {
    type: 'OPEN_NOTIF',
    url: hash,
    tipo: tipo,
    quoteId: quoteId,
    reviewId: reviewId
  };

  event.waitUntil((async () => {
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    let client = null;
    for (const c of list) {
      if (c.url && c.url.indexOf(self.location.origin) === 0) {
        client = c;
        break;
      }
    }
    if (client) {
      await client.focus();
      try { client.postMessage(payload); } catch (e) {}
      try {
        if (client.navigate) await client.navigate(targetUrl);
      } catch (e2) {}
      return;
    }
    if (clients.openWindow) {
      await clients.openWindow(targetUrl);
    }
  })());
});
