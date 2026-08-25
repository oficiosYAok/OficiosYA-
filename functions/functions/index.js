**
 * Cloud Functions — Oficios YA!
 * Notificaciones in-app + Push (FCM)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

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

    const dataPayload = {};
    const src = Object.assign(
      {
        title: String(title || "Oficios YA!"),
        body: String(body || ""),
        url: "/#notifications",
        click_action: "/#notifications",
      },
      data || {}
    );
    // FCM data values must be strings
    Object.keys(src).forEach((k) => {
      dataPayload[k] = String(src[k] == null ? "" : src[k]);
    });

    const message = {
      tokens: tokens,
      notification: {
        title: String(title || "Oficios YA!"),
        body: String(body || ""),
      },
      data: dataPayload,
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          title: String(title || "Oficios YA!"),
          body: String(body || ""),
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          requireInteraction: true,
        },
        fcmOptions: {
          link: "/#notifications",
        },
      },
    };

    const res = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `Push user=${userId} success=${res.successCount} fail=${res.failureCount}`
    );
    res.responses.forEach((r, i) => {
      if (!r.success) {
        console.error("Token fail", tokens[i], r.error && r.error.code, r.error && r.error.message);
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
      await db
        .collection("users")
        .doc(userId)
        .update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalid),
        });
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

exports.onReviewCreated = functions.firestore
  .document("reviews/{reviewId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.profId) return null;

    const nombre = data.clienteNombre || "Un cliente";
    const mensaje = `${nombre} te dejó una reseña y valoración.`;
    const detalle = `Calidad: ${data.calidad || 0}★ · Tiempo: ${data.tiempo || 0}★ · Precio: ${data.precio || 0}★`;

    await db.collection("notifications").add({
      userId: data.profId,
      tipo: "resena",
      mensaje,
      detalle,
      reviewId: context.params.reviewId,
      fecha: new Date().toISOString(),
      read: false,
      source: "cloud-function",
    });

    await enviarPushAlUsuario(data.profId, "Nueva reseña — Oficios YA!", mensaje, {
      tipo: "resena",
      tag: "resena",
    });
    return null;
  });

exports.onQuoteCreated = functions.firestore
  .document("quotes/{quoteId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.profId) return null;

    const nombre = data.clienteNombre || "Un cliente";
    const urgencia = data.urgencia || "Normal";
    const mensaje = `${nombre} te solicitó un presupuesto (${urgencia}).`;
    const detalle = (data.descripcion || "").substring(0, 120);

    await db.collection("notifications").add({
      userId: data.profId,
      tipo: "presupuesto",
      mensaje,
      detalle,
      quoteId: context.params.quoteId,
      fecha: new Date().toISOString(),
      read: false,
      source: "cloud-function",
    });

    await enviarPushAlUsuario(
      data.profId,
      "Nuevo presupuesto — Oficios YA!",
      mensaje,
      { tipo: "presupuesto", tag: "presupuesto" }
    );
    return null;
  });

/** Prueba de push: el profesional logueado se envía un aviso a sí mismo */
exports.testPush = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Debés iniciar sesión");
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
