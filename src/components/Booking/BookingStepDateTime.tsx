import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { Calendar } from 'react-native-calendars';
import { formatTime12h } from '../../utils/formatters';

interface BookingStepDateTimeProps {
  styles: any;
  COLORS: any;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  selectedService: any;
  todayLocal: string;
  generateTimeSlots: () => string[];
  isSlotTaken: (time: string) => boolean;
}

export default function BookingStepDateTime({
  styles,
  COLORS,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  selectedService,
  todayLocal,
  generateTimeSlots,
  isSlotTaken,
}: BookingStepDateTimeProps) {
  const slots = generateTimeSlots();

  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={true}>
      <Text style={styles.stepHeader}>Fecha y Hora</Text>
      
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: 'var(--gold)' },
            [todayLocal]: { marked: true, dotColor: 'var(--gold)' }
          }}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: 'var(--text-muted)',
            selectedDayBackgroundColor: 'var(--gold)',
            selectedDayTextColor: '#000',
            todayTextColor: 'var(--gold)',
            dayTextColor: '#FFF',
            textDisabledColor: 'rgba(255,255,255,0.1)',
            monthTextColor: '#FFF',
            indicatorColor: 'var(--gold)',
            arrowColor: 'var(--gold)',
          }}
          style={styles.calendar}
        />
      </View>

      <View style={styles.timeSection}>
        <Text style={styles.subLabel}>Horarios Disponibles</Text>
        <View style={styles.durationBadge}>
            <Clock size={14} color="var(--gold)" style={{ marginRight: 8 }} />
            <Text style={styles.durationText}>Duración: {selectedService?.duration} min</Text>
        </View>

        {slots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
                <Text style={styles.noSlotsText}>No hay horarios disponibles para este día.</Text>
            </View>
        ) : (
            <View style={styles.slotsGrid}>
                {slots.map((slot) => {
                    const taken = isSlotTaken(slot);
                    return (
                        <TouchableOpacity
                            key={slot}
                            disabled={taken}
                            style={[
                                styles.timeSlot,
                                selectedTime === slot && styles.activeSlot,
                                taken && styles.disabledSlot
                            ]}
                            onPress={() => setSelectedTime(slot)}
                        >
                            <Text style={[styles.timeText, selectedTime === slot && { color: '#000' }]}>
                                {formatTime12h(slot)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        )}
      </View>
    </ScrollView>
  );
}
