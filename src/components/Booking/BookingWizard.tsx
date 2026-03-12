import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { 
    OfficeBuilding, 
    Scissors, 
    User, 
    Clock, 
    CheckCircle2, 
    ArrowRight,
    Building2,
    CalendarCheck,
    CheckSquare
} from 'lucide-react';
import BookingProgressBar from './BookingProgressBar';
import BookingStepBranch from './BookingStepBranch';
import BookingStepServices from './BookingStepServices';
import BookingStepBarbers from './BookingStepBarbers';
import BookingStepDateTime from './BookingStepDateTime';
import BookingStepConfirm from './BookingStepConfirm';
import { getBookingWizardStyles } from './BookingWizardStyles';
import { AppUser, Appointment } from '../../types';

export const STEPS = [
  { id: 1, title: 'Sucursal', icon: Building2 },
  { id: 2, title: 'Servicio', icon: Scissors },
  { id: 3, title: 'Barbero', icon: User },
  { id: 4, title: 'Horario', icon: Clock },
  { id: 5, title: 'Confirmar', icon: CheckSquare }
];

interface BookingWizardProps {
  user: AppUser | null;
  existingAppointments: Appointment[];
  onConfirm: (data: any) => void;
  onCancel?: () => void;
  isWalkIn?: boolean;
  COLORS: any;
  barbers: AppUser[];
}

export default function BookingWizard({ 
    user, 
    existingAppointments, 
    onConfirm, 
    onCancel, 
    isWalkIn = false, 
    COLORS, 
    barbers 
}: BookingWizardProps) {
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

  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(todayLocal);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guestName, setGuestName] = useState(user?.name || '');

  const BRANCHES = [
    { name: 'Centro', address: 'Av. Juárez 100, Col. Centro' },
    { name: 'Lomas', address: 'Blvd. Lomas 500, Suites' }
  ];

  const SERVICES = [
    { id: '1', name: 'Corte Clásico', price: 250, duration: 45 },
    { id: '2', name: 'Barba Executive', price: 180, duration: 30 },
    { id: '3', name: 'Combo Coronel', price: 380, duration: 75 }
  ];

  const goToStep = (step: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();
    setTimeout(() => setCurrentStep(step), 150);
  };

  const handleNext = () => {
    if (currentStep < 5) goToStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
    else if (onCancel) onCancel();
  };

  const isSlotTaken = (time: string) => {
    if (!selectedBarber || !selectedDate) return false;
    return existingAppointments.some(appt =>
      appt.date === selectedDate &&
      appt.time === time &&
      appt.barberId === selectedBarber.uid
    );
  };

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 10;
    const endHour = 20;

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
      userName: isWalkIn ? guestName : user?.name,
      branch: selectedBranch,
      barberId: selectedBarber.uid,
      barberName: selectedBarber.name,
      date: selectedDate,
      time: selectedTime,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      duration: selectedService.duration,
      status: 'Confirmado',
      type: isWalkIn ? 'Walk-in' : 'Online',
    };

    onConfirm(appointmentData);
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
              BARBERS={barbers}
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

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.backBtn, currentStep === 1 && !onCancel && styles.disabledBtn]}
            onPress={handleBack}
            disabled={currentStep === 1 && !onCancel}
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
            >
              <Text style={styles.nextBtnText}>SIGUIENTE</Text>
              <ArrowRight size={18} color="#000" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={handleConfirm}
              data-primary-btn="true"
            >
              <Text style={styles.confirmBtnText}>CONFIRMAR CITA</Text>
              <CheckCircle2 size={18} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
