import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Dimensions, Animated, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { BARBERS, SERVICES, TIME_SLOTS } from '../../data/mockData';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#d4af37',
  background: '#1a1a1a',
  surface: '#252525',
  surfaceHighlight: '#333333',
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  success: '#2ecc71',
  error: '#e74c3c',
  disabled: '#444444'
};

const STEPS = [
  { id: 1, title: 'Servicio', icon: 'cut-outline' },
  { id: 2, title: 'Barbero', icon: 'person-outline' },
  { id: 3, title: 'Horario', icon: 'time-outline' },
  { id: 4, title: 'Confirmar', icon: 'checkmark-circle-outline' }
];

export default function BookingWizard({ user, existingAppointments, onConfirm, onCancel }) {
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Selection States
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  
  // Payment States
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  // Helper: Transition effect
  const goToStep = (step) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();
    setTimeout(() => setCurrentStep(step), 150);
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedService) goToStep(2);
    else if (currentStep === 2 && selectedBarber) goToStep(3);
    else if (currentStep === 3 && selectedDate && selectedTime) goToStep(4);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
    else if (onCancel) onCancel(); // Opción de cancelar si se pasa prop
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

  const handlePayment = () => {
    if (cardNumber.length < 16 || !expiry || !cvc) {
      Alert.alert('Error de Pago', 'Por favor revisa los datos de tu tarjeta.');
      return;
    }

    Alert.alert(
      '¡Reserva Exitosa!',
      `Tu cita para ${selectedService.name} ha sido confirmada.`,
      [
        {
          text: 'Entendido', 
          onPress: () => {
            const appointmentData = {
              userId: user.email,
              userName: user.name,
              barberId: selectedBarber.id,
              barberName: selectedBarber.name,
              date: selectedDate,
              time: selectedTime,
              serviceId: selectedService.id,
              serviceName: selectedService.name,
              price: selectedService.price,
              status: 'Confirmado',
              type: 'Online'
            };
            onConfirm(appointmentData);
          }
        }
      ]
    );
  };

  // --- RENDER STEPS ---

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }]} />
      </View>
      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
                <View key={step.id} style={styles.stepWrapper}>
                    <View style={[
                        styles.stepCircle, 
                        (isActive || isCompleted) && styles.stepCircleActive,
                        isActive && styles.stepCircleCurrent
                    ]}>
                        <Text style={[styles.stepNumber, (isActive || isCompleted) && styles.stepNumberActive]}>
                            {isCompleted ? '✓' : step.id}
                        </Text>
                    </View>
                    <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{step.title}</Text>
                </View>
            );
        })}
      </View>
    </View>
  );

  const renderStep1_Services = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeader}>¿Qué estilo buscas hoy?</Text>
      <View style={styles.gridContainer}>
        {SERVICES.map((item) => (
          <TouchableOpacity 
            key={item.id}
            style={[
              styles.serviceCard, 
              selectedService?.id === item.id && styles.activeServiceCard
            ]}
            onPress={() => {
                setSelectedService(item);
                // Opcional: auto-avanzar después de breve delay
                // setTimeout(() => goToStep(2), 300);
            }}
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

  const renderStep2_Barbers = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeader}>Elige a tu profesional</Text>
      <View style={styles.barbersGrid}>
        {BARBERS.map((item) => (
          <TouchableOpacity 
            key={item.id}
            style={[
              styles.barberCard, 
              selectedBarber?.id === item.id && styles.activeBarberCard
            ]}
            onPress={() => setSelectedBarber(item)}
          >
            <View style={[styles.avatarBig, selectedBarber?.id === item.id && styles.activeAvatarBig]}>
              <Text style={styles.avatarTextBig}>{item.name[0]}</Text>
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

  const renderStep3_DateTime = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeader}>Fecha y Hora</Text>
      
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
          textSectionTitleColor: '#666',
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: '#000',
          todayTextColor: COLORS.primary,
          dayTextColor: '#fff',
          textDisabledColor: '#333',
          arrowColor: COLORS.primary,
          monthTextColor: '#fff',
          textMonthFontWeight: 'bold',
        }}
        minDate={new Date().toISOString().split('T')[0]}
        style={styles.calendar}
      />

      {selectedDate ? (
        <View style={styles.timeSection}>
          <Text style={styles.subLabel}>Disponibilidad para {selectedDate}</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map((slot) => {
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
                      selectedTime === slot && { color: '#000', fontWeight: 'bold' },
                      taken && { color: '#666' }
                    ]}>
                    {taken ? 'OCUPADO' : slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={styles.hintText}>Selecciona una fecha en el calendario</Text>
      )}
    </ScrollView>
  );

  const renderStep4_Confirm = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepHeader}>Resumen y Pago</Text>
      
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>BARBERÍA</Text>
            <Text style={styles.ticketSubtitle}>CONFIRMACIÓN DE CITA</Text>
        </View>
        
        <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>CLIENTE</Text>
            <Text style={styles.ticketValue}>{user.name}</Text>
        </View>
        <View style={styles.ticketDivider} />
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
            <Text style={styles.ticketValue}>{selectedDate} @ {selectedTime}</Text>
        </View>
        
        <View style={styles.ticketFooter}>
            <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
            <Text style={styles.totalPrice}>${selectedService?.price}</Text>
        </View>
      </View>

      <View style={styles.paymentSection}>
        <Text style={styles.inputLabel}>Datos de Tarjeta (Simulado)</Text>
        <TextInput 
            style={styles.input} 
            placeholder="0000 0000 0000 0000" 
            placeholderTextColor="#555"
            keyboardType="number-pad"
            maxLength={16}
            onChangeText={setCardNumber}
            value={cardNumber}
        />
        <View style={styles.rowInput}>
            <TextInput 
                style={[styles.input, { flex: 1, marginRight: 10 }]} 
                placeholder="MM/YY" 
                placeholderTextColor="#555"
                maxLength={5}
                onChangeText={setExpiry}
                value={expiry}
            />
            <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="CVC" 
                placeholderTextColor="#555"
                keyboardType="number-pad"
                maxLength={3}
                onChangeText={setCvc}
                value={cvc}
            />
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {renderProgressBar()}

        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {currentStep === 1 && renderStep1_Services()}
          {currentStep === 2 && renderStep2_Barbers()}
          {currentStep === 3 && renderStep3_DateTime()}
          {currentStep === 4 && renderStep4_Confirm()}
        </Animated.View>

        <View style={styles.footerActions}>
          <TouchableOpacity 
              style={[styles.actionBtn, styles.backBtn, currentStep === 1 && styles.disabledBtn]} 
              onPress={handleBack}
              disabled={currentStep === 1 && !onCancel}
          >
              <Text style={styles.backBtnText}>{currentStep === 1 ? 'Cancelar' : 'Atrás'}</Text>
          </TouchableOpacity>

          {currentStep < 4 ? (
              <TouchableOpacity 
                  style={[
                      styles.actionBtn, 
                      styles.nextBtn, 
                      ((currentStep === 1 && !selectedService) || 
                       (currentStep === 2 && !selectedBarber) || 
                       (currentStep === 3 && (!selectedDate || !selectedTime))) && styles.disabledBtn
                  ]} 
                  onPress={handleNext}
                  disabled={
                      (currentStep === 1 && !selectedService) || 
                      (currentStep === 2 && !selectedBarber) || 
                      (currentStep === 3 && (!selectedDate || !selectedTime))
                  }
              >
                  <Text style={styles.nextBtnText}>Siguiente</Text>
              </TouchableOpacity>
          ) : (
              <TouchableOpacity 
                  style={[styles.actionBtn, styles.confirmBtn]} 
                  onPress={handlePayment}
              >
                  <Text style={styles.confirmBtnText}>Confirmar y Pagar</Text>
              </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  // Progress Bar
  progressContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    position: 'absolute',
    top: 35,
    left: 40,
    right: 40,
    zIndex: 0,
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
    width: 60,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: '#fff',
    transform: [{ scale: 1.1 }]
  },
  stepNumber: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepNumberActive: {
    color: '#000',
  },
  stepTitle: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
  },
  stepTitleActive: {
    color: '#fff',
  },

  // Content
  contentContainer: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
    paddingBottom: 100,
  },
  stepHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },

  // Step 1: Services
  gridContainer: {
    gap: 15,
  },
  serviceCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeServiceCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDuration: {
    color: '#888',
    fontSize: 14,
  },
  servicePrice: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  activeText: {
    color: COLORS.primary,
  },

  // Step 2: Barbers
  barbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  barberCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  activeBarberCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  avatarBig: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeAvatarBig: {
    backgroundColor: COLORS.primary,
  },
  avatarTextBig: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  barberName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
  },
  ratingBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
  },

  // Step 3: Date & Time
  calendar: {
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingBottom: 10,
  },
  timeSection: {
    marginTop: 10,
  },
  subLabel: {
    color: '#aaa',
    marginBottom: 15,
    fontSize: 14,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    width: '30%',
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  activeSlot: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  disabledSlot: {
    opacity: 0.3,
    backgroundColor: '#222',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
  },
  hintText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },

  // Step 4: Confirmation
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 20,
    marginHorizontal: 10,
    marginBottom: 30,
    // Ticket effect (simple borders for now)
    borderTopWidth: 8,
    borderTopColor: COLORS.primary,
  },
  ticketHeader: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#000',
  },
  ticketSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ticketLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketValue: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  ticketDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#eee', 
  },
  ticketFooter: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  paymentSection: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
  },
  inputLabel: {
    color: '#aaa',
    marginBottom: 10,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
  },
  rowInput: {
    flexDirection: 'row',
  },

  // Footer Actions
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionBtn: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
  },
  nextBtnText: {
    color: '#000',
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
  },
  confirmBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
