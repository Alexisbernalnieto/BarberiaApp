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
import { useSidebar } from '../../context/SidebarContext';
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
  { id: 5, title: 'Resumen', icon: CheckSquare },
  { id: 6, title: 'Pago', icon: CreditCard }
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
  const { setIsBookingInProgress } = useSidebar();
  
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
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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
    else if (currentStep === 4 && selectedDate && selectedTime) goToStep(5);
    else if (currentStep === 5) goToStep(6);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    } else {
      if (selectedBranch && onCancel) {
        setShowExitConfirm(true);
      } else if (onCancel) {
        onCancel();
      }
    }
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
      status: isPaid ? 'confirmed' : 'pending_payment',
      createdAt: new Date().toISOString()
    };

    try {
      setBookingStatus('processing');
      const result = await createAppointment(appointmentData as any);
      setBookingStatus('success');
      setIsBookingInProgress(false);
      onConfirm(result);
    } catch (error: any) {
      setBookingErrorMessage(error.message || "Error al crear la cita");
      setBookingStatus('error');
    }
  };

  // Track progress for global guard
  useEffect(() => {
    if (selectedBranch || currentStep > 1) {
        setIsBookingInProgress(true);
    }
    
    // Cleanup on unmount
    return () => {
        setIsBookingInProgress(false);
    };
  }, [selectedBranch, currentStep]);

  const confirmWizardExit = () => {
    setIsBookingInProgress(false);
    setShowExitConfirm(false);
    if (onCancel) onCancel();
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
          {currentStep === 6 && (
            <BookingStepPayment
              styles={styles}
              COLORS={COLORS}
              selectedService={selectedService}
              onPaymentStart={() => setBookingStatus('processing')}
              onPaymentSuccess={(id) => {
                setPaymentIntentId(id);
                setIsPaid(true);
                setBookingStatus('idle');
                // goToStep(6); // Confirmation step is now step 5, payment is step 6
              }}
              onPaymentError={(err) => {
                  setBookingErrorMessage(err);
                  setBookingStatus('error');
              }}
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
              <ArrowRight size={18} color={COLORS.textInverse || "#000"} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : currentStep === 5 ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.nextBtn]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>PROCEDER AL PAGO</Text>
              <ArrowRight size={18} color={COLORS.textInverse || "#000"} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn, !isPaid && styles.disabledBtn]}
              onPress={handleConfirm}
              disabled={!isPaid}
            >
              <Text style={styles.confirmBtnText}>FINALIZAR RESERVA</Text>
              <CheckCircle2 size={18} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* MODAL DE CONFIRMACIÓN DE SALIDA */}
      <Modal visible={showExitConfirm} transparent animationType="fade" onRequestClose={() => setShowExitConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <AlertTriangle size={32} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>¿Abandonar proceso?</Text>
            <Text style={styles.modalMessage}>Si sales ahora perderás los datos seleccionados para tu cita. ¿Estás seguro de que deseas salir?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelModalBtn]} onPress={() => setShowExitConfirm(false)}>
                <Text style={styles.modalBtnText}>CONTINUAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmModalBtn]} onPress={confirmWizardExit}>
                <Text style={styles.modalBtnText}>SÍ, SALIR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODALES DE ESTADO */}
      <Modal visible={bookingStatus === 'processing'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
              <View style={{ width: 32, height: 32, borderRadius: 16, borderLeftColor: 'var(--gold)', borderTopColor: 'var(--gold)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftWidth: 3, borderTopWidth: 3 }} />
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
            <Text style={styles.modalTitle}>¡Cita Agendada!</Text>
            <Text style={styles.modalMessage}>Tu reserva en El Coronel ha sido confirmada con éxito. Te esperamos pronto.</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: 'var(--gold)' }]} onPress={() => {
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
            <Text style={styles.modalTitle}>Algo salió mal</Text>
            <Text style={styles.modalMessage}>{bookingErrorMessage || "No pudimos procesar tu cita en este momento. Por favor intenta de nuevo."}</Text>
            <TouchableOpacity style={[styles.modalBtn, styles.cancelModalBtn]} onPress={() => setBookingStatus('idle')}>
              <Text style={styles.modalBtnText}>REINTENTAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
