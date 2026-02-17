import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';

import BookingProgressBar from './BookingProgressBar';
import BookingStepBranch from './BookingStepBranch';
import BookingStepServices from './BookingStepServices';
import BookingStepBarbers from './BookingStepBarbers';
import BookingStepDateTime from './BookingStepDateTime';
import BookingStepConfirm from './BookingStepConfirm';
import BookingFooter from './BookingFooter';

export const STEPS = [
  { id: 1, title: 'Sucursal', icon: 'office-building' },
  { id: 2, title: 'Servicio', icon: 'content-cut' },
  { id: 3, title: 'Barbero', icon: 'account-tie' },
  { id: 4, title: 'Horario', icon: 'clock-outline' },
  { id: 5, title: 'Confirmar', icon: 'check-decagram' }
];

export default function BookingWizard({ user, existingAppointments, onConfirm, onCancel, isWalkIn = false, COLORS }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);
  const dToday = new Date();
  const todayLocal = `${dToday.getFullYear()}-${String(dToday.getMonth() + 1).padStart(2, '0')}-${String(dToday.getDate()).padStart(2, '0')}`;

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Selection States
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [guestName, setGuestName] = useState(user?.name || '');
  
  // Helper: Transition effect
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

  // Helper: Check availability
  const isSlotTaken = (time) => {
    if (!selectedBarber || !selectedDate) return false;
    return existingAppointments.some(appt => 
      appt.date === selectedDate && 
      appt.time === time && 
      appt.barberId === selectedBarber.id
    );
  };

  // Helper: Generate Time Slots based on Branch & Day
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
          COLORS={COLORS}
          currentStep={currentStep}
          steps={STEPS}
          isMobile={isMobile}
        />

        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {currentStep === 1 && (
            <BookingStepBranch
              styles={styles}
              COLORS={COLORS}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
            />
          )}
          {currentStep === 2 && (
            <BookingStepServices
              styles={styles}
              COLORS={COLORS}
              selectedBranch={selectedBranch}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
            />
          )}
          {currentStep === 3 && (
            <BookingStepBarbers
              styles={styles}
              COLORS={COLORS}
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
              generateTimeSlots={generateTimeSlots}
              isSlotTaken={isSlotTaken}
              todayLocal={todayLocal}
            />
          )}
          {currentStep === 5 && (
            <BookingStepConfirm
              styles={styles}
              COLORS={COLORS}
              user={user}
              isWalkIn={isWalkIn}
              guestName={guestName}
              setGuestName={setGuestName}
              selectedBranch={selectedBranch}
              selectedService={selectedService}
              selectedBarber={selectedBarber}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          )}
        </Animated.View>

        <BookingFooter
          styles={styles}
          COLORS={COLORS}
          currentStep={currentStep}
          selectedBranch={selectedBranch}
          selectedService={selectedService}
          selectedBarber={selectedBarber}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          handleBack={handleBack}
          handleNext={handleNext}
          handleConfirm={handleConfirm}
          onCancel={onCancel}
        />
      </View>
    </View>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: isMobile ? '100%' : 1000,
    alignSelf: 'center',
  },
  rowCenter: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  // Progress Bar
  progressContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...COLORS.shadows.light,
    zIndex: 10,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceHighlight,
    position: 'absolute',
    top: 45,
    left: 40,
    right: 40,
    zIndex: 0,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 70,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    ...COLORS.shadows.light,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...COLORS.shadows.medium,
  },
  stepCircleCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.background,
    borderWidth: 3,
    transform: [{ scale: 1.2 }],
  },
  stepTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  stepTitleActive: {
    color: COLORS.primary,
  },

  // Content
  contentContainer: {
    flex: 1,
  },
  stepContent: {
    padding: isMobile ? 20 : 40,
    paddingBottom: 120,
    alignItems: 'center',
  },
  stepHeader: {
    fontSize: isMobile ? 24 : 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Grid & Cards
  gridContainer: {
    gap: 20,
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  
  // Branch Card
  branchCard: {
    width: isMobile ? '100%' : '45%',
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
    ...COLORS.shadows.light,
  },
  activeBranchCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    ...COLORS.shadows.strong,
    transform: [{ scale: 1.02 }],
  },
  branchIcon: {
    marginBottom: 16,
    padding: 15,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 50,
  },
  activeIconBg: {
    backgroundColor: COLORS.primary + '15',
  },
  branchName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  branchAddress: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  checkBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    padding: 4,
  },

  // Service Card
  serviceCard: {
    width: isMobile ? '100%' : '48%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    ...COLORS.shadows.light,
  },
  activeServiceCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    ...COLORS.shadows.medium,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDuration: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  servicePrice: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeText: {
    color: COLORS.primary,
  },

  // Barber Card
  barbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
    marginTop: 20,
  },
  barberCard: {
    width: isMobile ? '45%' : 180,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...COLORS.shadows.light,
  },
  activeBarberCard: {
    borderColor: COLORS.primary,
    ...COLORS.shadows.medium,
  },
  avatarBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeAvatarBig: {
    backgroundColor: COLORS.primary,
  },
  barberName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  avatarTextBig: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  // Calendar & Time
  calendarContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    ...COLORS.shadows.light,
  },
  calendar: {
    borderRadius: 16,
  },
  timeSection: {
    width: '100%',
    alignItems: 'center',
  },
  subLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  durationText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    minWidth: 90,
    alignItems: 'center',
  },
  activeSlot: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  disabledSlot: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  timeText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  hintText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 20,
    fontStyle: 'italic',
  },
  noSlotsContainer: {
      alignItems: 'center',
      marginTop: 20,
  },
  noSlotsText: {
      color: COLORS.textSecondary,
      marginTop: 8,
  },

  // Ticket
  ticketCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 0, // Ticket style usually square corners or specific radius
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    ...COLORS.shadows.strong,
  },
  ticketHeader: {
    backgroundColor: COLORS.surfaceHighlight,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderStyle: 'dashed',
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  ticketSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 4,
  },
  ticketContent: {
    padding: 24,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  ticketLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  ticketValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  dashedDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  ticketHole: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  paymentNote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Footer Actions
  footerActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: 'space-between',
    gap: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  backBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    ...COLORS.shadows.medium,
  },
  nextBtnText: {
    color: COLORS.textInverse,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  confirmBtn: {
    backgroundColor: COLORS.success,
    ...COLORS.shadows.medium,
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  disabledBtn: {
    opacity: 0.5,
    backgroundColor: COLORS.disabled,
    borderColor: COLORS.disabled,
  },
  input: {
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      paddingVertical: 4,
      fontSize: 16,
  }
});
