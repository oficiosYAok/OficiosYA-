// ============================================================
// CONFIGURACIÓN DE FIREBASE - Oficios YA!
// ============================================================
// 1. Entrá a https://console.firebase.google.com
// 2. Creá un proyecto (o usá uno existente)
// 3. Agregá una app Web (+) y copiá la configuración
// 4. Pegá acá abajo los valores de firebaseConfig
// 5. Activá Authentication → Email/Password
// 6. Creá Firestore Database (modo producción o prueba)
// 7. Activá Storage
// 8. Publicá las reglas indicadas en FIREBASE_SETUP.md
// ============================================================

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Clave Web Push (VAPID) — Firebase Console → Project settings → Cloud Messaging → Web Push certificates
const firebaseVapidKey = "BHfYjzPTtMXSGUQMPKQwRi4fqjPN2j7QTFPs_w8rIApEQEhNbeNi0abJAyNLmYTAw2y3BRoFzXXf4A57tckft7U";

// Inicialización (no modificar)
let app, auth, db, storage, messaging;
let firebaseReady = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY") {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    try {
      if (firebase.messaging.isSupported && firebase.messaging.isSupported()) {
        messaging = firebase.messaging();
      }
    } catch (mErr) {
      console.warn("Messaging no disponible en este navegador:", mErr);
    }
    firebaseReady = true;
    console.log("Firebase inicializado correctamente");
  } else {
    console.warn("Firebase no configurado. Completá firebase-config.js con tus credenciales.");
  }
} catch (err) {
  console.error("Error al inicializar Firebase:", err);
  firebaseReady = false;
}
