import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, FlatList, Dimensions, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { BARBERS, SERVICES, TIME_SLOTS } from '../../data/mockData';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const COLORS = {
  primary: '#d4af37',
  background: '#1a1a1a',
  surface: '#252525',
  surfaceLight: '#333333',
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  success: '#2ecc71',
  error: '#e74c3c'
};

export default function BookingWizard({ user, existingAppointments, onConfirm }) {
  // Selection States
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  
  // Payment States
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  // Auto-scroll ref (opcional para mejoras futuras)
  const scrollViewRef = React.useRef();

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
    // Validaciones finales
    if (!selectedBarber || !selectedDate || !selectedTime || !selectedService) {
      Alert.alert('Faltan datos', 'Por favor completa todos los campos de la reserva.');
      return;
    }

    if (cardNumber.length < 16 || !expiry || !cvc) {
      Alert.alert('Error de Pago', 'Por favor revisa los datos de tu tarjeta.');
      return;
    }

    // Simular proceso de pago
    Alert.alert(
      'Procesando Pago...',
      'Confirmando tu estilo...',
      [
        {
          text: '¡Listo!', 
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

  const SectionTitle = ({ number, title }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>{number}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.mainTitle}>Nueva Reserva</Text>
        <Text style={styles.mainSubtitle}>Arma tu estilo en simples pasos</Text>

        {/* 1. Barbero */}
        <View style={styles.section}>
          <SectionTitle number="1" title="Elige tu Barbero" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {BARBERS.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={[
                  styles.barberCard, 
                  selectedBarber?.id === item.id && styles.activeCard
                ]}
                onPress={() => setSelectedBarber(item)}
              >
                <View style={[styles.avatarPlaceholder, selectedBarber?.id === item.id && styles.activeAvatar]}>
                  <Text style={[styles.avatarText, selectedBarber?.id === item.id && styles.activeAvatarText]}>
                    {item.name[0]}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.rating}>⭐ {item.rating}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 2. Servicio */}
        <View style={styles.section}>
          <SectionTitle number="2" title="Servicio" />
          <View style={styles.gridContainer}>
            {SERVICES.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={[
                  styles.serviceCard, 
                  selectedService?.id === item.id && styles.activeCard
                ]}
                onPress={() => setSelectedService(item)}
              >
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.serviceDuration}>{item.duration} min</Text>
                <Text style={styles.servicePrice}>${item.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Fecha y Hora */}
        <View style={styles.section}>
          <SectionTitle number="3" title="Fecha y Hora" />
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
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: '#000',
                todayTextColor: COLORS.primary,
                dayTextColor: '#fff',
                textDisabledColor: '#444',
                arrowColor: COLORS.primary,
                monthTextColor: COLORS.text,
              }}
              minDate={new Date().toISOString().split('T')[0]}
            />
          </View>

          {selectedDate && (
            <View style={styles.timeSection}>
              <Text style={styles.subLabel}>Horarios para {selectedDate}</Text>
              <View style={styles.slotsContainer}>
                {TIME_SLOTS.map((slot) => {
                  const taken = isSlotTaken(slot);
                  return (
                    <TouchableOpacity
                      key={slot}
                      disabled={taken || !selectedBarber} // Deshabilitar si no hay barbero seleccionado
                      style={[
                        styles.timeSlot,
                        taken && styles.disabledSlot,
                        selectedTime === slot && styles.activeSlot
                      ]}
                      onPress={() => setSelectedTime(slot)}
                    >
                      <Text style={[styles.timeText, selectedTime === slot && { color: '#000', fontWeight: 'bold' }]}>
                        {taken ? 'OCUPADO' : slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!selectedBarber && (
                <Text style={styles.warningText}>* Selecciona un barbero para ver disponibilidad real</Text>
              )}
            </View>
          )}
        </View>

        {/* 4. Pago y Resumen */}
        <View style={styles.section}>
          <SectionTitle number="4" title="Confirmar y Pagar" />
          
          <View style={styles.paymentContainer}>
            <View style={styles.summaryCard}>
               <Text style={styles.summaryHeader}>RESUMEN</Text>
               <View style={styles.summaryRow}>
                 <Text style={styles.summaryLabel}>Barbero:</Text>
                 <Text style={styles.summaryValue}>{selectedBarber?.name || '-'}</Text>
               </View>
               <View style={styles.summaryRow}>
                 <Text style={styles.summaryLabel}>Servicio:</Text>
                 <Text style={styles.summaryValue}>{selectedService?.name || '-'}</Text>
               </View>
               <View style={styles.summaryRow}>
                 <Text style={styles.summaryLabel}>Fecha:</Text>
                 <Text style={styles.summaryValue}>{selectedDate || '-'} {selectedTime ? `@ ${selectedTime}` : ''}</Text>
               </View>
               <View style={styles.totalRow}>
                 <Text style={styles.totalLabel}>Total:</Text>
                 <Text style={styles.totalValue}>${selectedService?.price || '0'}</Text>
               </View>
            </View>

            <Text style={styles.inputLabel}>Datos de Tarjeta</Text>
            <TextInput 
                style={styles.input} 
                placeholder="0000 0000 0000 0000" 
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={16}
                onChangeText={setCardNumber}
            />
            <View style={styles.rowInput}>
                <View style={{flex: 1, marginRight: 10}}>
                    <TextInput 
                        style={styles.input} 
                        placeholder="MM/YY" 
                        placeholderTextColor="#666"
                        maxLength={5}
                        onChangeText={setExpiry}
                    />
                </View>
                <View style={{flex: 1}}>
                    <TextInput 
                        style={styles.input} 
                        placeholder="CVC" 
                        placeholderTextColor="#666"
                        keyboardType="number-pad"
                        maxLength={3}
                        onChangeText={setCvc}
                    />
                </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.payBtn, 
                (!selectedBarber || !selectedService || !selectedDate || !selectedTime) && styles.disabledBtn
              ]} 
              onPress={handlePayment}
              disabled={!selectedBarber || !selectedService || !selectedDate || !selectedTime}
            >
              <Text style={styles.payBtnText}>
                {selectedService ? `PAGAR $${selectedService.price} Y RESERVAR` : 'COMPLETAR DATOS PARA RESERVAR'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{height: 100}} /> 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  mainSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 25,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionNumberText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  // Barbers
  horizontalScroll: {
    paddingBottom: 10,
  },
  barberCard: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 15,
    marginRight: 15,
    width: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceLight,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeAvatar: {
    backgroundColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  activeAvatarText: {
    color: '#000',
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  rating: {
    color: '#FFD700',
    fontSize: 12,
  },
  // Services
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: isWeb ? '30%' : '48%',
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  serviceName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
  },
  serviceDuration: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 5,
  },
  servicePrice: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Calendar & Time
  calendarContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
  },
  timeSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 15,
  },
  subLabel: {
    color: COLORS.textSecondary,
    marginBottom: 15,
    fontSize: 14,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '30%',
    backgroundColor: '#333',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
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
    fontSize: 12,
  },
  warningText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
  // Payment
  paymentContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  summaryHeader: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 12,
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    color: '#aaa',
  },
  summaryValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 20,
  },
  inputLabel: {
    color: '#fff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  rowInput: {
    flexDirection: 'row',
  },
  payBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledBtn: {
    backgroundColor: '#444',
    shadowOpacity: 0,
    elevation: 0,
  },
  payBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
