**
 * Cloud Functions — Oficios YA!
 * Notificaciones in-app + Push (FCM) con deep link
 * Región: southamerica-east1
 * Version: 2026-08-26-deeplink-v4
 */

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const regional = functions.region("southamerica-east1");

// URL pública de la app SIN barra final (mejorá el click en iPhone).
// Ej: "https://tuusuario.github.io/OficiosYA--main"
// o "https://oficiosya-18909.web.app"
const APP_PUBLIC_URL = https:/oficiosyaok.github.io/OficiosYA-/#home;

async function enviarPushAlUsuario(userId, title, body, data) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      console.log("Usuario no existe", userId);
      return { ok: false, reason: "no-user" };
    }
    const tokens = (userDoc.data().fcmTokens || []).filter(Boolean);
    if (!tokens.length) {
      console.log("Sin tokens FCM para", userId);
      return { ok: false, reason: "no-tokens" };
    }

    const tipo = (data && data.tipo) || "notif";
    const quoteId = (data && data.quoteId) || "";
    const reviewId = (data && data.reviewId) || "";
    // Solo hash (sin "/"): el SW arma la URL con el scope real (GitHub Pages /repo/)
    let deepPath = "#notifications";
    if (tipo === "presupuesto" && quoteId) {
      deepPath = "#notif/presupuesto/" + encodeURIComponent(quoteId);
    } else if (tipo === "resena" && reviewId) {
      deepPath = "#notif/resena/" + encodeURIComponent(reviewId);
    }

    let tag = String((data && data.tag) || tipo || "oficiosya");
    if (quoteId) tag = "quote-" + quoteId;
    else if (reviewId) tag = "review-" + reviewId;

    const dataPayload = {
      title: String(title || "Oficios YA!"),
      body: String(body || ""),
      url: deepPath,
      tipo: String(tipo),
      quoteId: String(quoteId),
      reviewId: String(reviewId),
      tag: tag,
    };

    // notification + data: mejor entrega en iPhone (data-only a veces no llega
    // con la app cerrada). El SW no vuelve a mostrar si ya hay notification.
    const message = {
      tokens: tokens,
      notification: {
        title: String(title || "Oficios YA!"),
        body: String(body || ""),
      },
      data: dataPayload,
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          title: String(title || "Oficios YA!"),
          body: String(body || ""),
          icon: "icon-192.png",
          badge: "icon-192.png",
          tag: tag,
          data: dataPayload,
        },
        fcmOptions: APP_PUBLIC_URL
          ? {
              link:
                APP_PUBLIC_URL.replace(/\/$/, "") +
                "/index.html" +
                (tipo === "presupuesto" && quoteId
                  ? "?open=presupuesto&id=" + encodeURIComponent(quoteId)
                  : tipo === "resena" && reviewId
                    ? "?open=resena&id=" + encodeURIComponent(reviewId)
                    : "") +
                deepPath,
            }
          : undefined,
      },
    };

    const res = await admin.messaging().sendEachForMulticast(message);
    console.log(
      "Push user=" +
        userId +
        " success=" +
        res.successCount +
        " fail=" +
        res.failureCount +
        " path=" +
        deepPath
    );
    res.responses.forEach((r, i) => {
      if (!r.success) {
        console.error(
          "Token fail",
          tokens[i],
          r.error && r.error.code,
          r.error && r.error.message
        );
      }
    });

    const invalid = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error && r.error.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          invalid.push(tokens[i]);
        }
      }
    });
    if (invalid.length) {
      console.log("Limpiando tokens inválidos:", invalid.length);
      try {
        await db.collection("users").doc(userId).update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalid),
        });
      } catch (e) {
        console.warn("No se pudieron limpiar tokens:", e);
      }
    }

    return {
      ok: res.successCount > 0,
      successCount: res.successCount,
      failureCount: res.failureCount,
    };
  } catch (err) {
    console.error("enviarPushAlUsuario", err);
    return { ok: false, reason: String(err && err.message) };
  }
}

exports.onReviewCreated = regional.firestore
  .document("reviews/{reviewId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.profId) return null;

    const reviewId = context.params.reviewId;
    const nombre = data.clienteNombre || "Un cliente";
    const mensaje = nombre + " te dejó una reseña y valoración.";
    const detalle =
      "Calidad: " +
      (data.calidad || 0) +
      "★ · Tiempo: " +
      (data.tiempo || 0) +
      "★ · Precio: " +
      (data.precio || 0) +
      "★";

    await db.collection("notifications").add({
      userId: data.profId,
      tipo: "resena",
      mensaje,
      detalle,
      reviewId: reviewId,
      fecha: new Date().toISOString(),
      read: false,
      source: "cloud-function",
    });

    await enviarPushAlUsuario(
      data.profId,
      "Nueva reseña — Oficios YA!",
      mensaje,
      { tipo: "resena", tag: "resena", reviewId: reviewId }
    );
    return null;
  });

exports.onQuoteCreated = regional.firestore
  .document("quotes/{quoteId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.profId) return null;

    const quoteId = context.params.quoteId;
    const nombre = data.clienteNombre || "Un cliente";
    const urgencia = data.urgencia || "Normal";
    const mensaje =
      nombre + " te solicitó un presupuesto (" + urgencia + ").";
    const detalle = (data.descripcion || "").substring(0, 120);

    await db.collection("notifications").add({
      userId: data.profId,
      tipo: "presupuesto",
      mensaje,
      detalle,
      quoteId: quoteId,
      fecha: new Date().toISOString(),
      read: false,
      source: "cloud-function",
    });

    await enviarPushAlUsuario(
      data.profId,
      "Nuevo presupuesto — Oficios YA!",
      mensaje,
      { tipo: "presupuesto", tag: "presupuesto", quoteId: quoteId }
    );
    return null;
  });

exports.testPush = regional.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Debés iniciar sesión"
    );
  }
  const uid = context.auth.uid;
  const result = await enviarPushAlUsuario(
    uid,
    "Prueba — Oficios YA!",
    "Si ves este aviso, las notificaciones push están funcionando.",
    { tipo: "test", tag: "test" }
  );
  if (!result.ok) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      result.reason === "no-tokens"
        ? "No hay tokens FCM en tu usuario. Activá push en la app primero."
        : "No se pudo enviar: " + (result.reason || "error")
    );
  }
  return result;
});

// FORCE_DEPLOY_MARKER deeplink-v4
