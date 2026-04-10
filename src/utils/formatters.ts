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
  // Parsing date (YYYY-MM-DD) and time (HH:mm)
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a Date object for the appointment START time in local time
  const appointmentStart = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  // Calculate appointment END time
  const appointmentEnd = new Date(appointmentStart.getTime() + durationMinutes * 60 * 1000);
  
  const now = new Date();
  const fourHoursInMs = 4 * 60 * 60 * 1000;
  
  // Return true if current time > end of service + tolerance
  // This works across midnight because we are comparing absolute timestamps
  return now.getTime() > (appointmentEnd.getTime() + fourHoursInMs);
};

export const canChangeStatus = (appointment: any, newStatus: string): { allowed: boolean; message?: string } => {
  const now = new Date();
  
  // Normalizar fecha de la cita
  const [year, month, day] = appointment.date.split('-').map(Number);
  const [appHour, appMin] = appointment.time.split(':').map(Number);
  const appointmentTime = new Date(year, month - 1, day, appHour, appMin, 0, 0);

  const diffMs = appointmentTime.getTime() - now.getTime();
  const diffMins = diffMs / (1000 * 60);

  // 1. Llegada (checked_in) - Solo si está CONFIRMADA y máximo 30 min antes
  if (newStatus === 'checked_in') {
    if (appointment.status !== 'confirmed') {
      return { allowed: false, message: "La llegada solo se puede marcar para citas confirmadas." };
    }
    if (diffMins > 30) {
      const minsLeft = Math.round(diffMins);
      return { 
        allowed: false, 
        message: `Faltan ${minsLeft} minutos para poder marcar la llegada (máx 30m antes).` 
      };
    }
  }

  // 2. Iniciar Corte (in_progress) - Solo si ya LLEGÓ (checked_in)
  if (newStatus === 'in_progress') {
    if (appointment.status !== 'checked_in') {
      return { 
        allowed: false, 
        message: "Primero debes marcar que el cliente 'Llegó' antes de iniciar el corte." 
      };
    }
    // Permitimos iniciar un poco antes si el cliente ya está ahí
    if (diffMins > 20) {
      return { 
        allowed: false, 
        message: `Aún es muy temprano para iniciar el servicio de las ${formatTime12h(appointment.time)}.` 
      };
    }
  }

  // 3. No Asistió (no_show) - Solo si está CONFIRMADA y han pasado 10 min
  if (newStatus === 'no_show') {
    if (appointment.status !== 'confirmed') {
      return {
        allowed: false,
        message: "No puedes marcar como 'No Asistió' si la cita ya inició o se canceló."
      };
    }
    // Tolerancia de 10 minutos después de la hora
    if (diffMins > -10) {
      const waitTime = Math.ceil(10 + diffMins);
      return { 
        allowed: false, 
        message: `Espera ${waitTime} minutos más para que termine el periodo de tolerancia.` 
      };
    }
  }

  // 4. Completar (completed) - Solo si está EN PROGRESO (in_progress)
  if (newStatus === 'completed') {
    if (appointment.status !== 'in_progress') {
      return {
        allowed: false,
        message: "Solo puedes completar una cita que esté marcada como 'Cortando'."
      };
    }
    
    // Validación de seguridad: mínimo 5 minutos de corte
    if (appointment.updatedAt) {
      const updatedAt = appointment.updatedAt.toDate ? appointment.updatedAt.toDate() : new Date(appointment.updatedAt);
      const elapsedMins = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
      if (elapsedMins < 5) {
        return {
          allowed: false,
          message: "El corte inició hace muy poco tiempo. Por favor espera a terminar el servicio."
        };
      }
    }
  }

  return { allowed: true };
};
