export const isSlotTaken = (existingAppointments, selectedBarber, selectedDate, time) => {
  if (!selectedBarber || !selectedDate) return false;
  return existingAppointments.some(
    (appt) =>
      appt.date === selectedDate &&
      appt.time === time &&
      appt.barberId === selectedBarber.id
  );
};

export const generateTimeSlots = (
  selectedDate,
  selectedBranch,
  selectedBarber,
  todayLocal
) => {
  if (!selectedDate || !selectedBranch) return [];

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const day = dateObj.getDay();

  const slots = [];

  if (selectedBarber && selectedBarber.schedule) {
    const schedule = selectedBarber.schedule[day];
    if (schedule && schedule.active) {
      const [startH, startM] = schedule.start.split(':').map(Number);
      const [endH, endM] = schedule.end.split(':').map(Number);

      let currentH = startH;
      let currentM = startM;

      while (currentH < endH || (currentH === endH && currentM < endM)) {
        slots.push(
          `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`
        );

        currentM += 30;
        if (currentM >= 60) {
          currentH += 1;
          currentM -= 60;
        }
      }
    }
  } else {
    let startHour = 10;
    let endHour = 19;

    if (selectedBranch === 'Centro') {
      if (day === 0) endHour = 15;
      else endHour = 19;
    } else if (selectedBranch === 'Lomas') {
      if (day === 0) endHour = 15;
      else endHour = 20;
    }

    for (let h = startHour; h < endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
  }

  const now = new Date();
  const isToday = selectedDate === todayLocal;

  if (isToday) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return slots.filter((slot) => {
      const [slotH, slotM] = slot.split(':').map(Number);
      if (slotH > currentHour) return true;
      if (slotH === currentHour && slotM > currentMinute) return true;
      return false;
    });
  }

  return slots;
};

