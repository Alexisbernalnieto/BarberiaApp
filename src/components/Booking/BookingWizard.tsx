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

// Helper: Time to Minutes
const timeToMinutes = (t: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

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
    if (!selectedBarber || !selectedDate || !selectedService) return false;
    
    const newStart = timeToMinutes(time);
    const newDuration = selectedService.duration || 30;
    const newEnd = newStart + newDuration + 10; // 10 min tolerance

    return existingAppointments.some((appt: Appointment) => {
      if (appt.date !== selectedDate) return false;
      if (appt.barberId !== (selectedBarber.uid || selectedBarber.id)) return false;
      if (appt.status === 'cancelled' || appt.status === 'no_show' || appt.status === 'rescheduled') return false;

      const appStart = timeToMinutes(appt.time);
      const appDuration = (appt as any).duration || (appt as any).serviceDuration || 30;
      const appEnd = appStart + appDuration + 10;

      // Overlap formula
      return (newStart < appEnd && newEnd > appStart);
    });
  };

  const generateTimeSlots = () => {
    if (!selectedDate || !selectedBranch || !selectedBarber || !selectedService) return [];
    
    const slots: string[] = [];
    let currentTime = timeToMinutes("10:00"); // Standard open time
    const closingTime = timeToMinutes("20:00"); // Standard close time
    const serviceDuration = selectedService.duration || 30;
    
    const now = new Date();
    const isToday = selectedDate === todayLocal;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Relevant apps for this barber & day
    const dayApps = existingAppointments
      .filter((a: any) => 
        a.date === selectedDate && 
        a.barberId === (selectedBarber.uid || selectedBarber.id) &&
        !['cancelled', 'no_show', 'rescheduled'].includes(a.status)
      )
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    // Logic: Advance through the day and find gaps
    while (currentTime + serviceDuration <= closingTime) {
      if (isToday && currentTime <= currentMins + 15) {
        currentTime += 5; // Skip past time
        continue;
      }

      // Check conflict
      const conflict = dayApps.find(app => {
        const appStart = timeToMinutes(app.time);
        const appDuration = (app as any).duration || (app as any).serviceDuration || 30;
        const appEnd = appStart + appDuration + 10;
        
        // Potential app range
        const newStart = currentTime;
        const newEnd = currentTime + serviceDuration + 10;

        return (newStart < appEnd && newEnd > appStart);
      });

      if (conflict) {
        // Jump to end of conflict
        const appStart = timeToMinutes(conflict.time);
        const appDuration = (conflict as any).duration || (conflict as any).serviceDuration || 30;
        currentTime = appStart + appDuration + 10;
      } else {
        slots.push(minutesToTime(currentTime));
        // Next candidate in 15 mins to avoid cluttered UI, 
        // but it will respect even "odd" start times if they come from a jump.
        currentTime += 15; 
      }
    }

    return slots;
  };

  const handleConfirm = async (directPaymentId?: string) => {
    // Use direct params to avoid stale closure when called from payment callback
    const finalPaymentId = directPaymentId || paymentIntentId;
    const finalIsPaid = !!directPaymentId || isPaid;

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
      paymentIntentId: finalPaymentId,
      paid: finalIsPaid,
      status: finalIsPaid ? 'confirmed' : 'pending_payment',
      createdAt: new Date().toISOString()
    };

    try {
      setBookingStatus('processing');
      const result = await createAppointment(appointmentData as any);
      setBookingStatus('success');
      setIsBookingInProgress(false);
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
                // Pass payment ID directly to avoid stale closure
                handleConfirm(id);
              }}
              onPaymentError={(err) => {
                  setBookingErrorMessage(err);
                  setBookingStatus('error');
              }}
              onBack={handleBack}
            />
          )}
        </Animated.View>

        {currentStep < 6 && (
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
            ) : null}
          </View>
        )}
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
