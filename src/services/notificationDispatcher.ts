/**
 * Notification Dispatcher
 * Manages sending external notifications (WhatsApp, Email) via existing services.
 */

import { createNotification } from '@/services/notificationService';

// Placeholder for WhatsApp logic
const sendWhatsApp = async (phone: string, message: string) => {
  console.log(`[WhatsApp] Sending to ${phone}: ${message}`);
  // In a real app, you'd call a WhatsApp Business API here.
  return Promise.resolve(true);
};

export const notifyCancellationToClient = async (appointment: any, reason: string) => {
  const { clientName, clientEmail, clientPhone, serviceName, date, time } = appointment;

  const message = `Hola ${clientName}, lamentamos informarte que tu cita para "${serviceName}" el día ${date} a las ${time} ha sido cancelada por el barbero.\n\nMotivo: ${reason}\n\nPor favor, agenda una nueva cita en nuestra app.`;

  try {
    // 1. Trigger Internal & Email Notification via Firestore
    await createNotification({
      type: 'appointment_cancelled',
      message: `Tu cita ha sido cancelada. Motivo: ${reason}`,
      targetRoles: ['client'],
      targetUserId: appointment.userId,
      appointmentId: appointment.id,
      clientName: appointment.userName,
      barberName: appointment.barberName,
      service: appointment.serviceName,
      date: appointment.date,
      time: appointment.time
    });

    // 2. Send WhatsApp Mock
    if (clientPhone) {
      await sendWhatsApp(clientPhone, message);
    }

    console.log(`Notifications sent for appointment ${appointment.id}`);
  } catch (error) {
    console.error('Error sending cancellation notifications:', error);
  }
};
