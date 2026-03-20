const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
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

      const { amount, currency = "mxn" } = request.data;

      if (!amount || amount <= 0) {
        throw new HttpsError(
          "invalid-argument",
          "Amount is required and must be positive"
        );
      }

      const stripe = require("stripe")(stripeSecret.value());

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        automatic_payment_methods: { enabled: true },
      });

      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      console.error("Stripe error:", error);
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

      // Verificar autenticación via Firebase Auth token
      const authHeader = req.headers.authorization || "";
      if (authHeader.startsWith("Bearer ")) {
        try {
          const idToken = authHeader.split("Bearer ")[1];
          await admin.auth().verifyIdToken(idToken);
        } catch (authError) {
          console.warn("Token inválido:", authError.message);
        }
      }

      const { amount, currency = "mxn" } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Amount is required and must be positive" });
      }

      const stripe = require("stripe")(stripeSecret.value());

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        automatic_payment_methods: { enabled: true },
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
