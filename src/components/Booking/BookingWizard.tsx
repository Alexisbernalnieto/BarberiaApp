import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, useWindowDimensions, TextInput, Modal, ActivityIndicator } from 'react-native';
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
import { createAppointment, generateAppointmentId, getAvailableSlotsForBarber } from '../../services/appointments';
import { AppUser, Appointment, TimeSlot } from '../../types';

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
  const dToday = new Date();
  const todayLocal = `${dToday.getFullYear()}-${String(dToday.getMonth() + 1).padStart(2, '0')}-${String(dToday.getDate()).padStart(2, '0')}`;

  const [selectedDate, setSelectedDate] = useState(todayLocal);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showNoSlotsModal, setShowNoSlotsModal] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [bookingErrorMessage, setBookingErrorMessage] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

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
      if (!previewId) {
        const newId = generateAppointmentId(selectedBranch?.name || 'Sucursal Matriz', isWalkIn ? 'Presencial' : 'En línea');
        setPreviewId(newId);
      }
      goToStep(5);
    }
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

  const isSlotTaken = (time: string, isBreak?: boolean) => {
    if (isBreak) return true;
    if (!selectedBarber || !selectedDate || !selectedService) return false;
    
    // Additional secondary check against existingAppointments in state for real-time conflicts
    const newStart = timeToMinutes(time);
    const newDuration = selectedService.duration || 30;
    const newEnd = newStart + newDuration + 10;

    return existingAppointments.some((appt: Appointment) => {
      if (appt.date !== selectedDate) return false;
      if (appt.barberId !== (selectedBarber.uid || selectedBarber.id)) return false;
      if (appt.status === 'cancelled' || appt.status === 'no_show' || appt.status === 'rescheduled') return false;

      const appStart = timeToMinutes(appt.time);
      const appDuration = (appt as any).duration || (appt as any).serviceDuration || 30;
      const appEnd = appStart + appDuration + 20; // 10 tolerance + 10 rest

      return (newStart < appEnd && newEnd > appStart);
    });
  };

  // Fetch slots asynchronously when criteria changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (selectedDate && selectedBarber && selectedService) {
        setIsLoadingSlots(true);
        try {
          const barberId = selectedBarber.uid || selectedBarber.id;
          const duration = selectedService.duration || 30;
          const slots = await getAvailableSlotsForBarber(barberId, selectedDate, duration);
          setAvailableSlots(slots);
        } catch (error) {
          console.error("Error fetching slots:", error);
          setAvailableSlots([]);
        } finally {
          setIsLoadingSlots(false);
        }
      }
    };

    if (currentStep === 4) {
      fetchSlots();
    }
  }, [selectedDate, selectedBarber, selectedService, currentStep]);

  const generateTimeSlots = () => availableSlots;

  const handleConfirm = async (directPaymentId?: string) => {
    // Use direct params to avoid stale closure when called from payment callback
    const finalPaymentId = directPaymentId || paymentIntentId;
    const finalIsPaid = !!directPaymentId || isPaid;

    const appointmentData = {
      userId: user?.uid || 'walkin-guest',
      userName: isWalkIn ? guestName : user?.name,
      branch: selectedBranch?.name || 'Sucursal Matriz',
      branchId: selectedBranch?.id || 'centro',
      barberId: selectedBarber.uid || selectedBarber.id,
      barberName: selectedBarber.name,
      date: selectedDate,
      time: selectedTime!,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      duration: selectedService.duration || 30,
      type: isWalkIn ? 'Presencial' : 'En línea',
      paid: !!directPaymentId || isPaid,
      paymentIntentId: directPaymentId || paymentIntentId || null,
      paymentMethod: isWalkIn ? 'Efectivo' : 'Tarjeta',
      status: (!!directPaymentId || isPaid) ? 'confirmed' : 'pending_payment',
      appointmentId: previewId || undefined,
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

    if (currentStep === 1) {
      setPreviewId(null); // Reset ID if we go back to branch selection
    }
    
    // Cleanup on unmount
    return () => {
        setIsBookingInProgress(false);
    };
  }, [selectedBranch, currentStep]);

  // Check for day exhaustion (no slots today)
  useEffect(() => {
    if (currentStep === 4 && !isLoadingSlots && availableSlots.length === 0) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentDateStr = now.toISOString().split('T')[0];
      
      // Si el día seleccionado es HOY
      if (selectedDate === currentDateStr) {
        // Mostrar modal de agotado/cerrado SI:
        // 1. Ya pasaron las 21:00 (9:00 PM - hora de cierre)
        // 2. Y son ANTES de las 00:00 (Medianoche)
        // A las 00:00 el "Hoy" ya es el día siguiente, por lo que el modal no debe salir
        if (currentHours >= 21) {
          setShowNoSlotsModal(true);
        }
      }
    }
  }, [currentStep, selectedDate, availableSlots, isLoadingSlots]);

  // 15-Minute Auto-Timeout Logic (Requested by User)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      // Solo iniciar si el wizard está abierto y ya pasó el primer paso
      if (currentStep > 1) {
        timeout = setTimeout(() => {
          console.warn("BookingWizard: Session expired due to inactivity (15m).");
          setIsBookingInProgress(false);
          if (onCancel) onCancel();
        }, 15 * 60 * 1000); // 15 minutes
      }
    };

    resetTimer();
    return () => { if (timeout) clearTimeout(timeout); };
  }, [currentStep, selectedDate, selectedBarber]);

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
              SERVICES={serviceList.filter((s: any) => 
                s.branch?.toUpperCase() === 'AMBAS' || 
                s.branch?.toUpperCase() === selectedBranch?.name?.toUpperCase()
              )}
              selectedBranch={selectedBranch?.name}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
            />
          )}
          {currentStep === 3 && (
            <BookingStepBarbers
              styles={styles}
              COLORS={COLORS}
              BARBERS={barberList.filter((b: any) => 
                b.branch?.toUpperCase() === selectedBranch?.name?.toUpperCase() || 
                b.branch?.toUpperCase() === 'AMBAS'
              )}
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
              availableSlots={availableSlots}
              isLoadingSlots={isLoadingSlots}
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
              appointmentId={previewId}
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
                <Text style={styles.nextBtnText}>CONFIRMAR Y PAGAR</Text>
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

      {/* MODAL DE ESTADO (Procesado, Éxito, Error) */}
      <Modal 
        visible={bookingStatus !== 'idle'} 
        transparent 
        animationType={bookingStatus === 'processing' ? 'fade' : 'slide'}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {bookingStatus === 'processing' && (
              <>
                <View style={[styles.modalIconContainer, { backgroundColor: 'transparent', borderColor: 'transparent' }]}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
                <Text style={styles.modalTitle}>Procesando...</Text>
                <Text style={styles.modalMessage}>Estamos asegurando tu lugar en El Coronel Barbón. No cierres esta ventana.</Text>
              </>
            )}

            {bookingStatus === 'success' && (
              <>
                <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <CheckCircle2 size={32} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>¡Cita Agendada!</Text>
                <Text style={styles.modalMessage}>Tu reserva en El Coronel Barbón ha sido confirmada con éxito. Te esperamos pronto.</Text>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: COLORS.primary }]} 
                  onPress={() => {
                    setBookingStatus('idle');
                    if (onConfirm) onConfirm({});
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: '#000' }]}>EXCELENTE</Text>
                </TouchableOpacity>
              </>
            )}

            {bookingStatus === 'error' && (
              <>
                <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <AlertTriangle size={32} color="#EF4444" />
                </View>
                <Text style={styles.modalTitle}>Algo salió mal</Text>
                <Text style={styles.modalMessage}>{bookingErrorMessage || "No pudimos procesar tu cita en este momento. Por favor intenta de nuevo."}</Text>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelModalBtn]} onPress={() => setBookingStatus('idle')}>
                  <Text style={styles.modalBtnText}>REINTENTAR</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
  
      {/* MODAL DE HORARIOS AGOTADOS HOY */}
      <Modal visible={showNoSlotsModal} transparent animationType="fade" onRequestClose={() => setShowNoSlotsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
              <Clock size={32} color="#D4AF37" />
            </View>
            <Text style={styles.modalTitle}>Horarios Finalizados</Text>
            <Text style={styles.modalMessage}>
                Lo sentimos, los horarios para el día de hoy han terminado o la agenda está completa.
                {"\n\n"}
                Por favor, selecciona el día de mañana u otro de tu preferencia en el calendario para ver los espacios disponibles.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: COLORS.primary, flex: 1 }]} 
                onPress={() => setShowNoSlotsModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#000' }]}>ENTENDIDO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
