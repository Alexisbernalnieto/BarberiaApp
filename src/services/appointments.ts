import { db } from '../firebaseClient';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { logActivity } from './logs';

interface CreateAppointmentParams {
  userId: string;
  userName: string;
  branch: string;
  barberId: string;
  barberName: string;
  date: string;
  time: string;
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
        paid: !!paymentIntentId,
        paymentIntentId: paymentIntentId || null,
        status: 'confirmed',
        createdAt: Timestamp.now(),
      };

      transaction.set(appointmentRef, payload);
      logActivity(
        'Reservó una cita',
        `Cliente: ${userName}\nBarbero: ${barberName}\nServicio: ${serviceName}\nFecha: ${date} a las ${time}`,
        userId,
        1
      );
      return { id: uniqueId, ...payload };
    });
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error;
  }
};
