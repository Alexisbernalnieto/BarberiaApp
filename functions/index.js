const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

// Stripe secret key como parámetro seguro de Firebase
// Se configura con: firebase functions:secrets:set STRIPE_SECRET
const stripeSecret = defineSecret("STRIPE_SECRET");

// Dominios permitidos para CORS
const ALLOWED_ORIGINS = [
  "https://barberia-app-c4c2b.web.app",
  "https://barberia-app-c4c2b.firebaseapp.com",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
  "http://localhost:8084",
  "http://localhost:8085",
  "http://localhost:19006",
];

/* ============================================================
   1) FUNCIÓN CALLABLE - Para apps móviles
   ============================================================ */
exports.createPaymentIntent = onCall(
  { secrets: [stripeSecret] },
  async (request) => {
    try {
      // Verificar autenticación
      if (!request.auth) {
        throw new HttpsError(
          "unauthenticated",
          "Debes iniciar sesión para realizar un pago"
        );
      }

      const { amount, serviceId, currency = "mxn" } = request.data;
      let finalAmount = amount;

      // Verificación de Precio (BLOQUEO DE MANIPULACIÓN)
      if (serviceId) {
        const serviceDoc = await admin.firestore().collection("services").doc(serviceId).get();
        if (!serviceDoc.exists) {
            throw new HttpsError("not-found", "Servicio no encontrado");
        }
        finalAmount = serviceDoc.data().price;
      } else {
        // Solo admins pueden crear intents sin serviceId (ajustes manuales)
        const userDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
        const role = userDoc.data()?.role;
        if (role !== 0 && role !== 'admin') {
            throw new HttpsError("permission-denied", "Debe proporcionar un ID de servicio válido");
        }
      }

      if (!finalAmount || finalAmount <= 0) {
        throw new HttpsError(
          "invalid-argument",
          "El monto debe ser positivo"
        );
      }

      const stripe = require("stripe")(stripeSecret.value());

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalAmount * 100),
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
            userId: request.auth.uid,
            serviceId: serviceId || "manual_adjustment"
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      console.error("Stripe error:", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("internal", error.message);
    }
  }
);

/* ============================================================
   2) FUNCIÓN HTTP PARA STRIPE WEB (Elements / Checkout)
   Con validación de autenticación y CORS restringido
   ============================================================ */
exports.createPaymentIntentWeb = onRequest(
  { secrets: [stripeSecret] },
  async (req, res) => {
    try {
      // CORS restringido a dominios autorizados
      const origin = req.headers.origin || "";
      if (ALLOWED_ORIGINS.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
      }
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      // 1. Verificar autenticación via Firebase Auth token (OBLIGATORIO)
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
          return res.status(401).json({ error: "No se proporcionó token de autenticación" });
      }

      let decodedToken;
      try {
        const idToken = authHeader.split("Bearer ")[1];
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (authError) {
        console.warn("Token inválido:", authError.message);
        return res.status(401).json({ error: "Autenticación inválida" });
      }

      const { amount, serviceId, currency = "mxn" } = req.body;
      let finalAmount = amount;

      // 2. Verificación de Precio (BLOQUEO DE MANIPULACIÓN)
      if (serviceId) {
        const serviceDoc = await admin.firestore().collection("services").doc(serviceId).get();
        if (!serviceDoc.exists) {
            return res.status(404).json({ error: "Servicio no encontrado" });
        }
        // Usamos el precio real de la base de datos
        finalAmount = serviceDoc.data().price;
        console.log(`Pago verificado para servicio ${serviceId}: $${finalAmount}`);
      } else {
          // Si no hay serviceId, solo permitimos si el usuario es Admin (verificado por claims o BD)
          const userDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
          const role = userDoc.data()?.role;
          if (role !== 0 && role !== 'admin') {
              return res.status(403).json({ error: "Debe proporcionar un ID de servicio válido para proceder" });
          }
      }

      if (!finalAmount || finalAmount <= 0) {
        return res.status(400).json({ error: "El monto debe ser positivo" });
      }

      const stripe = require("stripe")(stripeSecret.value());

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalAmount * 100),
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
            userId: decodedToken.uid,
            serviceId: serviceId || "manual_adjustment"
        }
      });

      return res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Stripe error:", error);
      return res.status(500).json({ error: error.message });
    }
  }
);

/* ============================================================
   3) GESTIÓN DE MÉTODOS DE PAGO (SetupIntents)
   ============================================================ */

/**
 * Obtiene o crea un Customer ID de Stripe para el usuario actual
 */
async function getOrCreateCustomer(userId, email, stripe) {
  const userRef = admin.firestore().collection("users").doc(userId);
  const userDoc = await userRef.get();
  
  if (userDoc.exists && userDoc.data().stripeCustomerId) {
    return userDoc.data().stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: email,
    metadata: { firebaseUID: userId },
  });

  await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
  return customer.id;
}

/**
 * Crea un SetupIntent para que el cliente pueda guardar una tarjeta sin pagar
 */
exports.createSetupIntent = onCall(
  { secrets: [stripeSecret] },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debe iniciar sesión");
      }

      const stripe = require("stripe")(stripeSecret.value());
      const customerId = await getOrCreateCustomer(
        request.auth.uid,
        request.auth.token.email,
        stripe
      );

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"],
      });

      return { clientSecret: setupIntent.client_secret };
    } catch (error) {
      console.error("SetupIntent error:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);

/**
 * Lista las tarjetas guardadas del usuario
 */
exports.listPaymentMethods = onCall(
  { secrets: [stripeSecret] },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debe iniciar sesión");
      }

      const userDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
      const customerId = userDoc.exists ? userDoc.data().stripeCustomerId : null;

      if (!customerId) return { paymentMethods: [] };

      const stripe = require("stripe")(stripeSecret.value());
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      return { paymentMethods: paymentMethods.data };
    } catch (error) {
       console.error("List PM error:", error);
       throw new HttpsError("internal", error.message);
    }
  }
);

/**
 * Elimina (desasocia) una tarjeta del cliente
 */
exports.detachPaymentMethod = onCall(
  { secrets: [stripeSecret] },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debe iniciar sesión");
      }

      const { paymentMethodId } = request.data;
      if (!paymentMethodId) {
        throw new HttpsError("invalid-argument", "paymentMethodId is required");
      }

      const stripe = require("stripe")(stripeSecret.value());
      
      // Verificación opcional: asegurar que el PM pertenece a este cliente
      const customerPMs = await admin.firestore().collection("users").doc(request.auth.uid).get();
      const customerId = customerPMs.data().stripeCustomerId;

      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (pm.customer !== customerId) {
        throw new HttpsError("permission-denied", "No tienes permiso para eliminar este método");
      }

      await stripe.paymentMethods.detach(paymentMethodId);
      return { success: true };
    } catch (error) {
      console.error("Detach PM error:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);

/* ============================================================
   4) SEGURIDAD Y ROLES (Custom Claims)
   ============================================================ */

/**
 * Trigger de Firestore que se ejecuta automáticamente cuando el documento
 * de un usuario es creado o modificado. Sincroniza el campo "role" de la base
 * de datos directamente hacia las credenciales seguras de Firebase Auth (Custom Claims).
 */
exports.syncUserRoleClaims = onDocumentWritten(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    
    // Si el documento fue eliminado, limpiar los claims del usuario
    if (!event.data.after.exists) {
      return admin.auth().setCustomUserClaims(userId, { role: null });
    }

    const userData = event.data.after.data();
    const currentRole = userData.role;

    // Si el usuario recién registrado aún no tiene un rol, lo ignoramos por ahora
    if (currentRole === undefined) return null;

    try {
      // Obtener el usuario de Authentication para comparar su claim actual
      const userRecord = await admin.auth().getUser(userId);
      const currentClaims = userRecord.customClaims || {};

      if (currentClaims.role === currentRole) {
        // Ya cuenta con el certificado correcto, ignoramos el guardado para evitar ciclos infinitos
        return null;
      }

      // Asignar el nuevo certificado (Claim) al token del usuario
      await admin.auth().setCustomUserClaims(userId, { role: currentRole });
      console.log(`✅ Custom Claim 'role' propagado exitosamente como '${currentRole}' para el usuario: ${userId}`);
      return null;
    } catch (error) {
      console.error("❌ Error asignando Custom Claims al usuario:", userId, error);
      return null;
    }
  }
);
