// src/services/appointments.js
import { db } from '../firebaseClient';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';

/**
 * Crea una cita de forma segura usando Transacciones para evitar doble reserva.
 * Utiliza un ID Único basado en barbero, fecha y hora.
 */
export const createAppointment = async ({
  userId,
  userName,
  branch,
  barberId,
  barberName,
  date,
  time,
  serviceId,
  serviceName,
  price,
  duration,
  type,
  paymentIntentId,
}) => {
  // ID Único para evitar duplicidad a nivel de base de datos
  // Formato: app_BARBERID_YYYY-MM-DD_HH-MM
  const uniqueId = `app_${barberId}_${date}_${time}`.replace(/:/g, '-');
  const appointmentRef = doc(db, 'appointments', uniqueId);

  try {
    return await runTransaction(db, async (transaction) => {
      const appDoc = await transaction.get(appointmentRef);
      
      if (appDoc.exists()) {
        throw new Error('Lo sentimos, este horario ya ha sido reservado por otra persona en este momento.');
      }

      const payload = {
        userId,
        userName,
        branch,
        barberId,
        barberName,
        date,
        time,
        serviceId,
        serviceName,
        price,
        duration,
        type: type || 'Online',
        paid: !!paymentIntentId, // Solo se marca como pagado si hay un ID de intención de pago
        paymentIntentId: paymentIntentId || null,
        status: 'confirmed',
        createdAt: Timestamp.now(),
      };

      transaction.set(appointmentRef, payload);
      return { id: uniqueId, ...payload };
    });
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error;
  }
};

// TODO: Implementar cancelación de citas con reembolso Stripe
// Se necesita:
// 1. Una Cloud Function que llame a stripe.refunds.create({ payment_intent: paymentIntentId })
// 2. Un método cancelAppointment() aquí que actualice el status a 'cancelled' en Firestore
// 3. UI en UserDashboard/AdminDashboard para permitir cancelaciones

