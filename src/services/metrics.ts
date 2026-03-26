import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { Appointment } from '../types';

export const calculateMonthlyRevenue = (appointments: Appointment[]) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return appointments.reduce((acc, app) => {
    if (!app.date || app.status === 'cancelled' || !app.paid) return acc;
    const appDate = new Date(app.date);
    if (appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear) {
      return acc + (app.price || 0);
    }
    return acc;
  }, 0);
};

export const getTodayAppointmentsStats = (appointments: Appointment[]) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(app => app.date === todayStr);
  
  const completed = todayAppointments.filter(app => app.status === 'completed' || app.paid).length;
  const cancelled = todayAppointments.filter(app => app.status === 'cancelled').length;
  const total = todayAppointments.length;
  
  return { completed, cancelled, total };
};

export const getTopServiceMonth = (appointments: Appointment[]) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const servicesCount: Record<string, number> = {};

  appointments.forEach(app => {
    if (!app.date || app.status === 'cancelled') return;
    const appDate = new Date(app.date);
    if (appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear) {
        // Asumiendo que `serviceName` está disponible en la raíz de cada Appointment (según los tipos definidos).
        if (app.serviceName) {
            servicesCount[app.serviceName] = (servicesCount[app.serviceName] || 0) + 1;
        }
    }
  });

  let topService = 'Ninguno';
  let maxCount = 0;

  Object.entries(servicesCount).forEach(([service, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topService = service;
    }
  });

  return topService;
};

export const fetchNewUsersCount = async () => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Consultar usando ISO string as createdAt was stored as toISOString() in AuthContext.tsx
        const q = query(
            collection(db, 'users'), 
            where('createdAt', '>=', startOfMonth.toISOString())
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (e) {
        console.error("Error fetching new users:", e);
        return 0;
    }
};

export const getMonthlyRevenueByDay = (appointments: Appointment[]) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Initialize array with 0 for all days of the current month
  const dailyRevenue = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    revenue: 0,
  }));

  appointments.forEach(app => {
    if (!app.date || app.status === 'cancelled' || !app.paid) return;
    const appDate = new Date(app.date);
    if (appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear) {
      const day = appDate.getDate();
      // day is 1-indexed, array matches because day - 1 is index
      dailyRevenue[day - 1].revenue += (app.price || 0);
    }
  });

  return dailyRevenue;
};
