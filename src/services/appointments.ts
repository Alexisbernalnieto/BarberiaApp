// src/services/appointments.ts
// ═══════════════════════════════════════════════════════════════
// Appointment Command Center — Full Lifecycle Service
// Todas las operaciones usan Transacciones de Firestore para
// garantizar consistencia y evitar race conditions.
// ═══════════════════════════════════════════════════════════════
import { db } from '@/firebaseClient';
import { doc, runTransaction, Timestamp, collection, query, where, getDocs, writeBatch, getDoc } from 'firebase/firestore';
import { logActivity } from '@/services/activityLogs';
import { createNotification } from '@/services/notificationService';
import { incrementDayMetrics } from '@/services/barberTracking';
import { AppointmentStatus, TimeSlot } from '@/types';

// ─── Tolerancia No-Show (minutos) ────────────────────────────
const NO_SHOW_TOLERANCE_MINUTES = 10;

// ─── Helper: Time to Minutes ──────────────────────────────────
const timeToMinutes = (t: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// ─── Interfaces ──────────────────────────────────────────────
interface CreateAppointmentParams {
  userId: string;
  userName: string;
  branch: string;
  branchId?: string;
  barberId: string;
  barberName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
  type?: 'Online' | 'Walk-in';
  paymentIntentId?: string;
  notes?: string;
  appointmentId?: string; // Pre-generated ID
}

// ═══════════════════════════════════════════════════════════════
// 1. HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Genera un ID de cita legible y único.
 * Formato: CT-XXXXXX o LM-XXXXXX
 */
export const generateAppointmentId = (branchName: string, type: string = 'Online') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const branchLower = (branchName || '').toLowerCase();
  const isLomas = branchLower.includes('loma');
  const isCentro = branchLower.includes('centro') || branchLower.includes('matriz');
  const isWalkIn = type === 'Walk-in';

  let prefix: string;
  if (isLomas) {
    prefix = isWalkIn ? 'LMW' : 'LM';
  } else if (isCentro) {
    prefix = isWalkIn ? 'CTW' : 'CT';
  } else {
    prefix = isWalkIn ? 'GNW' : 'GN';
  }

  return `${prefix}-${suffix}`;
};

// ═══════════════════════════════════════════════════════════════
// 2. CREAR CITA (Online o Walk-in)
// ═══════════════════════════════════════════════════════════════
export const createAppointment = async (params: CreateAppointmentParams) => {
  const {
    userId, userName, branch, branchId, barberId, barberName,
    date, time, serviceId, serviceName, price, duration,
    type, paymentIntentId, notes, appointmentId,
  } = params;

  const uniqueId = appointmentId || generateAppointmentId(branch, type);
  const appointmentRef = doc(db, 'appointments', uniqueId);

  try {
    // Check for overlaps (Smart Duration Check)
    const newStart = timeToMinutes(time);
    const newEnd = newStart + duration + NO_SHOW_TOLERANCE_MINUTES;

    const conflictQuery = query(
      collection(db, 'appointments'),
      where('barberId', '==', barberId),
      where('date', '==', date)
    );
    const conflictSnap = await getDocs(conflictQuery);
    
    const activeConflict = conflictSnap.docs.find(d => {
      const app = d.data();
      const s = app.status;
      if (s === 'cancelled' || s === 'no_show' || s === 'rescheduled') return false;

      const appStart = timeToMinutes(app.time);
      const appDuration = (app as any).duration || (app as any).serviceDuration || 30;
      const appEnd = appStart + appDuration + NO_SHOW_TOLERANCE_MINUTES;

      // Overlap formula: (StartA < EndB) && (EndA > StartB)
      return (newStart < appEnd && newEnd > appStart);
    });

    if (activeConflict) {
      throw new Error('Lo sentimos, este horario ya tiene un servicio que se cruza con el tiempo solicitado.');
    }

    const result = await runTransaction(db, async (transaction) => {

      const appointmentType = type || 'Online';
      const isPaid = !!paymentIntentId || appointmentType === 'Walk-in';

      const payload = {
        userId,
        userName,
        branch,
        branchId: branchId || branch.toLowerCase().replace(/\s/g, ''),
        barberId,
        barberName,
        date,
        time,
        serviceId,
        serviceName,
        price,
        duration,
        type: appointmentType,
        paid: isPaid,
        paymentIntentId: paymentIntentId || null,
        paymentMethod: appointmentType === 'Walk-in' ? 'Cash' as const : null,
        status: isPaid ? 'confirmed' as AppointmentStatus : 'pending_payment' as AppointmentStatus,
        notes: notes || null,
        createdAt: Timestamp.now(),
      };

      transaction.set(appointmentRef, payload);
      return { id: uniqueId, ...payload };
    });

    // --- Side Effects (Outside Transaction) ---
    const appointmentType = type || 'Online';
    logActivity({
      adminId: userId,
      adminRole: appointmentType === 'Walk-in' ? 'admin' : 'client',
      action: appointmentType === 'Walk-in' ? 'Registró Walk-in' : 'Reservó una cita',
      details: `Cliente: ${userName}\nBarbero: ${barberName}\nServicio: ${serviceName}\nFecha: ${date} a las ${time}\nSucursal: ${branch}`,
      targetUserId: uniqueId,
    });

    createNotification({
      type: appointmentType === 'Walk-in' ? 'walk_in_registered' : 'new_appointment',
      message: appointmentType === 'Walk-in'
        ? `Walk-in registrado: ${userName} con ${barberName}`
        : `${userName} agendó una cita con ${barberName}`,
      branch,
      targetRoles: ['admin', 'reception'],
      clientName: userName,
      barberName,
      service: serviceName,
      appointmentId: uniqueId,
      date,
      time,
    });

    return result;
  } catch (error) {
    console.error('Transaction failed: ', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// 2. CHECK-IN (Cliente llegó a la barbería)
// ═══════════════════════════════════════════════════════════════
export const checkInAppointment = async (appointmentId: string, adminId: string) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);

  return runTransaction(db, async (transaction) => {
    const appDoc = await transaction.get(appointmentRef);
    if (!appDoc.exists()) throw new Error('La cita no existe.');

    const data = appDoc.data();
    if (data.status !== 'confirmed') {
      throw new Error(`No se puede hacer check-in. Estado actual: ${data.status}`);
    }

    transaction.update(appointmentRef, {
      status: 'checked_in',
      checkedInAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    logActivity({
      adminId,
      adminRole: 'admin',
      action: 'Check-in de cliente',
      details: `Cliente ${data.userName} llegó para su cita de ${data.serviceName} con ${data.barberName}`,
      targetUserId: appointmentId,
    });

    createNotification({
      type: 'check_in',
      message: `${data.userName} llegó a la barbería`,
      branch: data.branch,
      targetRoles: ['admin'],
      clientName: data.userName,
      barberName: data.barberName,
      service: data.serviceName,
      appointmentId,
    });

    return true;
  });
};

// ═══════════════════════════════════════════════════════════════
// 3. INICIAR SERVICIO (Cortando)
// ═══════════════════════════════════════════════════════════════
export const startService = async (appointmentId: string, adminId: string) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);

  return runTransaction(db, async (transaction) => {
    const appDoc = await transaction.get(appointmentRef);
    if (!appDoc.exists()) throw new Error('La cita no existe.');

    const data = appDoc.data();
    if (data.status !== 'checked_in' && data.status !== 'confirmed') {
      throw new Error(`No se puede iniciar servicio. Estado actual: ${data.status}`);
    }

    transaction.update(appointmentRef, {
      status: 'in_progress',
      updatedAt: Timestamp.now(),
    });

    logActivity({
      adminId,
      adminRole: 'admin',
      action: 'Inició servicio',
      details: `${data.barberName} comenzó ${data.serviceName} para ${data.userName}`,
      targetUserId: appointmentId,
    });

    return true;
  });
};

// ═══════════════════════════════════════════════════════════════
// 4. COMPLETAR SERVICIO
// ═══════════════════════════════════════════════════════════════
export const completeService = async (appointmentId: string, adminId: string) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);

  return runTransaction(db, async (transaction) => {
    const appDoc = await transaction.get(appointmentRef);
    if (!appDoc.exists()) throw new Error('La cita no existe.');

    const data = appDoc.data();
    if (data.status !== 'in_progress' && data.status !== 'checked_in' && data.status !== 'confirmed') {
      throw new Error(`No se puede completar. Estado actual: ${data.status}`);
    }

    transaction.update(appointmentRef, {
      status: 'completed',
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    logActivity({
      adminId,
      adminRole: 'admin',
      action: 'Completó servicio',
      details: `${data.barberName} terminó ${data.serviceName} para ${data.userName} — $${data.price}`,
      targetUserId: appointmentId,
    });

    // Update barber day metrics
    incrementDayMetrics(data.barberId, data.date, data.branch, {
      appointmentsCompleted: 1,
      walkInsCompleted: data.type === 'Walk-in' ? 1 : 0,
      revenue: data.price || 0,
    });

    return true;
  });
};

// ═══════════════════════════════════════════════════════════════
// 5. MARCAR NO-SHOW (10 min tolerancia)
// ═══════════════════════════════════════════════════════════════
export const markNoShow = async (appointmentId: string, adminId: string) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);

  return runTransaction(db, async (transaction) => {
    const appDoc = await transaction.get(appointmentRef);
    if (!appDoc.exists()) throw new Error('La cita no existe.');

    const data = appDoc.data();
    if (data.status === 'completed' || data.status === 'cancelled') {
      throw new Error(`No se puede marcar no-show. Estado actual: ${data.status}`);
    }

    transaction.update(appointmentRef, {
      status: 'no_show',
      noShowMarkedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    logActivity({
      adminId,
      adminRole: 'admin',
      action: 'Marcó No-Show',
      details: `${data.userName} no se presentó a su cita de ${data.time} con ${data.barberName} — Slot liberado para Walk-in`,
      targetUserId: appointmentId,
    });

    createNotification({
      type: 'no_show_alert',
      message: `${data.userName} no se presentó (${data.time}). Slot disponible para Walk-in.`,
      branch: data.branch,
      targetRoles: ['admin', 'reception'],
      clientName: data.userName,
      barberName: data.barberName,
      service: data.serviceName,
      appointmentId,
    });

    // Update barber day metrics
    incrementDayMetrics(data.barberId, data.date, data.branch, { noShows: 1 });

    return true;
  });
};

// ═══════════════════════════════════════════════════════════════
// 6. CANCELAR CITA
// ═══════════════════════════════════════════════════════════════
export const cancelAppointment = async (appointmentId: string, reason?: string, cancelledBy?: string) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);

  try {
    await runTransaction(db, async (transaction) => {
      const appDoc = await transaction.get(appointmentRef);
      if (!appDoc.exists()) throw new Error('La cita no existe.');

      const appData = appDoc.data();
      if (appData.status === 'cancelled') throw new Error('Esta cita ya ha sido cancelada.');

      transaction.update(appointmentRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        cancelReason: reason || 'Cancelada por el usuario',
        updatedAt: Timestamp.now(),
      });

      logActivity({
        adminId: cancelledBy || appData.userId,
        adminRole: cancelledBy ? 'admin' : 'client',
        action: 'Canceló una cita',
        details: `Cita ID: ${appointmentId}\nCliente: ${appData.userName}\nMotivo: ${reason || 'N/A'}`,
        targetUserId: appointmentId,
      });

      createNotification({
        type: 'appointment_cancelled',
        message: `Cita de ${appData.userName} con ${appData.barberName} fue cancelada`,
        branch: appData.branch,
        targetRoles: ['admin'],
        clientName: appData.userName,
        barberName: appData.barberName,
        service: appData.serviceName,
        appointmentId,
      });
    });
    return true;
  } catch (error) {
    console.error('Cancel transaction failed: ', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// 7. REASIGNAR BARBERO
// ═══════════════════════════════════════════════════════════════
export const reassignBarber = async (
  appointmentId: string,
  newBarberId: string,
  newBarberName: string,
  reason: string,
  adminId: string
) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);

  return runTransaction(db, async (transaction) => {
    const appDoc = await transaction.get(appointmentRef);
    if (!appDoc.exists()) throw new Error('La cita no existe.');

    const data = appDoc.data();
    const originalBarberName = data.barberName;
    const originalBarberId = data.barberId;

    // Verificar que el nuevo barbero no tenga cita en ese horario
    const conflictId = `app_${newBarberId}_${data.date}_${data.time}`.replace(/:/g, '-');
    const conflictRef = doc(db, 'appointments', conflictId);
    const conflictDoc = await transaction.get(conflictRef);

    if (conflictDoc.exists()) {
      const conflictData = conflictDoc.data();
      if (conflictData.status !== 'cancelled' && conflictData.status !== 'no_show' && conflictData.status !== 'rescheduled') {
        throw new Error(`${newBarberName} ya tiene una cita a las ${data.time}. No se puede reasignar.`);
      }
    }

    // Crear nueva cita con el nuevo barbero
    const newAppointmentId = conflictId;
    const newAppointmentRef = doc(db, 'appointments', newAppointmentId);

    // Evitar que el ID original se guarde dentro del documento si existiera
    const { id: _unusedId, ...newPayload } = {
      ...(data as any),
      barberId: newBarberId,
      barberName: newBarberName,
      reassignedFrom: originalBarberId,
      reassignedFromName: originalBarberName,
      reassignmentReason: reason,
      updatedAt: Timestamp.now(),
    };

    transaction.set(newAppointmentRef, newPayload);

    // Marcar la cita original como reasignada
    transaction.update(appointmentRef, {
      status: 'rescheduled',
      rescheduledTo: newAppointmentId,
      updatedAt: Timestamp.now(),
    });

    logActivity({
      adminId,
      adminRole: 'admin',
      action: 'Reasignó barbero',
      details: `Cita de ${data.userName}: ${originalBarberName} → ${newBarberName}\nMotivo: ${reason}`,
      targetUserId: appointmentId,
    });

    createNotification({
      type: 'barber_reassigned',
      message: `Tu cita fue reasignada de ${originalBarberName} a ${newBarberName}`,
      branch: data.branch,
      targetRoles: ['admin'],
      targetUserId: data.userId,
      clientName: data.userName,
      barberName: newBarberName,
      service: data.serviceName,
      appointmentId: newAppointmentId,
    });

    return { newAppointmentId, originalAppointmentId: appointmentId };
  });
};

// ═══════════════════════════════════════════════════════════════
// 8. POSPONER / RESCHEDULE CITA
// ═══════════════════════════════════════════════════════════════
export const rescheduleAppointment = async (
  appointmentId: string,
  newDate: string,
  newTime: string,
  adminId: string,
  newBarberId?: string,
  newBarberName?: string,
) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);

  return runTransaction(db, async (transaction) => {
    const appDoc = await transaction.get(appointmentRef);
    if (!appDoc.exists()) throw new Error('La cita no existe.');

    const data = appDoc.data();
    const targetBarberId = newBarberId || data.barberId;
    const targetBarberName = newBarberName || data.barberName;

    // Check new slot availability
    const newId = `app_${targetBarberId}_${newDate}_${newTime}`.replace(/:/g, '-');
    const newRef = doc(db, 'appointments', newId);
    const newDoc = await transaction.get(newRef);

    if (newDoc.exists()) {
      const existing = newDoc.data();
      if (existing.status !== 'cancelled' && existing.status !== 'no_show' && existing.status !== 'rescheduled') {
        throw new Error(`El horario ${newTime} del ${newDate} ya está ocupado para ${targetBarberName}.`);
      }
    }

    // Create new appointment
    // Limpiamos campos de estado previos para la nueva cita reprogramada
    const { 
      id: _unId, 
      checkedInAt: _unC, 
      completedAt: _unCo, 
      noShowMarkedAt: _unN, 
      ...newPayload 
    } = {
      ...(data as any),
      barberId: targetBarberId,
      barberName: targetBarberName,
      date: newDate,
      time: newTime,
      rescheduledFrom: appointmentId,
      status: 'confirmed',
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    transaction.set(newRef, newPayload);

    // Mark original as rescheduled
    transaction.update(appointmentRef, {
      status: 'rescheduled',
      rescheduledTo: newId,
      updatedAt: Timestamp.now(),
    });

    logActivity({
      adminId,
      adminRole: 'admin',
      action: 'Pospuso cita',
      details: `Cita de ${data.userName}: ${data.date} ${data.time} → ${newDate} ${newTime}`,
      targetUserId: appointmentId,
    });

    createNotification({
      type: 'appointment_rescheduled',
      message: `Tu cita fue reprogramada al ${newDate} a las ${newTime}`,
      branch: data.branch,
      targetRoles: ['admin'],
      targetUserId: data.userId,
      clientName: data.userName,
      barberName: targetBarberName,
      service: data.serviceName,
      appointmentId: newId,
    });

    return { newAppointmentId: newId };
  });
};

// ═══════════════════════════════════════════════════════════════
// 9. MARCAR BARBERO AUSENTE
// ═══════════════════════════════════════════════════════════════
export const getBarberAppointmentsForDate = async (barberId: string, date: string) => {
  const q = query(
    collection(db, 'appointments'),
    where('barberId', '==', barberId),
    where('date', '==', date),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((a: any) => a.status !== 'cancelled' && a.status !== 'no_show' && a.status !== 'rescheduled');
};

// ═══════════════════════════════════════════════════════════════
// 10. DETECTAR SLOTS DISPONIBLES (con duración + tolerancia)
// ═══════════════════════════════════════════════════════════════
export const getAvailableSlotsForBarber = async (barberId: string, date: string, serviceDuration: number = 30): Promise<TimeSlot[]> => {
  // Fetch barber's schedule for this specific day
  const barberDoc = await getDoc(doc(db, 'users', barberId));
  if (!barberDoc.exists()) return [];

  const barberData = barberDoc.data();
  const dateObj = new Date(date + 'T12:00:00');
  const dayIndex = dateObj.getDay(); // 0 is Sunday, 1 is Monday...
  const daySchedule = barberData.schedule && barberData.schedule[dayIndex];

  if (!daySchedule || !daySchedule.active) return [];

  const startMin = timeToMinutes(daySchedule.start || "10:00");
  const endMin = timeToMinutes(daySchedule.end || "20:00");

  const q = query(
    collection(db, 'appointments'),
    where('barberId', '==', barberId),
    where('date', '==', date),
  );
  const snapshot = await getDocs(q);
  const booked = snapshot.docs
    .map(d => ({ ...d.data(), id: d.id }))
    .filter((a: any) => a.status !== 'cancelled' && a.status !== 'no_show' && a.status !== 'rescheduled')
    .sort((a: any, b: any) => timeToMinutes((a as any).time) - timeToMinutes((b as any).time));

  const allSlots: TimeSlot[] = [];
  let currentTime = startMin;
  const closingTime = endMin;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = date === todayStr;
  const currentMins = now.getHours() * 60 + now.getMinutes();

  // Breaks configuration
  const break1Start = daySchedule.break1Start ? timeToMinutes(daySchedule.break1Start) : null;
  const break1End = daySchedule.break1End ? timeToMinutes(daySchedule.break1End) : null;
  const break2Start = daySchedule.break2Start ? timeToMinutes(daySchedule.break2Start) : null;
  const break2End = daySchedule.break2End ? timeToMinutes(daySchedule.break2End) : null;

  while (currentTime + serviceDuration <= closingTime) {
    if (isToday && currentTime <= currentMins + 15) {
      currentTime += 5;
      continue;
    }

    const slotStart = currentTime;
    const slotEnd = currentTime + serviceDuration + NO_SHOW_TOLERANCE_MINUTES;

    // Check conflict with appointments
    const conflict = booked.find((app: any) => {
      const appStart = timeToMinutes(app.time);
      const appDur = (app as any).duration || (app as any).serviceDuration || 30;
      const appEnd = appStart + appDur + NO_SHOW_TOLERANCE_MINUTES;
      return (slotStart < appEnd && slotEnd > appStart);
    });

    // Check conflict with breaks
    const inBreak1 = break1Start !== null && break1End !== null && (slotStart < break1End && slotEnd > break1Start);
    const inBreak2 = break2Start !== null && break2End !== null && (slotStart < break2End && slotEnd > break2Start);

    if (conflict || inBreak1 || inBreak2) {
      if (conflict) {
        const appStart = timeToMinutes((conflict as any).time);
        const appDur = (conflict as any).duration || (conflict as any).serviceDuration || 30;
        currentTime = appStart + appDur + NO_SHOW_TOLERANCE_MINUTES;
      } else if (inBreak1) {
        const h = Math.floor(currentTime / 60);
        const m = currentTime % 60;
        allSlots.push({ 
          time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          isBreak: true 
        });
        currentTime = break1End;
      } else if (inBreak2) {
        const h = Math.floor(currentTime / 60);
        const m = currentTime % 60;
        allSlots.push({ 
          time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          isBreak: true 
        });
        currentTime = break2End;
      }
    } else {
      const h = Math.floor(currentTime / 60);
      const m = currentTime % 60;
      allSlots.push({ 
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      });
      currentTime += 15;
    }
  }

  return allSlots;
};

// ═══════════════════════════════════════════════════════════════
// 11. CHECK IF APPOINTMENT IS PAST TOLERANCE (helper)
// ═══════════════════════════════════════════════════════════════
export const isAppointmentPastTolerance = (appointmentTime: string, appointmentDate: string): boolean => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (appointmentDate !== todayStr) return false;

  const [h, m] = appointmentTime.split(':').map(Number);
  const appointmentDateTime = new Date();
  appointmentDateTime.setHours(h, m, 0, 0);
  appointmentDateTime.setMinutes(appointmentDateTime.getMinutes() + NO_SHOW_TOLERANCE_MINUTES);

  return now > appointmentDateTime;
};

// ═══════════════════════════════════════════════════════════════
// LEGACY COMPAT — updateAppointmentStatus (used by BarberDashboard)
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// 12. NO-SHOW JUSTIFICATION & RE-SCHEDULE AUTHORIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Permite al cliente enviar una justificación para su inasistencia
 * y solicitar una reprogramación sin costo.
 */
export const submitNoShowJustification = async (appointmentId: string, justification: string) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);
  try {
    const result = await runTransaction(db, async (transaction) => {
      const appDoc = await transaction.get(appointmentRef);
      if (!appDoc.exists()) throw new Error('La cita no existe.');

      const data = appDoc.data();

      transaction.update(appointmentRef, {
        noShowJustification: justification,
        rescheduleRequested: true,
        updatedAt: Timestamp.now(),
      });
      
      return data;
    });

    // --- Side Effects (Outside Transaction) ---
    createNotification({
      type: 'reschedule_request',
      message: `${result.userName} solicitó reprogramación por inasistencia`,
      branch: result.branch,
      targetRoles: ['admin', 'reception'],
      clientName: result.userName,
      barberName: result.barberName,
      service: result.serviceName,
      appointmentId,
    });

    logActivity({
      adminId: result.userId,
      adminRole: 'client',
      action: 'Solicitó reprogramación (No-Show)',
      details: `Cita ID: ${appointmentId}\nJustificación: ${justification}`,
      targetUserId: appointmentId,
    });

    return true;
  } catch (error) {
    console.error('Submit justification failed: ', error);
    throw error;
  }
};

/**
 * El administrador autoriza la reprogramación basada en la justificación.
 */
export const authorizeReschedule = async (appointmentId: string, adminId: string) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);
  try {
    const result = await runTransaction(db, async (transaction) => {
      const appDoc = await transaction.get(appointmentRef);
      if (!appDoc.exists()) throw new Error('La cita no existe.');

      const data = appDoc.data();

      transaction.update(appointmentRef, {
        rescheduleAuthorized: true,
        justificationReviewedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return data;
    });

    // --- Side Effects (Outside Transaction) ---
    createNotification({
      type: 'reschedule_authorized',
      message: `¡Tu reprogramación ha sido autorizada! Ya puedes agendar tu nueva cita.`,
      branch: result.branch,
      targetRoles: ['client'],
      targetUserId: result.userId,
      clientName: result.userName,
      barberName: result.barberName,
      service: result.serviceName,
      appointmentId,
    });

    logActivity({
      adminId,
      adminRole: 'admin',
      action: 'Autorizó reprogramación',
      details: `Cita ID: ${appointmentId} - Cliente: ${result.userName}`,
      targetUserId: appointmentId,
    });
    
    return true;
  } catch (error) {
    console.error('Authorize reschedule failed: ', error);
    throw error;
  }
};

export const updateAppointmentStatus = async (
  appointmentId: string,
  newStatus: AppointmentStatus,
  adminId: string,
  adminRole: 'admin' | 'reception' | 'client' | 'barber' | 'system',
  cancellationData?: { reason: string, type: string }
) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);

  try {
    const appData = await runTransaction(db, async (transaction) => {
      const appDoc = await transaction.get(appointmentRef);
      if (!appDoc.exists()) throw new Error('La cita no existe.');

      const data = appDoc.data();
      const updatePayload: any = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };

      // Add lifecycle timestamps
      if (newStatus === 'checked_in') updatePayload.checkedInAt = Timestamp.now();
      if (newStatus === 'completed') updatePayload.completedAt = Timestamp.now();
      if (newStatus === 'no_show') updatePayload.noShowMarkedAt = Timestamp.now();
      
      if (newStatus === 'cancelled') {
        updatePayload.cancelledAt = Timestamp.now();
        if (cancellationData) {
          updatePayload.cancellationReason = cancellationData.reason;
          updatePayload.cancellationType = cancellationData.type;
        }
      }

      if (newStatus === 'unhandled') {
        updatePayload.unhandledAt = Timestamp.now();
      }

      transaction.update(appointmentRef, updatePayload);
      return data;
    });

    // --- Side Effects (Outside Transaction) ---
    logActivity({
      adminId,
      adminRole,
      action: `Actualizó estado a ${newStatus}`,
      details: `Cita ID: ${appointmentId}\nCliente: ${appData.userName}\nNuevo Estado: ${newStatus}`,
      targetUserId: appointmentId,
    });

    // Update metrics on completion
    if (newStatus === 'completed') {
      await incrementDayMetrics(appData.barberId, appData.date, appData.branch, {
        appointmentsCompleted: 1,
        walkInsCompleted: appData.type === 'Walk-in' ? 1 : 0,
        revenue: appData.price || 0,
      });
    }
    if (newStatus === 'no_show') {
      await incrementDayMetrics(appData.barberId, appData.date, appData.branch, { noShows: 1 });
    }

    // NO-SHOW or CANCELLED notifications
    if (newStatus === 'cancelled' || newStatus === 'no_show') {
      createNotification({
        type: newStatus === 'cancelled' ? 'appointment_cancelled' : 'no_show_alert',
        message: newStatus === 'cancelled' 
          ? `Tu cita ha sido cancelada${cancellationData ? ': ' + cancellationData.reason : ''}`
          : `No-show marcado para la cita de ${appData.userName}`,
        branch: appData.branch,
        targetRoles: ['admin'],
        targetUserId: appData.userId, // Notificar al cliente también
        clientName: appData.userName,
        barberName: appData.barberName,
        appointmentId: appointmentId,
        date: appData.date,
        time: appData.time,
      });
    }
    return true;
  } catch (error) {
    console.error('Update status transaction failed: ', error);
    throw error;
  }
};

/**
 * Cleanup Service: Marks all past-due 'confirmed' or 'checked_in' appointments
 * as 'unhandled' if they are older than 2 hours from their scheduled time.
 */
export const cleanupExpiredAppointments = async (currentUserId?: string) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const appointmentsRef = collection(db, 'appointments');
    
    // Query active appointments that might be expired
    const q = query(
      appointmentsRef,
      where('status', 'in', ['confirmed', 'checked_in', 'En Local']),
      where('date', '<=', todayStr)
    );

    const snapshot = await getDocs(q);
    const now = new Date();
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const [hours, minutes] = data.time.split(':').map(Number);
      const apptDateTime = new Date(data.date);
      apptDateTime.setHours(hours, minutes, 0, 0);

      // Buffer: 120 minutes past the appointment time
      const expirationThreshold = new Date(apptDateTime.getTime() + 120 * 60 * 1000);

      if (now > expirationThreshold) {
        batch.update(docSnap.ref, {
          status: 'unhandled',
          updatedAt: Timestamp.now(),
          unhandledAt: Timestamp.now(),
          notes: (data.notes || '') + '\n[Auto-Expire: No se registró actividad]'
        });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`[Cleanup] Se marcaron ${count} citas como 'no manejadas'.`);
    }
  } catch (err) {
    console.error('[Cleanup Error]', err);
  }
};
