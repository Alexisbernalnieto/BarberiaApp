import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BookingFooter({
  styles,
  COLORS,
  currentStep,
  selectedBranch,
  selectedService,
  selectedBarber,
  selectedDate,
  selectedTime,
  handleBack,
  handleNext,
  handleConfirm,
  onCancel,
}) {
  const disableNext =
    (currentStep === 1 && !selectedBranch) ||
    (currentStep === 2 && !selectedService) ||
    (currentStep === 3 && !selectedBarber) ||
    (currentStep === 4 && (!selectedDate || !selectedTime));

  return (
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
          style={[styles.actionBtn, styles.nextBtn, disableNext && styles.disabledBtn]}
          onPress={handleNext}
          disabled={disableNext}
        >
          <Text style={styles.nextBtnText}>SIGUIENTE</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={16}
            color={COLORS.textInverse}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>CONFIRMAR CITA</Text>
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color={COLORS.textInverse}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

