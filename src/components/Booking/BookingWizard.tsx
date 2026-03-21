import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, useWindowDimensions, TextInput, Modal } from 'react-native';
import { 
    Scissors, 
    User, 
    Clock, 
    CheckCircle2, 
    ArrowRight,
    Building2,
    CalendarCheck,
    CheckSquare,
    CreditCard,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createAppointment } from '../../services/appointments';

import BookingProgressBar from './BookingProgressBar';
import BookingStepBranch from './BookingStepBranch';
import BookingStepServices from './BookingStepServices';
import BookingStepBarbers from './BookingStepBarbers';
import BookingStepDateTime from './BookingStepDateTime';
import BookingStepConfirm from './BookingStepConfirm';
import BookingStepPayment from './BookingStepPayment';
import { getBookingWizardStyles } from './BookingWizardStyles';
import { AppUser, Appointment } from '../../types';

export const STEPS = [
  { id: 1, title: 'Sucursal', icon: Building2 },
  { id: 2, title: 'Servicio', icon: Scissors },
  { id: 3, title: 'Barbero', icon: User },
  { id: 4, title: 'Horario', icon: Clock },
  { id: 5, title: 'Pago', icon: CreditCard },
  { id: 6, title: 'Confirmar', icon: CheckSquare }
];

export default function BookingWizard({ 
    user, 
    onConfirm, 
    onCancel, 
    isWalkIn = false, 
    COLORS,
}: {
    user: AppUser | null;
    onConfirm: (data: any) => void;
    onCancel?: () => void;
    isWalkIn?: boolean;
    COLORS: any;
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = useMemo(
    () => getBookingWizardStyles(COLORS, isMobile),
    [COLORS, isMobile],
  );
  
  const { appointments: existingAppointments, barbers: dbBarbers, services: dbServices, branches: dbBranches } = useData();
  
  const branchList = dbBranches?.length > 0 ? dbBranches : [];
  const serviceList = dbServices?.length > 0 ? dbServices : [];
  const barberList = dbBarbers?.length > 0 ? dbBarbers : [];

  const [currentStep, setCurrentStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guestName, setGuestName] = useState(user?.name || '');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [bookingErrorMessage, setBookingErrorMessage] = useState('');

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

  const isSlotTaken = (time: string) => {
    if (!selectedBarber || !selectedDate) return false;
    return existingAppointments.some((appt: Appointment) =>
      appt.date === selectedDate &&
      appt.time === time &&
      (appt.barberId === (selectedBarber.uid || selectedBarber.id)) &&
      appt.status !== 'cancelled'
    );
  };

  const generateTimeSlots = () => {
    if (!selectedDate || !selectedBranch) return [];
    
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
        return slotH > currentHour || (slotH === currentHour && slotM > currentMinute);
      });
    }

    return slots;
  };

  const handleConfirm = async () => {
    const appointmentData = {
      userId: user?.uid || 'walkin-guest',
      userName: isWalkIn ? guestName : user?.name,
      userEmail: user?.email || '',
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
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    try {
      setBookingStatus('processing');
      const result = await createAppointment(appointmentData as any);
      setBookingStatus('success');
    } catch (error: any) {
      setBookingErrorMessage(error.message || "Error al crear la cita");
      setBookingStatus('error');
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
              SERVICES={serviceList.filter((s: any) => s.branch === 'Ambas' || s.branch === selectedBranch?.name)}
              selectedBranch={selectedBranch?.name}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
            />
          )}
          {currentStep === 3 && (
            <BookingStepBarbers
              styles={styles}
              COLORS={COLORS}
              BARBERS={barberList.filter((b: any) => b.branch === selectedBranch?.name || b.branch === 'Ambas')}
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
              onPaymentStart={() => setBookingStatus('processing')}
              onPaymentSuccess={(id) => {
                setPaymentIntentId(id);
                setIsPaid(true);
                setBookingStatus('idle');
                goToStep(6);
              }}
              onPaymentError={(err) => {
                setBookingErrorMessage(err);
                setBookingStatus('error');
              }}
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
              <ArrowRight size={18} color={COLORS.textInverse || "#000"} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>CONFIRMAR CITA</Text>
              <CheckCircle2 size={18} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* MODALES DE ESTADO */}
      <Modal visible={bookingStatus === 'processing'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
              <View style={styles.loadingPulse} />
            </View>
            <Text style={styles.modalTitle}>Procesando...</Text>
            <Text style={styles.modalMessage}>Estamos asegurando tu lugar en El Coronel. No cierres esta ventana.</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={bookingStatus === 'success'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <CheckCircle2 size={32} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>¡Todo listo!</Text>
            <Text style={styles.modalMessage}>Tu cita ha sido agendada con éxito. Te esperamos pronto.</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#D4AF37' }]} onPress={() => {
                setBookingStatus('idle');
                if (onConfirm) onConfirm({});
            }}>
              <Text style={[styles.modalBtnText, { color: '#000' }]}>EXCELENTE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={bookingStatus === 'error'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <AlertTriangle size={32} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Lo sentimos</Text>
            <Text style={styles.modalMessage}>{bookingErrorMessage || "Hubo un error al procesar tu solicitud."}</Text>
            <TouchableOpacity style={[styles.modalBtn, styles.cancelModalBtn]} onPress={() => setBookingStatus('idle')}>
              <Text style={styles.modalBtnText}>VOLVER A INTENTAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
