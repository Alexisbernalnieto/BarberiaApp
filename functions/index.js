const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
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
   NEW) OBTENER METADATOS DEL PAGO
   ============================================================ */
exports.getPaymentMetadata = onCall(
  { secrets: [stripeSecret] },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión");
      }

      const { paymentIntentId } = request.data;
      if (!paymentIntentId) {
        throw new HttpsError("invalid-argument", "ID de pago requerido");
      }

      const stripe = require("stripe")(stripeSecret.value());
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge', 'payment_method'],
      });

      if (!paymentIntent) {
        throw new HttpsError("not-found", "Pago no encontrado");
      }

      const charge = paymentIntent.latest_charge;
      const paymentMethod = paymentIntent.payment_method;

      let brand = null;
      let last4 = null;
      let receipt_url = null;

      if (charge && charge.payment_method_details && charge.payment_method_details.card) {
        brand = charge.payment_method_details.card.brand;
        last4 = charge.payment_method_details.card.last4;
        receipt_url = charge.receipt_url;
      } else if (paymentMethod && paymentMethod.card) {
        brand = paymentMethod.card.brand;
        last4 = paymentMethod.card.last4;
      }

      return {
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        brand,
        last4,
        receipt_url
      };
    } catch (error) {
      console.error("Error retrieving payment metadata:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);

/* ============================================================
   NEW) OBTENER MÉTRICAS FINANCIERAS (Admin & Barbero)
   ============================================================ */
exports.getFinancialMetrics = onCall(
  { secrets: [stripeSecret] },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión");
      }

      const uid = request.auth.uid;
      const userDoc = await admin.firestore().collection("users").doc(uid).get();
      const userData = userDoc.data();
      const userRole = userData?.role;
      const isAdmin = userRole === 0 || userRole === "admin";
      const isBarber = userRole === 1 || userRole === "barber";

      if (!isAdmin && !isBarber) {
        throw new HttpsError("permission-denied", "No tienes permisos para ver finanzas");
      }

      const stripe = require("stripe")(stripeSecret.value());
      
      // 1. Obtener Balance General (Solo para Admin)
      let balance = null;
      if (isAdmin) {
        const stripeBalance = await stripe.balance.retrieve();
        balance = {
          available: stripeBalance.available.reduce((acc, b) => acc + b.amount, 0) / 100,
          pending: stripeBalance.pending.reduce((acc, b) => acc + b.amount, 0) / 100,
          currency: stripeBalance.available[0]?.currency || 'mxn'
        };
      }

      // 2. Calcular Volumen Bruto (Search API)
      // Si es barbero, filtramos por su metadata.userId
      let query = "status:'succeeded'";
      if (isBarber && !isAdmin) {
        query += ` AND metadata['userId']:'${uid}'`;
      }

      const paymentIntents = await stripe.paymentIntents.search({
        query: query,
        limit: 100,
      });

      const grossVolume = paymentIntents.data.reduce((acc, pi) => acc + pi.amount, 0) / 100;
      const netVolume = grossVolume / 2; // Lógica 50/50

      return {
        balance,
        grossVolume,
        netVolume,
        transactionCount: paymentIntents.data.length,
        currency: 'mxn'
      };
    } catch (error) {
      console.error("Error fetching financial metrics:", error);
      throw new HttpsError("internal", error.message);
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

/* ============================================================
   5) CONSISTENCIA Y TRANSACCIONES
   ============================================================ */

/**
 * Automatiza reembolsos de Stripe cuando una cita es cancelada.
 * Escucha cambios en 'appointments/{id}' y si `status` cambia a 'cancelled' y
 * fue pagada, procesa el reembolso automáticamente para evitar descuadres financieros.
 */
exports.handleAppointmentCancellation = onDocumentWritten(
  {
    document: "appointments/{appointmentId}",
    secrets: [stripeSecret]
  },
  async (event) => {
    // Si el documento se borró, o es nuevo, no hacer nada si no es una cancelación explícita
    if (!event.data.after.exists) return null;
    
    const after = event.data.after.data();
    const before = event.data.before ? event.data.before.data() : null;
    
    // Solo ejecutamos si el status CAMBIÓ a 'cancelled'
    if (after.status !== 'cancelled' || (before && before.status === 'cancelled')) {
        return null;
    }

    // Solo reembolsamos si está pagado y existe un paymentIntentId
    if (after.paid && after.paymentIntentId && !after.refundStatus) {
        try {
            const stripe = require("stripe")(stripeSecret.value());
            console.log(`Iniciando reembolso para la cita ${event.params.appointmentId}`);
            
            // Procesar el reembolso total (o ajustarlo según políticas de penalización)
            const refund = await stripe.refunds.create({
                payment_intent: after.paymentIntentId,
                reason: 'requested_by_customer'
            });
            
            console.log(`✅ Reembolso exitoso para ${event.params.appointmentId}: ${refund.id}`);
            
            // Actualizar Firestore para marcar el reembolso como completado (Transaccional)
            return event.data.after.ref.update({ 
                refundStatus: 'completed',
                refundId: refund.id,
                refundedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
           console.error(`❌ Error al procesar reembolso para ${event.params.appointmentId}`, error);
           return event.data.after.ref.update({ 
               refundStatus: 'failed', 
               refundError: error.message 
           });
        }
    }
    return null;
  }
);

/* ============================================================
   6) BACKUPS DIARIOS AUTOMATIZADOS (Cron Job)
   ============================================================ */

/**
 * Backup diario automatizado de Firestore a las 3:00 AM (Hora de México)
 * Exporta toda la base de datos a un bucket de Storage para retención y recuperación en caso de desastres.
 */
exports.scheduledFirestoreExport = onSchedule(
  {
    schedule: "0 3 * * *", 
    timeZone: "America/Mexico_City",
    timeoutSeconds: 300,
    memory: "256MiB"
  },
  async (event) => {
    // Obtenemos el ID del proyecto automáticamente
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const databaseName = admin.firestore()._referencePath ? admin.firestore()._referencePath.databaseId : '(default)';
    
    // El bucket por defecto de Firebase Appspot se utiliza para almacenar los backups
    const bucket = `gs://${projectId}.appspot.com/firestore_backups`;

    const client = new admin.firestore.v1.FirestoreAdminClient();

    try {
      const responses = await client.exportDocuments({
        name: client.databasePath(projectId, databaseName),
        outputUriPrefix: bucket,
        collectionIds: [] // Un arreglo vacío significa que exportará TODAS las colecciones
      });
      console.log(`✅ Backup diario completado exitosamente en ${bucket}`);
      return responses;
    } catch (err) {
      console.error("❌ Falló la exportación programada de la base de datos", err);
      throw new Error("Export operation failed: " + err.message);
    }
  }
);

/* ============================================================
   7) EMAIL NOTIFICATIONS — APPOINTMENT EVENTS
   Sends professional branded emails when key appointment events
   occur (barber absence, reschedule, no-show, etc.)
   
   Configuration:
   firebase functions:secrets:set SMTP_EMAIL
   firebase functions:secrets:set SMTP_PASSWORD
   ============================================================ */
const smtpEmail = defineSecret("SMTP_EMAIL");
const smtpPassword = defineSecret("SMTP_PASSWORD");

/**
 * Generates branded HTML email template for El Coronel
 */
function buildEmailTemplate(title, bodyContent, ctaText, ctaUrl) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:24px;border:1px solid rgba(212,175,55,0.15);overflow:hidden;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding:40px 40px 20px;border-bottom:1px solid rgba(212,175,55,0.1);">
              <div style="width:48px;height:48px;border:2px solid #D4AF37;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="color:#D4AF37;font-size:24px;font-weight:900;">B</span>
              </div>
              <h2 style="color:#D4AF37;font-size:14px;letter-spacing:3px;font-weight:900;margin:0;text-transform:uppercase;">EL CORONEL</h2>
              <p style="color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:2px;margin:4px 0 0;text-transform:uppercase;">Executive Barber Shop</p>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h1 style="color:#FFFFFF;font-size:22px;font-weight:800;margin:0;text-align:center;">${title}</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:24px 40px;">
              <div style="color:rgba(255,255,255,0.7);font-size:15px;line-height:26px;">
                ${bodyContent}
              </div>
            </td>
          </tr>

          ${ctaText && ctaUrl ? `
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:8px 40px 32px;">
              <a href="${ctaUrl}" style="display:inline-block;background-color:#D4AF37;color:#000000;font-weight:800;font-size:14px;text-decoration:none;padding:16px 40px;border-radius:14px;letter-spacing:0.5px;text-transform:uppercase;">${ctaText}</a>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(212,175,55,0.1);text-align:center;">
              <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">Este correo fue enviado automáticamente por El Coronel Executive Barber Shop.</p>
              <p style="color:rgba(255,255,255,0.2);font-size:10px;margin:8px 0 0;">Si tienes alguna duda, contáctanos directamente en la sucursal.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Firestore trigger: when a notification is created, check if it needs
 * email delivery and send branded email to the affected client.
 */
exports.sendAppointmentEmail = onDocumentWritten(
  {
    document: "notifications/{notificationId}",
    secrets: [smtpEmail, smtpPassword]
  },
  async (event) => {
    // Only process newly created notifications
    if (!event.data.after.exists || event.data.before.exists) return null;

    const notification = event.data.after.data();
    const { type, targetUserId, clientName, barberName, service, appointmentId, branch } = notification;

    // Only certain types warrant an email to the client
    const emailTypes = ['barber_absent', 'barber_reassigned', 'appointment_rescheduled', 'appointment_cancelled'];
    if (!emailTypes.includes(type) || !targetUserId) return null;

    try {
      // Get user email from Firestore
      const userDoc = await admin.firestore().collection("users").doc(targetUserId).get();
      if (!userDoc.exists) {
        console.log(`User ${targetUserId} not found, skipping email.`);
        return null;
      }

      const userData = userDoc.data();
      const userEmail = userData.email;
      if (!userEmail) return null;

      // Build email content based on type
      let subject, bodyContent, ctaText, ctaUrl;
      const appUrl = "https://barberia-app-c4c2b.web.app";

      switch (type) {
        case 'barber_absent':
          subject = '⚠️ Cambio en tu cita — El Coronel';
          bodyContent = `
            <p>Hola <strong style="color:#FFFFFF;">${clientName || userData.name || 'Cliente'}</strong>,</p>
            <p>Lamentamos informarte que tu barbero <strong style="color:#D4AF37;">${barberName || 'asignado'}</strong> no podrá presentarse hoy.</p>
            <div style="background-color:rgba(212,175,55,0.08);border-radius:14px;padding:20px;margin:16px 0;border-left:3px solid #D4AF37;">
              <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Servicio</p>
              <p style="margin:4px 0 0;color:#FFFFFF;font-weight:700;">${service || 'Tu servicio agendado'}</p>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Sucursal</p>
              <p style="margin:4px 0 0;color:#FFFFFF;font-weight:700;">${branch || 'El Coronel'}</p>
            </div>
            <p>Nuestro equipo está trabajando para reasignar tu cita con otro barbero disponible o reprogramarla a un horario que te convenga.</p>
            <p>Te contactaremos con los detalles actualizados en breve.</p>
          `;
          ctaText = 'Ver mis citas';
          ctaUrl = appUrl;
          break;

        case 'barber_reassigned':
          subject = '🔄 Tu barbero fue reasignado — El Coronel';
          bodyContent = `
            <p>Hola <strong style="color:#FFFFFF;">${clientName || userData.name || 'Cliente'}</strong>,</p>
            <p>Te informamos que tu cita ha sido reasignada a un nuevo barbero:</p>
            <div style="background-color:rgba(212,175,55,0.08);border-radius:14px;padding:20px;margin:16px 0;border-left:3px solid #D4AF37;">
              <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Nuevo Barbero</p>
              <p style="margin:4px 0 0;color:#D4AF37;font-weight:800;font-size:18px;">${barberName || 'Barbero asignado'}</p>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Servicio</p>
              <p style="margin:4px 0 0;color:#FFFFFF;font-weight:700;">${service || 'Tu servicio agendado'}</p>
            </div>
            <p>El horario de tu cita se mantiene sin cambios. ¡Te esperamos!</p>
          `;
          ctaText = 'Ver detalles';
          ctaUrl = appUrl;
          break;

        case 'appointment_rescheduled':
          subject = '📅 Tu cita fue reprogramada — El Coronel';
          bodyContent = `
            <p>Hola <strong style="color:#FFFFFF;">${clientName || userData.name || 'Cliente'}</strong>,</p>
            <p>Tu cita ha sido reprogramada para una nueva fecha y horario.</p>
            <div style="background-color:rgba(212,175,55,0.08);border-radius:14px;padding:20px;margin:16px 0;border-left:3px solid #D4AF37;">
              <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Barbero</p>
              <p style="margin:4px 0 0;color:#D4AF37;font-weight:800;">${barberName || 'Tu barbero'}</p>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Servicio</p>
              <p style="margin:4px 0 0;color:#FFFFFF;font-weight:700;">${service || 'Tu servicio'}</p>
            </div>
            <p>Visita la app para ver los detalles actualizados de tu nueva cita.</p>
          `;
          ctaText = 'Ver nueva cita';
          ctaUrl = appUrl;
          break;

        case 'appointment_cancelled':
          subject = '❌ Tu cita fue cancelada — El Coronel';
          bodyContent = `
            <p>Hola <strong style="color:#FFFFFF;">${clientName || userData.name || 'Cliente'}</strong>,</p>
            <p>Lamentamos informarte que tu cita ha sido cancelada.</p>
            <div style="background-color:rgba(239,68,68,0.08);border-radius:14px;padding:20px;margin:16px 0;border-left:3px solid #EF4444;">
              <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Barbero</p>
              <p style="margin:4px 0 0;color:#FFFFFF;font-weight:700;">${barberName || 'Barbero'}</p>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Servicio</p>
              <p style="margin:4px 0 0;color:#FFFFFF;font-weight:700;">${service || 'Servicio'}</p>
            </div>
            <p>Si tu cita fue pagada, el reembolso se procesará automáticamente a tu método de pago original.</p>
            <p>Puedes agendar una nueva cita cuando gustes.</p>
          `;
          ctaText = 'Agendar nueva cita';
          ctaUrl = appUrl;
          break;

        default:
          return null;
      }

      const emailHtml = buildEmailTemplate(subject.replace(/^[^\s]+\s/, ''), bodyContent, ctaText, ctaUrl);

      // Send email using nodemailer
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpEmail.value(),
          pass: smtpPassword.value(),
        },
      });

      await transporter.sendMail({
        from: `"El Coronel Barber Shop" <${smtpEmail.value()}>`,
        to: userEmail,
        subject: subject,
        html: emailHtml,
      });

      console.log(`✅ Email enviado a ${userEmail} (tipo: ${type})`);

      // Mark notification as email sent
      await event.data.after.ref.update({ emailSent: true, emailSentAt: admin.firestore.FieldValue.serverTimestamp() });

      return null;
    } catch (error) {
      console.error(`❌ Error enviando email para notificación ${event.params.notificationId}:`, error);
      await event.data.after.ref.update({ emailError: error.message });
      return null;
    }
  }
);
