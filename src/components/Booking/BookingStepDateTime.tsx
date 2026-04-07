import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Calendar as CalendarIcon, Clock, Check, Coffee } from 'lucide-react';
import { Calendar } from 'react-native-calendars';
import { formatTime12h } from '../../utils/formatters';
import { TimeSlot } from '../../types';

interface BookingStepDateTimeProps {
  styles: any;
  COLORS: any;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  selectedService: any;
  todayLocal: string;
  availableSlots: TimeSlot[];
  isLoadingSlots: boolean;
  isSlotTaken: (time: string, isBreak?: boolean) => boolean;
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
  availableSlots,
  isLoadingSlots,
  isSlotTaken,
}: BookingStepDateTimeProps) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={true}>
      <Text style={styles.stepHeader}>Fecha y Hora</Text>
      
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          minDate={todayLocal}
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

        {isLoadingSlots ? (
            <View style={styles.noSlotsContainer}>
                <ActivityIndicator size="large" color="var(--gold)" />
                <Text style={[styles.noSlotsText, { marginTop: 12 }]}>Buscando espacios...</Text>
            </View>
        ) : availableSlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
                <Text style={styles.noSlotsText}>No hay horarios disponibles para este día.</Text>
            </View>
        ) : (
            <View style={styles.slotsGrid}>
                {availableSlots.map((slot) => {
                    const taken = isSlotTaken(slot.time, slot.isBreak);
                    const isBreak = slot.isBreak;
                    
                    return (
                        <TouchableOpacity
                            key={slot.time}
                            disabled={taken}
                            style={[
                                styles.timeSlot,
                                selectedTime === slot.time && styles.activeSlot,
                                taken && !isBreak && styles.disabledSlot,
                                isBreak && styles.breakSlot
                            ]}
                            onPress={() => setSelectedTime(slot.time)}
                        >
                            <Text style={[
                                styles.timeText, 
                                selectedTime === slot.time && { color: '#000' },
                                isBreak && { color: 'rgba(255,255,255,0.4)', fontSize: 13 }
                            ]}>
                                {formatTime12h(slot.time)}
                            </Text>
                            {isBreak && (
                                <Text style={styles.breakText}>Descanso</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        )}
      </View>
    </ScrollView>
  );
}
