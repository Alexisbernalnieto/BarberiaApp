// src/services/notificationService.ts
// ═══════════════════════════════════════════════════════════════
// Centralized Notification Service — BarberiaApp
// Creates typed notifications in Firestore for real-time UI updates.
// Email notifications are handled by Cloud Functions triggers.
// ═══════════════════════════════════════════════════════════════
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseClient';
import { NotificationType } from '@/types';

interface CreateNotificationParams {
  type: NotificationType;
  message: string;
  branch?: string;
  targetRoles: string[];
  targetUserId?: string;
  clientName?: string;
  barberName?: string;
  service?: string;
  appointmentId?: string;
  date?: string;
  time?: string;
}

/**
 * Creates a notification document in Firestore.
 * The notification will be picked up by real-time listeners in AdminDashboard
 * and by Cloud Functions for email delivery.
 */
export const createNotification = async (params: CreateNotificationParams) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...params,
      readBy: [],
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    // Non-blocking — notification failure should not break the main operation
    console.error('[NotificationService] Error creating notification:', error);
  }
};

/**
 * Returns a human-readable label for each notification type.
 */
export const getNotificationLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    new_appointment: 'Nueva Cita',
    appointment_cancelled: 'Cita Cancelada',
    no_show_alert: 'No-Show',
    barber_absent: 'Barbero Ausente',
    appointment_rescheduled: 'Cita Reprogramada',
    barber_reassigned: 'Barbero Reasignado',
    walk_in_registered: 'Walk-in',
    reschedule_request: 'Solicitud de Cambio',
    reschedule_authorized: 'Cambio Autorizado',
    check_in: 'Check-in',
  };
  return labels[type] || 'Notificación';
};

/**
 * Returns an icon name and color for each notification type.
 */
export const getNotificationStyle = (type: NotificationType) => {
  const styles: Record<NotificationType, { color: string; bg: string }> = {
    new_appointment: { color: '#D4AF37', bg: 'rgba(212, 175, 55, 0.1)' },
    appointment_cancelled: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
    no_show_alert: { color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
    barber_absent: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
    appointment_rescheduled: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    barber_reassigned: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    walk_in_registered: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    reschedule_request: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    reschedule_authorized: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    check_in: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  };
  return styles[type] || { color: '#888', bg: 'rgba(136,136,136,0.1)' };
};
