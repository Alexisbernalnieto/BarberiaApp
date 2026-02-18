import React, { useState, useRef, useMemo } from 'react';
import { View, TouchableOpacity, Animated, useWindowDimensions, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BookingProgressBar } from './BookingProgressBar';
import { BookingStepBranch } from './BookingStepBranch';
import { BookingStepServices } from './BookingStepServices';
import { BookingStepBarbers } from './BookingStepBarbers';
import { BookingStepDateTime } from './BookingStepDateTime';
import { BookingStepConfirm } from './BookingStepConfirm';
import { getStyles } from './BookingWizard.styles';

export default function BookingWizard({ user, existingAppointments, onConfirm, onCancel, isWalkIn = false, COLORS }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);
  const dToday = new Date();
  const todayLocal = `${dToday.getFullYear()}-${String(dToday.getMonth() + 1).padStart(2, '0')}-${String(dToday.getDate()).padStart(2, '0')}`;

  const [currentStep, setCurrentStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [guestName, setGuestName] = useState(user?.name || '');
  
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
          currentStep={currentStep}
          COLORS={COLORS}
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
              selectedBranch={selectedBranch}
              selectedBarber={selectedBarber}
              existingAppointments={existingAppointments}
              todayLocal={todayLocal}
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
