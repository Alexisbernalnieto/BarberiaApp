import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Animated, useWindowDimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { BARBERS, SERVICES, TIME_SLOTS, BRANCHES } from '../../data/mockData';
import { Ionicons } from '@expo/vector-icons';

export const STEPS = [
  { id: 1, title: 'Sucursal', icon: 'business-outline' },
  { id: 2, title: 'Servicio', icon: 'cut-outline' },
  { id: 3, title: 'Barbero', icon: 'person-outline' },
  { id: 4, title: 'Horario', icon: 'time-outline' },
  { id: 5, title: 'Confirmar', icon: 'checkmark-circle-outline' }
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
    
    let startHour = 10;
    let endHour = 19; // Default Centro Mon-Sat

    // Definir horarios según reglas
    if (selectedBranch === 'Centro') {
        if (day === 0) { // Domingo
            endHour = 15; // 3:00 PM
        } else { // Lunes a Sábado
            endHour = 19; // 7:00 PM
        }
    } else if (selectedBranch === 'Lomas') {
        if (day === 0) { // Domingo
            endHour = 15; // 3:00 PM
        } else { // Lunes a Sábado
            endHour = 20; // 8:00 PM
        }
    }

    const slots = [];
    for (let h = startHour; h < endHour; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`);
        slots.push(`${String(h).padStart(2, '0')}:30`);
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

  // --- RENDER STEPS ---

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }]} />
      </View>
      <View style={styles.stepsRow}>
        {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
                <View key={step.id} style={styles.stepWrapper}>
                    <View style={[
                        styles.stepCircle, 
                        (isActive || isCompleted) && styles.stepCircleActive,
                        isActive && styles.stepCircleCurrent
                    ]}>
                        <Ionicons 
                            name={isCompleted ? "checkmark" : step.icon} 
                            size={isMobile ? 16 : 20} 
                            color={isActive || isCompleted ? COLORS.black : COLORS.textSecondary} 
                        />
                    </View>
                    {!isMobile && (
                        <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{step.title}</Text>
                    )}
                </View>
            );
        })}
      </View>
    </View>
  );

  const renderStep1_Branch = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeader}>SELECCIONA TU SUCURSAL</Text>
      <View style={styles.gridContainer}>
        {BRANCHES.map((branch) => (
          <TouchableOpacity 
            key={branch.id}
            style={[
              styles.branchCard, 
              selectedBranch === branch.name && styles.activeBranchCard
            ]}
            onPress={() => setSelectedBranch(branch.name)}
          >
            <View style={styles.branchIcon}>
                <Ionicons name="business" size={40} color={selectedBranch === branch.name ? COLORS.primary : COLORS.textSecondary} />
            </View>
            <Text style={[styles.branchName, selectedBranch === branch.name && styles.activeText]}>{branch.name}</Text>
            <Text style={styles.branchAddress}>{branch.address}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep2_Services = () => {
    const filteredServices = SERVICES.filter(s => 
        !s.branch || s.branch === 'Ambas' || s.branch === selectedBranch
    );

    return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeader}>SERVICIOS DISPONIBLES</Text>
      <View style={styles.gridContainer}>
        {filteredServices.map((item) => (
          <TouchableOpacity 
            key={item.id}
            style={[
              styles.serviceCard, 
              selectedService?.id === item.id && styles.activeServiceCard
            ]}
            onPress={() => setSelectedService(item)}
          >
            <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, selectedService?.id === item.id && styles.activeText]}>{item.name}</Text>
                <Text style={styles.serviceDuration}>⏱ {item.duration} min</Text>
            </View>
            <Text style={[styles.servicePrice, selectedService?.id === item.id && styles.activeText]}>${item.price}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    );
  };

  const renderStep3_Barbers = () => {
    const filteredBarbers = BARBERS.filter(b => b.branch === selectedBranch);

    return (
      <ScrollView contentContainerStyle={styles.stepContent}>
        <Text style={styles.stepHeader}>TU EXPERTO EN {selectedBranch.toUpperCase()}</Text>
        <View style={styles.barbersGrid}>
          {filteredBarbers.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={[
                styles.barberCard, 
                selectedBarber?.id === item.id && styles.activeBarberCard
              ]}
              onPress={() => setSelectedBarber(item)}
            >
              <View style={[styles.avatarBig, selectedBarber?.id === item.id && styles.activeAvatarBig]}>
                <Text style={[styles.avatarTextBig, selectedBarber?.id === item.id && { color: COLORS.white }]}>
                    {item.name[0]}
                </Text>
              </View>
              <Text style={[styles.barberName, selectedBarber?.id === item.id && styles.activeText]}>{item.name}</Text>
              <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {item.rating}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderStep4_DateTime = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeader}>FECHA Y HORA</Text>
      
      <Calendar
        onDayPress={day => {
            setSelectedDate(day.dateString);
            setSelectedTime(null);
        }}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: COLORS.primary }
        }}
        theme={{
          backgroundColor: 'transparent',
          calendarBackground: 'transparent',
          textSectionTitleColor: COLORS.textSecondary,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: COLORS.white,
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.text,
          textDisabledColor: COLORS.disabled,
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.text,
          textMonthFontWeight: 'bold',
        }}
        minDate={todayLocal}
        style={styles.calendar}
      />

      {selectedDate ? (
        <View style={styles.timeSection}>
          <Text style={styles.subLabel}>Horarios Disponibles</Text>
          <View style={styles.slotsGrid}>
            {generateTimeSlots().length > 0 ? (
                generateTimeSlots().map((slot) => {
                const taken = isSlotTaken(slot);
                return (
                    <TouchableOpacity
                    key={slot}
                    disabled={taken}
                    style={[
                        styles.timeSlot,
                        taken && styles.disabledSlot,
                        selectedTime === slot && styles.activeSlot
                    ]}
                    onPress={() => setSelectedTime(slot)}
                    >
                    <Text style={[
                        styles.timeText, 
                        selectedTime === slot && { color: COLORS.white, fontWeight: 'bold' },
                        taken && { color: COLORS.textSecondary }
                        ]}>
                        {taken ? 'OCUPADO' : slot}
                    </Text>
                    </TouchableOpacity>
                );
                })
            ) : (
                <Text style={{ color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 10 }}>
                    No hay horarios disponibles para este día.
                </Text>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.hintText}>Selecciona una fecha en el calendario</Text>
      )}
    </ScrollView>
  );

  const renderStep5_Confirm = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeader}>CONFIRMACIÓN DE CITA</Text>
      
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
            <View style={styles.ticketHeaderLine} />
            <Text style={styles.ticketTitle}>EL CORONEL BARBÓN</Text>
            <View style={styles.ticketHeaderLine} />
        </View>
        
        <View style={styles.ticketContent}>
            <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>CLIENTE</Text>
                {isWalkIn ? (
                    <TextInput 
                        style={[styles.input, { flex: 1, marginLeft: 10, textAlign: 'right', color: COLORS.black }]}
                        placeholder="Nombre del Cliente"
                        placeholderTextColor="#666"
                        value={guestName}
                        onChangeText={setGuestName}
                    />
                ) : (
                    <Text style={styles.ticketValue}>{user.name}</Text>
                )}
            </View>

            <View style={styles.dashedDivider} />

            <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>SUCURSAL</Text>
                <Text style={styles.ticketValue}>{selectedBranch}</Text>
            </View>
            <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>SERVICIO</Text>
                <Text style={styles.ticketValue}>{selectedService?.name}</Text>
            </View>
            <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>BARBERO</Text>
                <Text style={styles.ticketValue}>{selectedBarber?.name}</Text>
            </View>
            <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>FECHA</Text>
                <Text style={styles.ticketValue}>{selectedDate}</Text>
            </View>
            <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>HORA</Text>
                <Text style={styles.ticketValue}>{selectedTime}</Text>
            </View>
            
            <View style={styles.dashedDivider} />

            <View style={styles.ticketFooter}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalPrice}>${selectedService?.price}</Text>
            </View>
        </View>
        <View style={styles.ticketBottomDecor} />
      </View>
      
      <Text style={styles.paymentNote}>* El pago se realizará en el establecimiento.</Text>

    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {renderProgressBar()}

        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {currentStep === 1 && renderStep1_Branch()}
          {currentStep === 2 && renderStep2_Services()}
          {currentStep === 3 && renderStep3_Barbers()}
          {currentStep === 4 && renderStep4_DateTime()}
          {currentStep === 5 && renderStep5_Confirm()}
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
              </TouchableOpacity>
          ) : (
              <TouchableOpacity 
                  style={[styles.actionBtn, styles.confirmBtn]} 
                  onPress={handleConfirm}
              >
                  <Text style={styles.confirmBtnText}>CONFIRMAR CITA</Text>
              </TouchableOpacity>
          )}
        </View>
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
    maxWidth: isMobile ? '100%' : 900,
    alignSelf: 'center',
  },
  // Progress Bar
  progressContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  progressTrack: {
    height: 2,
    backgroundColor: COLORS.surfaceHighlight,
    position: 'absolute',
    top: 35,
    left: 40,
    right: 40,
    zIndex: 0,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 60,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: COLORS.white,
    transform: [{ scale: 1.1 }]
  },
  stepTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepTitleActive: {
    color: COLORS.primary,
  },

  // Content
  contentContainer: {
    flex: 1,
  },
  stepContent: {
    padding: isMobile ? 15 : 30,
    paddingBottom: 100,
  },
  stepHeader: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 25,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Grid & Cards
  gridContainer: {
    gap: 15,
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  branchCard: {
    width: isMobile ? '100%' : '48%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: COLORS.surfaceHighlight,
    alignItems: 'center',
    marginBottom: 15,
  },
  activeBranchCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  branchIcon: {
    marginBottom: 10,
  },
  branchName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  branchAddress: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  activeText: {
    color: COLORS.primary,
  },

  // Services
  serviceCard: {
    width: isMobile ? '100%' : '48%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: COLORS.surfaceHighlight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeServiceCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
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

  // Barbers
  barbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  barberCard: {
    width: isMobile ? '47%' : '30%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceHighlight,
  },
  activeBarberCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  avatarBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  activeAvatarBig: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  avatarTextBig: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  barberName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  ratingBadge: {
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: COLORS.primary,
    fontSize: 10,
  },

  // Date & Time
  calendar: {
    marginBottom: 20,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: COLORS.surfaceHighlight,
    backgroundColor: COLORS.surface,
  },
  timeSection: {
    marginTop: 20,
  },
  subLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: COLORS.surfaceHighlight,
    minWidth: '30%',
    alignItems: 'center',
  },
  activeSlot: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  disabledSlot: {
    opacity: 0.3,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  hintText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },

  // Confirmation / Ticket
  ticketCard: {
    backgroundColor: '#F5F5DC', // Light beige paper texture feel
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  ticketHeader: {
    backgroundColor: COLORS.black,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ticketHeaderLine: {
    height: 1,
    backgroundColor: COLORS.primary,
    flex: 1,
    marginHorizontal: 10,
  },
  ticketTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  ticketContent: {
    padding: 20,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketLabel: {
    color: '#444',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  ticketValue: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#999',
    borderStyle: 'dashed',
    marginVertical: 15,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPrice: {
    color: COLORS.black,
    fontSize: 24,
    fontWeight: 'bold',
  },
  ticketBottomDecor: {
    height: 10,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  paymentNote: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 5,
    borderRadius: 4,
  },

  // Footer Actions
  footerActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceHighlight,
    gap: 15,
  },
  actionBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  backBtnText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
  },
  nextBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  confirmBtn: {
    backgroundColor: COLORS.accent, // Changed to accent (Gold) for Confirm button
  },
  confirmBtnText: {
    color: COLORS.black,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
