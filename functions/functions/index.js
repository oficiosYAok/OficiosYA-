/**
 * Cloud Functions — Oficios YA!
 * Notificaciones in-app + Push (FCM)
 *
 * Deploy:
 *   cd functions && npm install
 *   firebase deploy --only functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

async function enviarPushAlUsuario(userId, title, body, data) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return;
    const tokens = userDoc.data().fcmTokens || [];
    if (!tokens.length) {
      console.log("Sin tokens FCM para", userId);
      return;
    }

    const message = {
      tokens: tokens,
      notification: { title, body },
      data: Object.assign(
        {
          title: String(title || ""),
          body: String(body || ""),
          url: "/#notifications",
        },
        data || {}
      ),
      webpush: {
        fcmOptions: {
          link: "/#notifications",
        },
        notification: {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        },
      },
    };

    const res = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `Push enviados: ${res.successCount} ok, ${res.failureCount} fail`
    );

    // Limpiar tokens inválidos
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
  } catch (err) {
    console.error("enviarPushAlUsuario", err);
  }
}

exports.onReviewCreated = functions.firestore
  .document("reviews/{reviewId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.profId) {
      console.warn("Reseña sin profId, se omite notificación");
      return null;
    }

    const calidad = data.calidad || 0;
    const tiempo = data.tiempo || 0;
    const precio = data.precio || 0;
    const comentario = data.comentario || "";
    const nombre = data.clienteNombre || "Un cliente";

    const mensaje = `${nombre} te dejó una reseña y valoración.`;
    const detalle = `"${comentario.substring(0, 60)}${
      comentario.length > 60 ? "..." : ""
    }" — Calidad: ${calidad}★, Tiempo: ${tiempo}★, Precio: ${precio}★`;

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

    await enviarPushAlUsuario(
      data.profId,
      "Nueva reseña — Oficios YA!",
      mensaje,
      { tipo: "resena", tag: "resena" }
    );

    return null;
  });

exports.onQuoteCreated = functions.firestore
  .document("quotes/{quoteId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.profId) {
      console.warn("Presupuesto sin profId, se omite notificación");
      return null;
    }

    const nombre = data.clienteNombre || "Un cliente";
    const urgencia = data.urgencia || "Normal";
    const descripcion = data.descripcion || "";

    const mensaje = `${nombre} te solicitó un presupuesto (${urgencia}).`;
    const detalle =
      descripcion.substring(0, 120) +
      (descripcion.length > 120 ? "..." : "");

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
