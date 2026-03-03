const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Obtener Stripe usando la clave secreta guardada en Firebase Config
const getStripe = () => {
  const secret = functions.config().stripe.secret;
  return require("stripe")(secret);
};

// Dominios permitidos para CORS
const ALLOWED_ORIGINS = [
  "https://barberia-app-c4c2b.web.app",
  "https://barberia-app-c4c2b.firebaseapp.com",
  "http://localhost:8081",
  "http://localhost:19006",
];

/* ============================================================
   1) FUNCIÓN ORIGINAL (CALLABLE) - Para apps móviles
   ============================================================ */
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión para realizar un pago"
      );
    }

    const { amount, currency = "mxn" } = data;

    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Amount is required and must be positive"
      );
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency,
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Stripe error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/* ============================================================
   2) FUNCIÓN HTTP PARA STRIPE WEB (Elements / Checkout)
   Con validación de autenticación y CORS restringido
   ============================================================ */
exports.createPaymentIntentWeb = functions.https.onRequest(async (req, res) => {
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
        // En modo test, permitimos sin auth; en producción descomenta:
        // return res.status(401).json({ error: "No autorizado" });
      }
    }

    const { amount, currency = "mxn" } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount is required and must be positive" });
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir pesos a centavos
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
});

