
/* Service Worker — Oficios YA! PWA + Firebase Cloud Messaging */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
importScripts('./firebase-sw-config.js');

const CACHE_NAME = 'oficiosya-v18';
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
      // Si FCM ya trae "notification", el sistema muestra UNA sola.
      // No volver a llamar showNotification (evita el duplicado).
      if (payload.notification && payload.notification.title) {
        console.log('FCM: aviso del sistema (sin duplicar en SW)', payload.data);
        return;
      }

      // Solo mensajes data-only: los mostramos nosotros con deep link completo
      const data = Object.assign({}, payload.data || {});
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

  // Hash relativo (NO usar "/" al inicio: en GitHub Pages rompería el path del repo)
  let hash = '#notifications';
  if (d.tipo === 'presupuesto' && d.quoteId) {
    hash = '#notif/presupuesto/' + encodeURIComponent(d.quoteId);
  } else if ((d.tipo === 'resena' || d.tipo === 'reseña') && d.reviewId) {
    hash = '#notif/resena/' + encodeURIComponent(d.reviewId);
  } else if (d.url) {
    const u = String(d.url);
    if (u.indexOf('#') >= 0) hash = '#' + u.split('#').pop();
    else if (u.charAt(0) === '#') hash = u;
  }

  const scope = self.registration.scope; // ej: https://user.github.io/Repo/
  const targetUrl = scope.replace(/\/?$/, '/') + hash.replace(/^#/, '#');

  const payload = {
    type: 'OPEN_NOTIF',
    url: hash,
    tipo: d.tipo || '',
    quoteId: d.quoteId || '',
    reviewId: d.reviewId || ''
  };

  event.waitUntil((async () => {
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Preferir una ventana existente de este origen/scope
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
        const base = client.url.split('#')[0];
        if (client.navigate) await client.navigate(base + hash);
      } catch (e2) {
        // Si navigate falla, el postMessage igual debería abrir el detalle
      }
      return;
    }
    if (clients.openWindow) {
      await clients.openWindow(targetUrl);
    }
  })());
});
