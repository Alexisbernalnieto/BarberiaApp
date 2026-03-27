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
