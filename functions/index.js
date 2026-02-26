const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Obtener Stripe usando la clave secreta guardada en Firebase Config
const getStripe = () => {
  const secret = functions.config().stripe.secret;
  return require("stripe")(secret);
};

/* ============================================================
   1) FUNCIÓN ORIGINAL (CALLABLE) - NO SE TOCA
   Sirve para apps móviles o llamadas con httpsCallable()
   ============================================================ */
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    const { amount, currency = "mxn" } = data;

    if (!amount) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Amount is required"
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
   2) NUEVA FUNCIÓN HTTP PARA STRIPE WEB (Elements / Checkout)
   Esta es la que usarás en Expo Web y en Hosting
   ============================================================ */
exports.createPaymentIntentWeb = functions.https.onRequest(async (req, res) => {
  try {
    // Permitir CORS si lo necesitas
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const { amount, currency = "mxn" } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // centavos
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
