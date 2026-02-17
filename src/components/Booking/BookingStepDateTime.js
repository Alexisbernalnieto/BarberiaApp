import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { generateTimeSlots, isSlotTaken } from './BookingWizard.utils';

export function BookingStepDateTime({
  styles,
  COLORS,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  selectedService,
  selectedBranch,
  selectedBarber,
  existingAppointments,
  todayLocal,
}) {
  const slots = generateTimeSlots(
    selectedDate,
    selectedBranch,
    selectedBarber,
    todayLocal
  );

  return (
    <ScrollView
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepHeader}>FECHA Y HORA</Text>
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
            setSelectedTime(null);
          }}
          markedDates={{
            [selectedDate]: {
              selected: true,
              selectedColor: COLORS.primary,
            },
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
          <Text style={styles.subLabel}>
            Horarios Disponibles para el {selectedDate}
          </Text>
          <View style={styles.durationBadge}>
            <MaterialCommunityIcons
              name="clock-time-four-outline"
              size={16}
              color={COLORS.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.durationText}>
              Duración estimada: {selectedService?.duration} min
            </Text>
          </View>
          <View style={styles.slotsGrid}>
            {slots.length > 0 ? (
              slots.map((slot) => {
                const taken = isSlotTaken(
                  existingAppointments,
                  selectedBarber,
                  selectedDate,
                  slot
                );
                return (
                  <TouchableOpacity
                    key={slot}
                    disabled={taken}
                    style={[
                      styles.timeSlot,
                      taken && styles.disabledSlot,
                      selectedTime === slot && styles.activeSlot,
                    ]}
                    onPress={() => setSelectedTime(slot)}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selectedTime === slot && {
                          color: COLORS.textInverse,
                          fontWeight: 'bold',
                        },
                        taken && { color: COLORS.textSecondary },
                      ]}
                    >
                      {taken ? 'OCUPADO' : slot}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noSlotsContainer}>
                <MaterialCommunityIcons
                  name="emoticon-sad-outline"
                  size={40}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.noSlotsText}>
                  No hay horarios disponibles para este día.
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.hintText}>
          Selecciona una fecha en el calendario
        </Text>
      )}
    </ScrollView>
  );
}

