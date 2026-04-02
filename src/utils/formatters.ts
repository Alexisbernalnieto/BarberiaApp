export const formatFullDate = (dateInput: string | Date) => {
  if (!dateInput) return '';
  
  let year, month, day, date;
  
  if (typeof dateInput === 'string') {
    [year, month, day] = dateInput.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = dateInput;
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
  }
  
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  return `${days[date.getDay()]} ${day} de ${months[month-1]} ${year}`;
};

export const formatTime12h = (timeInput: string | Date) => {
  if (!timeInput) return '';
  
  let hour, minute;
  
  if (typeof timeInput === 'string') {
    [hour, minute] = timeInput.split(':').map(Number);
  } else {
    hour = timeInput.getHours();
    minute = timeInput.getMinutes();
  }
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
};

export const getLocalTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Checks if a YYYY-MM-DD string matches the local date.
 * Handles potential timezone edge cases by comparing string to string.
 */
export const isDateToday = (dateStr: string, todayOverride?: string) => {
  return dateStr === (todayOverride || getLocalTodayString());
};

export const isDateTomorrow = (dateStr: string) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  return dateStr === `${y}-${m}-${d}`;
};

export const isAppointmentExpired = (date: string, time: string, durationMinutes: number = 45) => {
  const today = getLocalTodayString();
  
  // 1. If date is before today, it's expired
  if (date < today) return true;
  
  // 2. If date is in the future, it's not expired
  if (date > today) return false;
  
  // 3. If it's today, check if current time is past (appointment time + duration + 2 hour tolerance)
  const [hours, minutes] = time.split(':').map(Number);
  const appEndTime = new Date();
  appEndTime.setHours(hours, minutes + durationMinutes, 0, 0);
  
  const now = new Date();
  const twoHoursInMs = 2 * 60 * 60 * 1000;
  
  // Return true if current time > end of service + tolerance
  return now.getTime() > (appEndTime.getTime() + twoHoursInMs);
};

export const canChangeStatus = (appointment: any, newStatus: string): { allowed: boolean; message?: string } => {
  const now = new Date();
  
  // Normalizar fecha de la cita
  const [year, month, day] = appointment.date.split('-').map(Number);
  const [appHour, appMin] = appointment.time.split(':').map(Number);
  const appointmentTime = new Date(year, month - 1, day, appHour, appMin, 0, 0);

  const diffMs = appointmentTime.getTime() - now.getTime();
  const diffMins = diffMs / (1000 * 60);

  // 1. Llegada (checked_in) - Máximo 60 min antes
  if (newStatus === 'checked_in') {
    if (diffMins > 30) {
      const hoursLeft = Math.floor(diffMins / 60);
      const minsLeft = Math.round(diffMins % 60);
      let waitMsg = `Aún es muy temprano.`;
      if (hoursLeft > 0) {
        waitMsg += ` Faltan ${hoursLeft}h ${minsLeft}m para la cita.`;
      } else {
        waitMsg += ` Faltan ${minsLeft} minutos para poder marcar la llegada (máx 30m antes).`;
      }
      return { 
        allowed: false, 
        message: waitMsg 
      };
    }
  }

  // 2. Iniciar Corte (in_progress) - Máximo 15 min antes y debe haber llegado
  if (newStatus === 'in_progress') {
    if (appointment.status !== 'checked_in') {
      return { 
        allowed: false, 
        message: "El cliente aún no ha sido marcado como 'En Barbería'. Primero confirma su llegada." 
      };
    }
    if (diffMins > 15) {
      return { 
        allowed: false, 
        message: `Aún no es hora de iniciar el corte. La cita es a las ${formatTime12h(appointment.time)}.` 
      };
    }
  }

  // 3. No Asistió (no_show) - Mínimo 15 min DESPUÉS de la hora de inicio y no debe haber iniciado
  if (newStatus === 'no_show') {
    if (appointment.status === 'in_progress') {
      return {
        allowed: false,
        message: "No puedes marcar como 'No Asistió' una cita que ya ha iniciado."
      };
    }
    if (diffMins > -15) {
      const waitTime = Math.ceil(15 + diffMins);
      return { 
        allowed: false, 
        message: `Debes esperar ${waitTime} minutos más para que termine el periodo de tolerancia de 15 minutos.` 
      };
    }
  }

  // 4. Completar (completed) - Mínimo 5 min si estaba en progreso
  if (newStatus === 'completed') {
    if (appointment.status !== 'in_progress') {
      return {
        allowed: false,
        message: "Solo puedes completar una cita que ya esté en progreso."
      };
    }
    if (appointment.updatedAt) {
      const updatedAt = appointment.updatedAt.toDate ? appointment.updatedAt.toDate() : new Date(appointment.updatedAt);
      const elapsedMins = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
      if (elapsedMins < 5) {
        return {
          allowed: false,
          message: "El corte inició hace menos de 5 minutos. Asegúrate de que el servicio realmente haya terminado."
        };
      }
    }
  }

  return { allowed: true };
};
