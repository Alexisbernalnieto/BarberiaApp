import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, useWindowDimensions, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createAppointment } from '../../services/appointments';

// Componentes de pasos originales (estilo retro-moderno)
import BookingProgressBar from './BookingProgressBar';
import BookingStepBranch from './BookingStepBranch';
import BookingStepServices from './BookingStepServices';
import BookingStepBarbers from './BookingStepBarbers';
import BookingStepDateTime from './BookingStepDateTime';
import BookingStepConfirm from './BookingStepConfirm';
import BookingStepPayment from './BookingStepPayment';
import { getBookingWizardStyles } from './BookingWizardStyles';

export const STEPS = [
  { id: 1, title: 'Sucursal', icon: 'office-building' },
  { id: 2, title: 'Servicio', icon: 'content-cut' },
  { id: 3, title: 'Barbero', icon: 'account-tie' },
  { id: 4, title: 'Horario', icon: 'clock-outline' },
  { id: 5, title: 'Pago', icon: 'credit-card' },
  { id: 6, title: 'Confirmar', icon: 'check-decagram' }
];

const BookingWizard = ({ user, onConfirm, onCancel, COLORS, isWalkIn = false }: any) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = useMemo(() => getBookingWizardStyles(COLORS, isMobile), [COLORS, isMobile]);
  
  const { appointments: existingAppointments, barbers: dbBarbers, services: dbServices, branches: dbBranches } = useData();
  const barberList = dbBarbers;
  const serviceList = dbServices;
  const branchList = dbBranches;

  const [currentStep, setCurrentStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Estados originales
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guestName, setGuestName] = useState(user?.name || '');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  const dToday = new Date();
  const todayLocal = `${dToday.getFullYear()}-${String(dToday.getMonth() + 1).padStart(2, '0')}-${String(dToday.getDate()).padStart(2, '0')}`;

  const goToStep = (step: number) => {
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
    else if (currentStep === 4 && selectedDate && selectedTime) {
      if (isWalkIn) goToStep(6);
      else goToStep(5);
    }
    else if (currentStep === 5 && isPaid) goToStep(6);
  };

  const handleBack = () => {
    if (currentStep === 6 && isWalkIn) goToStep(4);
    else if (currentStep > 1) goToStep(currentStep - 1);
    else if (onCancel) onCancel();
  };

  // Lógica de validación de slots original
  const isSlotTaken = (time: string) => {
    if (!selectedBarber || !selectedDate) return false;
    return existingAppointments.some((appt: any) =>
      appt.date === selectedDate &&
      appt.time === time &&
      (appt.barberId === (selectedBarber.uid || selectedBarber.id)) &&
      appt.status !== 'cancelled'
    );
  };

  const generateTimeSlots = () => {
    if (!selectedDate || !selectedBranch) return [];
    
    // Simplificación de la lógica original de slots
    const slots = [];
    const startHour = 10;
    const endHour = 19;

    for (let h = startHour; h < endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }

    const now = new Date();
    const isToday = selectedDate === todayLocal;

    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      return slots.filter(slot => {
        const [slotH, slotM] = slot.split(':').map(Number);
        return slotH > currentHour || (slotH === currentHour && slotM > currentMinute);
      });
    }
    return slots;
  };

  const handleConfirm = async () => {
    const appointmentData = {
      userId: user?.email || 'walkin-guest',
      userName: isWalkIn ? guestName : user.name,
      branch: selectedBranch?.name || 'Sucursal Matriz',
      branchId: selectedBranch?.id || 'centro',
      barberId: selectedBarber.uid || selectedBarber.id,
      barberName: selectedBarber.name,
      date: selectedDate,
      time: selectedTime!,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      duration: selectedService.duration,
      type: isWalkIn ? 'Walk-in' : 'Online',
      paymentIntentId: paymentIntentId,
      paid: isPaid,
      status: 'confirmed'
    };

    try {
      const result = await createAppointment(appointmentData as any);
      onConfirm(result);
    } catch (error: any) {
      alert(error.message || "Error al crear la cita");
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
              BRANCHES={branchList}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
            />
          )}
          {currentStep === 2 && (
            <BookingStepServices
              styles={styles}
              COLORS={COLORS}
              SERVICES={serviceList.filter(s => s.branch === 'Ambas' || s.branch === selectedBranch?.name)}
              selectedBranch={selectedBranch?.name}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
            />
          )}
          {currentStep === 3 && (
            <BookingStepBarbers
              styles={styles}
              COLORS={COLORS}
              BARBERS={barberList.filter(b => b.branch === selectedBranch?.name || b.branch === 'Ambas')}
              selectedBranch={selectedBranch?.name}
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
            <BookingStepPayment
              styles={styles}
              COLORS={COLORS}
              selectedService={selectedService}
              onPaymentSuccess={(id) => {
                setPaymentIntentId(id);
                setIsPaid(true);
                goToStep(6);
              }}
              onPaymentError={(err) => alert(err)}
            />
          )}
          {currentStep === 6 && (
            <BookingStepConfirm
              styles={styles}
              COLORS={COLORS}
              isWalkIn={isWalkIn}
              guestName={guestName}
              setGuestName={setGuestName}
              user={user}
              selectedBranch={selectedBranch?.name}
              selectedService={selectedService}
              selectedBarber={selectedBarber}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              isPaid={isPaid}
            />
          )}
        </Animated.View>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.backBtn, currentStep === 1 && styles.disabledBtn]}
            onPress={handleBack}
            disabled={currentStep === 1 && !onCancel}
          >
            <Text style={styles.backBtnText}>{currentStep === 1 ? 'CANCELAR' : 'ATRÁS'}</Text>
          </TouchableOpacity>

          {currentStep < 6 ? (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.nextBtn,
                ((currentStep === 1 && !selectedBranch) ||
                  (currentStep === 2 && !selectedService) ||
                  (currentStep === 3 && !selectedBarber) ||
                  (currentStep === 4 && (!selectedDate || !selectedTime)) ||
                  (currentStep === 5 && !isPaid)) && styles.disabledBtn
              ]}
              onPress={handleNext}
              disabled={
                (currentStep === 1 && !selectedBranch) ||
                (currentStep === 2 && !selectedService) ||
                (currentStep === 3 && !selectedBarber) ||
                (currentStep === 4 && (!selectedDate || !selectedTime)) ||
                (currentStep === 5 && !isPaid)
              }
            >
              <Text style={styles.nextBtnText}>SIGUIENTE</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.textInverse} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>CONFIRMAR CITA</Text>
              <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.textInverse} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default BookingWizard;
