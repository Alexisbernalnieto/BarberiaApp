import { Appointment } from '@/types';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay, 
  subWeeks, 
  parseISO,
  isWithinInterval,
  differenceInMinutes
} from 'date-fns';

export interface DailyStats {
  day: string;
  amount: number;
  date: Date;
}

export interface WeeklyMetrics {
  weekStart: Date;
  weekEnd: Date;
  totalEarnings: number;
  totalTrips: number;
  onlineMinutes: number;
  dailyData: DailyStats[];
}

export const getBarberMetricsForDateRange = (
  appointments: Appointment[],
  barberId: string,
  startDate: Date,
  endDate: Date
) => {
  const filtered = appointments.filter(app => 
    app.barberId === barberId && 
    app.status === 'completed' &&
    app.date &&
    isWithinInterval(parseISO(app.date), { start: startDate, end: endDate })
  );

  const totalEarnings = filtered.reduce((sum, app) => sum + (app.price || 0), 0);
  const totalTrips = filtered.length;
  
  // Estimate online time based on duration (default 30 min if missing)
  const onlineMinutes = filtered.reduce((sum, app) => {
    return sum + (app.duration || 30);
  }, 0);

  return { totalEarnings, totalTrips, onlineMinutes, appointments: filtered };
};

export const calculateWeeklyMetrics = (
  appointments: Appointment[],
  selectedWeekStart: Date = new Date(),
  filters?: { branchId: string; startDate?: string | Date; endDate?: string | Date }
): WeeklyMetrics & { appointments: Appointment[] } => {
  const parseDate = (d: string | Date | undefined) => {
    if (!d) return undefined;
    return typeof d === 'string' ? parseISO(d) : d;
  };

  const filterStart = parseDate(filters?.startDate);
  const filterEnd = parseDate(filters?.endDate);

  const weekStart = filterStart || startOfWeek(selectedWeekStart, { weekStartsOn: 1 });
  const weekEnd = filterEnd || endOfWeek(weekStart, { weekStartsOn: 1 });

  const filtered = appointments.filter(app => {
    const appDate = parseISO(app.date);
    const inRange = isWithinInterval(appDate, { start: weekStart, end: weekEnd });
    const statusOk = app.status === 'completed';
    const branchOk = !filters?.branchId || filters.branchId === 'all' || app.branchId === filters.branchId;
    return inRange && statusOk && branchOk;
  });

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const dailyData: DailyStats[] = days.map(day => {
    const dayAppointments = filtered.filter(app => isSameDay(parseISO(app.date), day));

    return {
      day: format(day, 'EEE'),
      amount: dayAppointments.reduce((sum, app) => sum + (app.price || 0), 0),
      date: day
    };
  });

  const totalEarnings = filtered.reduce((sum, app) => sum + (app.price || 0), 0);
  const totalTrips = filtered.length;
  const onlineMinutes = filtered.reduce((sum, app) => sum + (app.duration || 30), 0);

  return {
    weekStart,
    weekEnd,
    totalEarnings,
    totalTrips,
    onlineMinutes,
    dailyData,
    appointments: filtered
  };
};

export const getPastWeeks = (
  appointments: Appointment[],
  numWeeks: number = 8
): WeeklyMetrics[] => {
  const weeks: WeeklyMetrics[] = [];
  const today = new Date();

  for (let i = 0; i < numWeeks; i++) {
    const targetDate = subWeeks(today, i);
    const metrics = calculateWeeklyMetrics(appointments, targetDate);
    weeks.push(metrics);
  }

  return weeks;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};
