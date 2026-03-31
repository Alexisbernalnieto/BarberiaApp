// src/services/barberTracking.ts
// ═══════════════════════════════════════════════════════════════
// Barber Work Tracking Service
// Registers daily work hours, appointment metrics, and revenue
// per barber per branch. Data stored in `barber_day_logs` collection.
// ═══════════════════════════════════════════════════════════════
import { db } from '@/firebaseClient';
import { doc, getDoc, setDoc, updateDoc, Timestamp, increment, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { BarberDayLog } from '@/types';

/**
 * Generates a unique document ID for a barber's daily log.
 */
const getDayLogId = (barberId: string, date: string) =>
  `log_${barberId}_${date}`;

/**
 * Gets or creates a barber day log document.
 */
const ensureDayLog = async (barberId: string, date: string, branch: string, barberName?: string) => {
  const logId = getDayLogId(barberId, date);
  const logRef = doc(db, 'barber_day_logs', logId);
  const logDoc = await getDoc(logRef);

  if (!logDoc.exists()) {
    const newLog: Omit<BarberDayLog, 'id'> = {
      barberId,
      barberName: barberName || 'Barbero',
      branch,
      date,
      appointmentsCompleted: 0,
      walkInsCompleted: 0,
      noShows: 0,
      revenue: 0,
    };
    await setDoc(logRef, newLog);
    return { id: logId, ...newLog } as BarberDayLog;
  }

  return { id: logDoc.id, ...logDoc.data() } as BarberDayLog;
};

/**
 * Increments daily metrics for a barber.
 * Called automatically when appointments are completed, walk-ins finish, or no-shows occur.
 */
export const incrementDayMetrics = async (
  barberId: string,
  date: string,
  branch: string,
  metrics: {
    appointmentsCompleted?: number;
    walkInsCompleted?: number;
    noShows?: number;
    revenue?: number;
  }
) => {
  try {
    const logId = getDayLogId(barberId, date);
    const logRef = doc(db, 'barber_day_logs', logId);
    const logDoc = await getDoc(logRef);

    if (!logDoc.exists()) {
      await ensureDayLog(barberId, date, branch);
    }

    const updates: any = {};
    if (metrics.appointmentsCompleted) updates.appointmentsCompleted = increment(metrics.appointmentsCompleted);
    if (metrics.walkInsCompleted) updates.walkInsCompleted = increment(metrics.walkInsCompleted);
    if (metrics.noShows) updates.noShows = increment(metrics.noShows);
    if (metrics.revenue) updates.revenue = increment(metrics.revenue);

    if (Object.keys(updates).length > 0) {
      await updateDoc(logRef, updates);
    }
  } catch (error) {
    console.error('[BarberTracking] Error updating metrics:', error);
  }
};

/**
 * Records barber clock-in time.
 */
export const clockInBarber = async (barberId: string, date: string, branch: string, barberName: string) => {
  await ensureDayLog(barberId, date, branch, barberName);
  const logRef = doc(db, 'barber_day_logs', getDayLogId(barberId, date));
  await updateDoc(logRef, {
    clockIn: Timestamp.now(),
    barberName,
  });
};

/**
 * Records barber clock-out time and calculates total minutes.
 */
export const clockOutBarber = async (barberId: string, date: string) => {
  const logRef = doc(db, 'barber_day_logs', getDayLogId(barberId, date));
  const logDoc = await getDoc(logRef);

  if (!logDoc.exists()) return;

  const data = logDoc.data();
  const clockIn = data.clockIn?.toDate?.() || null;
  const clockOut = new Date();

  let totalMinutes = data.totalMinutes || 0;
  if (clockIn) {
    totalMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / 60000);
  }

  await updateDoc(logRef, {
    clockOut: Timestamp.now(),
    totalMinutes,
  });
};

/**
 * Marks a barber as absent for a given date.
 */
export const markBarberAbsent = async (barberId: string, date: string, branch: string, barberName: string, adminId: string) => {
  await ensureDayLog(barberId, date, branch, barberName);
  const logRef = doc(db, 'barber_day_logs', getDayLogId(barberId, date));
  await updateDoc(logRef, {
    isAbsent: true,
    absentMarkedAt: Timestamp.now(),
    absentMarkedBy: adminId,
  });
};

/**
 * Gets a barber's day log for a specific date.
 */
export const getBarberDayLog = async (barberId: string, date: string): Promise<BarberDayLog | null> => {
  const logRef = doc(db, 'barber_day_logs', getDayLogId(barberId, date));
  const logDoc = await getDoc(logRef);
  if (!logDoc.exists()) return null;
  return { id: logDoc.id, ...logDoc.data() } as BarberDayLog;
};

/**
 * Gets all barber day logs for a given date (all barbers).
 */
export const getAllBarberLogsForDate = async (date: string): Promise<BarberDayLog[]> => {
  const q = query(
    collection(db, 'barber_day_logs'),
    where('date', '==', date)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BarberDayLog));
};
