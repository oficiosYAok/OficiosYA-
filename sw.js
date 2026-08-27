
/* Service Worker — Oficios YA! PWA + Firebase Cloud Messaging */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
importScripts('./firebase-sw-config.js');

const CACHE_NAME = 'oficiosya-v21';
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


/* ===== Deep link pendiente (iOS a veces abre sin data en el click) ===== */
const PENDING_CACHE = 'oficiosya-pending-v1';
const PENDING_URL = '/__pending_notif__';

async function savePendingNotif(data) {
  try {
    const cache = await caches.open(PENDING_CACHE);
    const body = JSON.stringify({
      tipo: data.tipo || '',
      quoteId: data.quoteId || '',
      reviewId: data.reviewId || '',
      url: data.url || '',
      ts: Date.now()
    });
    await cache.put(PENDING_URL, new Response(body, {
      headers: { 'Content-Type': 'application/json' }
    }));
  } catch (e) {
    console.warn('savePendingNotif', e);
  }
}

async function readPendingNotif() {
  try {
    const cache = await caches.open(PENDING_CACHE);
    const res = await cache.match(PENDING_URL);
    if (!res) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function clearPendingNotif() {
  try {
    const cache = await caches.open(PENDING_CACHE);
    await cache.delete(PENDING_URL);
  } catch (e) {}
}

function buildNotifTarget(d) {
  const tipo = (d && d.tipo) || '';
  const quoteId = (d && d.quoteId) || '';
  const reviewId = (d && d.reviewId) || '';
  let hash = '#notifications';
  let query = '';
  if (tipo === 'presupuesto' && quoteId) {
    hash = '#notif/presupuesto/' + encodeURIComponent(quoteId);
    query = '?open=presupuesto&id=' + encodeURIComponent(quoteId);
  } else if ((tipo === 'resena' || tipo === 'reseña') && reviewId) {
    hash = '#notif/resena/' + encodeURIComponent(reviewId);
    query = '?open=resena&id=' + encodeURIComponent(reviewId);
  } else if (d && d.url && String(d.url).indexOf('#') >= 0) {
    hash = '#' + String(d.url).split('#').pop();
  }
  const scope = self.registration.scope.replace(/\/?$/, '/');
  return {
    hash: hash,
    targetUrl: scope + 'index.html' + query + hash,
    tipo: tipo,
    quoteId: quoteId,
    reviewId: reviewId
  };
}

try {
  const cfg = self.__FIREBASE_CONFIG__;
  if (cfg && cfg.apiKey && cfg.apiKey !== 'TU_API_KEY') {
    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(async (payload) => {
      const data = Object.assign({}, payload.data || {});
      if (payload.notification) {
        if (!data.title) data.title = payload.notification.title || '';
        if (!data.body) data.body = payload.notification.body || '';
      }

      // Guardar siempre el destino (iOS suele abrir sin data en el click)
      await savePendingNotif(data);

      const title = data.title || (payload.notification && payload.notification.title) || 'Oficios YA!';
      const body = data.body || (payload.notification && payload.notification.body) || 'Tenés una nueva notificación';
      let tag = data.tag || 'oficiosya';
      if (data.quoteId) tag = 'quote-' + data.quoteId;
      else if (data.reviewId) tag = 'review-' + data.reviewId;

      // Si el sistema YA muestra notification, no duplicar
      if (payload.notification && payload.notification.title) {
        return;
      }

      await self.registration.showNotification(title, {
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
  event.waitUntil((async () => {
    let d = event.notification.data || {};
    // iOS: data vacío → usar pending guardado al recibir el push
    if (!d.quoteId && !d.reviewId && !d.tipo) {
      const pending = await readPendingNotif();
      if (pending) d = pending;
    }
    await clearPendingNotif();

    const built = buildNotifTarget(d);
    const payload = {
      type: 'OPEN_NOTIF',
      url: built.hash,
      tipo: built.tipo,
      quoteId: built.quoteId,
      reviewId: built.reviewId
    };

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
        if (client.navigate) await client.navigate(built.targetUrl);
      } catch (e2) {}
      return;
    }
    if (clients.openWindow) {
      await clients.openWindow(built.targetUrl);
    }
  })());
});

// La página pide el deep link pendiente (arranque en frío en iPhone)
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'POP_PENDING_NOTIF') {
    event.waitUntil((async () => {
      const pending = await readPendingNotif();
      if (pending) await clearPendingNotif();
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ type: 'PENDING_NOTIF', pending: pending });
      } else if (event.source && event.source.postMessage) {
        event.source.postMessage({ type: 'PENDING_NOTIF', pending: pending });
      }
    })());
  }
});
