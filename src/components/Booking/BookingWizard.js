import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { SERVICES, BRANCHES, BARBERS as MOCK_BARBERS } from '../../data/mockData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BookingProgressBar from './BookingProgressBar';
import BookingStepBranch from './BookingStepBranch';
import BookingStepServices from './BookingStepServices';
import BookingStepBarbers from './BookingStepBarbers';
import BookingStepDateTime from './BookingStepDateTime';
import BookingStepConfirm from './BookingStepConfirm';
import { getBookingWizardStyles } from './BookingWizardStyles';

export const STEPS = [
  { id: 1, title: 'Sucursal', icon: 'office-building' },
  { id: 2, title: 'Servicio', icon: 'content-cut' },
  { id: 3, title: 'Barbero', icon: 'account-tie' },
  { id: 4, title: 'Horario', icon: 'clock-outline' },
  { id: 5, title: 'Confirmar', icon: 'check-decagram' }
];

export default function BookingWizard({ user, existingAppointments, onConfirm, onCancel, isWalkIn = false, COLORS, barbers }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = useMemo(
    () => getBookingWizardStyles(COLORS, isMobile),
    [COLORS, isMobile],
  );
  const dToday = new Date();
  const todayLocal = `${dToday.getFullYear()}-${String(dToday.getMonth() + 1).padStart(2, '0')}-${String(dToday.getDate()).padStart(2, '0')}`;

  const [currentStep, setCurrentStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [guestName, setGuestName] = useState(user?.name || '');
  const barberList = barbers && barbers.length ? barbers : MOCK_BARBERS;

  const goToStep = (step) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();
    setTimeout(() => setCurrentStep(step), 150);
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedBranch) goToStep(2);
    else if (currentStep === 2 && selectedService) goToStep(3);
    else if (currentStep === 3 && selectedBarber) goToStep(4);
    else if (currentStep === 4 && selectedDate && selectedTime) goToStep(5);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
    else if (onCancel) onCancel();
  };

  const isSlotTaken = (time) => {
    if (!selectedBarber || !selectedDate) return false;
    return existingAppointments.some(appt =>
      appt.date === selectedDate &&
      appt.time === time &&
      appt.barberId === selectedBarber.id
    );
  };

  const generateTimeSlots = () => {
    if (!selectedDate || !selectedBranch) return [];

    const dateObj = new Date(selectedDate + 'T00:00:00'); // Force local time interpretation
    const day = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Generates slots based on barber schedule
    const slots = [];

    if (selectedBarber && selectedBarber.schedule) {
      const schedule = selectedBarber.schedule[day];
      if (schedule && schedule.active) {
        const [startH, startM] = schedule.start.split(':').map(Number);
        const [endH, endM] = schedule.end.split(':').map(Number);

        let currentH = startH;
        let currentM = startM;

        while (currentH < endH || (currentH === endH && currentM < endM)) {
          slots.push(`${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`);

          currentM += 30;
          if (currentM >= 60) {
            currentH += 1;
            currentM -= 60;
          }
        }
      }
    } else {
      // Fallback to legacy branch logic if schedule is missing
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

    // Filtrar horarios pasados si es hoy
    const now = new Date();
    const isToday = selectedDate === todayLocal;

    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      return slots.filter(slot => {
        const [slotH, slotM] = slot.split(':').map(Number);
        if (slotH > currentHour) return true;
        if (slotH === currentHour && slotM > currentMinute) return true;
        return false;
      });
    }

    return slots;
  };

  const handleConfirm = () => {
    const appointmentData = {
      userId: user?.email || 'walkin-guest',
      userName: isWalkIn ? guestName : user.name,
      branch: selectedBranch,
      barberId: selectedBarber.id,
      barberName: selectedBarber.name,
      date: selectedDate,
      time: selectedTime,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      duration: selectedService.duration,
      status: 'Confirmado',
      type: isWalkIn ? 'Walk-in' : 'Online'
    };

    if (onConfirm) {
      onConfirm(appointmentData);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <BookingProgressBar
          styles={styles}
          currentStep={currentStep}
          STEPS={STEPS}
          COLORS={COLORS}
          isMobile={isMobile}
        />

        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {currentStep === 1 && (
            <BookingStepBranch
              styles={styles}
              COLORS={COLORS}
              BRANCHES={BRANCHES}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
            />
          )}
          {currentStep === 2 && (
            <BookingStepServices
              styles={styles}
              COLORS={COLORS}
              SERVICES={SERVICES}
              selectedBranch={selectedBranch}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
            />
          )}
          {currentStep === 3 && (
            <BookingStepBarbers
              styles={styles}
              COLORS={COLORS}
              BARBERS={barberList}
              selectedBranch={selectedBranch}
              selectedBarber={selectedBarber}
              setSelectedBarber={setSelectedBarber}
            />
          )}
          {currentStep === 4 && (
            <BookingStepDateTime
              styles={styles}
              COLORS={COLORS}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              selectedService={selectedService}
              todayLocal={todayLocal}
              generateTimeSlots={generateTimeSlots}
              isSlotTaken={isSlotTaken}
            />
          )}
          {currentStep === 5 && (
            <BookingStepConfirm
              styles={styles}
              COLORS={COLORS}
              isWalkIn={isWalkIn}
              guestName={guestName}
              setGuestName={setGuestName}
              user={user}
              selectedBranch={selectedBranch}
              selectedService={selectedService}
              selectedBarber={selectedBarber}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          )}
        </Animated.View>

        <View style={styles.footerActions} dataSet={{ footer: 'true' }}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.backBtn, currentStep === 1 && styles.disabledBtn]}
            onPress={handleBack}
            disabled={currentStep === 1 && !onCancel}
            dataSet={{ btn: 'true', btnGhost: 'true' }}
          >
            <Text style={styles.backBtnText}>{currentStep === 1 ? 'CANCELAR' : 'ATRÁS'}</Text>
          </TouchableOpacity>

          {currentStep < 5 ? (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.nextBtn,
                ((currentStep === 1 && !selectedBranch) ||
                  (currentStep === 2 && !selectedService) ||
                  (currentStep === 3 && !selectedBarber) ||
                  (currentStep === 4 && (!selectedDate || !selectedTime))) && styles.disabledBtn
              ]}
              onPress={handleNext}
              disabled={
                (currentStep === 1 && !selectedBranch) ||
                (currentStep === 2 && !selectedService) ||
                (currentStep === 3 && !selectedBarber) ||
                (currentStep === 4 && (!selectedDate || !selectedTime))
              }
              dataSet={{ btn: 'true', btnGold: 'true' }}
            >
              <Text style={styles.nextBtnText}>SIGUIENTE</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.textInverse} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={handleConfirm}
              dataSet={{ btn: 'true' }}
            >
              <Text style={styles.confirmBtnText}>CONFIRMAR CITA</Text>
              <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.textInverse} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
