import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Animated, useWindowDimensions, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { BARBERS, SERVICES, BRANCHES } from '../../data/mockData';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
                        <MaterialCommunityIcons 
                            name={isCompleted ? "check" : step.icon} 
                            size={isMobile ? 16 : 20} 
                            color={isActive || isCompleted ? COLORS.textInverse : COLORS.textSecondary} 
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
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
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
            <View style={[styles.branchIcon, selectedBranch === branch.name && styles.activeIconBg]}>
                <MaterialCommunityIcons 
                    name="office-building" 
                    size={40} 
                    color={selectedBranch === branch.name ? COLORS.primary : COLORS.textSecondary} 
                />
            </View>
            <Text style={[styles.branchName, selectedBranch === branch.name && styles.activeText]}>{branch.name}</Text>
            <Text style={styles.branchAddress}>{branch.address}</Text>
            {selectedBranch === branch.name && (
                <View style={styles.checkBadge}>
                    <MaterialCommunityIcons name="check" size={16} color={COLORS.textInverse} />
                </View>
            )}
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
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
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
            <View style={styles.serviceRow}>
                <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, selectedService?.id === item.id && styles.activeText]}>{item.name}</Text>
                    <View style={styles.rowCenter}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textSecondary} style={{marginRight: 4}} />
                        <Text style={styles.serviceDuration}>{item.duration} min</Text>
                    </View>
                </View>
                <Text style={[styles.servicePrice, selectedService?.id === item.id && styles.activeText]}>${item.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    );
  };

  const renderStep3_Barbers = () => {
    const filteredBarbers = BARBERS.filter(b => b.branch === selectedBranch);

    return (
      <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
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
                <Text style={[styles.avatarTextBig, selectedBarber?.id === item.id && { color: COLORS.textInverse }]}>
                    {item.name[0]}
                </Text>
              </View>
              <Text style={[styles.barberName, selectedBarber?.id === item.id && styles.activeText]}>{item.name}</Text>
              <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons name="star" size={12} color={COLORS.primary} style={{marginRight: 2}} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderStep4_DateTime = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeader}>FECHA Y HORA</Text>
      
      <View style={styles.calendarContainer}>
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
            selectedDayTextColor: COLORS.textInverse,
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
      </View>

      {selectedDate ? (
        <View style={styles.timeSection}>
          <Text style={styles.subLabel}>Horarios Disponibles para el {selectedDate}</Text>
          
          <View style={styles.durationBadge}>
            <MaterialCommunityIcons name="clock-time-four-outline" size={16} color={COLORS.textSecondary} style={{marginRight: 6}} />
            <Text style={styles.durationText}>Duración estimada: {selectedService?.duration} min</Text>
          </View>

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
                        selectedTime === slot && { color: COLORS.textInverse, fontWeight: 'bold' },
                        taken && { color: COLORS.textSecondary }
                        ]}>
                        {taken ? 'OCUPADO' : slot}
                    </Text>
                    </TouchableOpacity>
                );
                })
            ) : (
                <View style={styles.noSlotsContainer}>
                    <MaterialCommunityIcons name="emoticon-sad-outline" size={40} color={COLORS.textSecondary} />
                    <Text style={styles.noSlotsText}>
                        No hay horarios disponibles para este día.
                    </Text>
                </View>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.hintText}>Selecciona una fecha en el calendario</Text>
      )}
    </ScrollView>
  );

  const renderStep5_Confirm = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeader}>CONFIRMACIÓN</Text>
      
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
            <MaterialCommunityIcons name="mustache" size={40} color={COLORS.primary} style={{marginBottom: 8}} />
            <Text style={styles.ticketTitle}>EL CORONEL</Text>
            <Text style={styles.ticketSubtitle}>BARBER SHOP</Text>
        </View>
        
        <View style={styles.ticketContent}>
            <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>CLIENTE</Text>
                {isWalkIn ? (
                    <TextInput 
                        style={[styles.input, { flex: 1, marginLeft: 10, textAlign: 'right', color: COLORS.text }]}
                        placeholder="Nombre del Cliente"
                        placeholderTextColor={COLORS.textSecondary}
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
                <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
                <Text style={styles.totalPrice}>${selectedService?.price}</Text>
            </View>
        </View>
        
        {/* Ticket holes effect */}
        <View style={[styles.ticketHole, {left: -10, top: '50%', marginTop: -10}]} />
        <View style={[styles.ticketHole, {right: -10, top: '50%', marginTop: -10}]} />
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
                  <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.textInverse} style={{marginLeft: 8}} />
              </TouchableOpacity>
          ) : (
              <TouchableOpacity 
                  style={[styles.actionBtn, styles.confirmBtn]} 
                  onPress={handleConfirm}
              >
                  <Text style={styles.confirmBtnText}>CONFIRMAR CITA</Text>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.textInverse} style={{marginLeft: 8}} />
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
