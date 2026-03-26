// src/services/appointments.ts
import { db } from '../firebaseClient';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { logActivity } from './activityLogs';

interface CreateAppointmentParams {
  userId: string;
  userName: string;
  branch: string;
  barberId: string;
  barberName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
  type?: string;
  paymentIntentId?: string;
}

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
}: CreateAppointmentParams) => {
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
      
      // Log Activity using unified service
      logActivity({
        adminId: userId,
        adminRole: 'client',
        action: 'Reservó una cita',
        details: `Cliente: ${userName}\nBarbero: ${barberName}\nServicio: ${serviceName}\nFecha: ${date} a las ${time}`,
        targetUserId: uniqueId
      });

      return { id: uniqueId, ...payload };
    });
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error;
  }
};

/**
 * Cancela una cita y actualiza su estado en Firestore.
 * @param appointmentId ID único de la cita
 * @param reason Motivo opcional de cancelación
 */
export const cancelAppointment = async (appointmentId: string, reason?: string) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const appDoc = await transaction.get(appointmentRef);
      if (!appDoc.exists()) {
        throw new Error('La cita no existe.');
      }
      
      const appData = appDoc.data();
      if (appData.status === 'cancelled') {
        throw new Error('Esta cita ya ha sido cancelada.');
      }

      transaction.update(appointmentRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        cancelReason: reason || 'Cancelada por el usuario',
      });

      logActivity({
        adminId: appData.userId,
        adminRole: 'client',
        action: 'Canceló una cita',
        details: `Cita ID: ${appointmentId}\nCliente: ${appData.userName}\nMotivo: ${reason || 'N/A'}`,
        targetUserId: appointmentId
      });
    });
    return true;
  } catch (error) {
    console.error("Cancel transaction failed: ", error);
    throw error;
  }
};

/**
 * Actualiza el estado de una cita.
 */
export const updateAppointmentStatus = async (
  appointmentId: string, 
  newStatus: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'En Local' | 'in_progress' | 'no_show',
  adminId: string,
  adminRole: 'admin' | 'reception' | 'client' | 'barber' | 'system'
) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const appDoc = await transaction.get(appointmentRef);
      if (!appDoc.exists()) {
        throw new Error('La cita no existe.');
      }
      
      const appData = appDoc.data();

      transaction.update(appointmentRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      logActivity({
        adminId: adminId,
        adminRole: adminRole,
        action: `Actualizó estado a ${newStatus}`,
        details: `Cita ID: ${appointmentId}\nCliente: ${appData.userName}\nNuevo Estado: ${newStatus}`,
        targetUserId: appointmentId
      });
    });
    return true;
  } catch (error) {
    console.error("Update status transaction failed: ", error);
    throw error;
  }
};

// TODO: Implementar reembolso Stripe en Cloud Functions
// Se necesita una Cloud Function que escuche cambios en Firestore (status: 'cancelled')
// y ejecute stripe.refunds.create({ payment_intent: paymentIntentId })
