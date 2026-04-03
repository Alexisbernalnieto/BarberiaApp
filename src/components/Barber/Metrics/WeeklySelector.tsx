import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WeeklyMetrics, formatCurrency, getPastWeeks } from '@/utils/barberMetrics';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment } from '@/types';

interface Props {
  appointments: Appointment[];
  currentWeekStart: Date;
  onSelectWeek: (date: Date) => void;
  onBack: () => void;
  COLORS: any;
}

const WeeklySelector: React.FC<Props> = ({ appointments, currentWeekStart, onSelectWeek, onBack, COLORS }) => {
  const weeks = getPastWeeks(appointments, 12);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Historial de Ganancias</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {weeks.map((week, index) => {
          const isSelected = isSameDay(week.weekStart, currentWeekStart);
          const maxAmount = Math.max(...week.dailyData.map(d => d.amount), 1);
          const BAR_MAX_HEIGHT = 36;
          const initials = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

          return (
            <TouchableOpacity 
              key={index} 
              style={[styles.weekCard, isSelected && styles.weekCardActive]}
              onPress={() => onSelectWeek(week.weekStart)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.weekInfo}>
                  <Text style={styles.weekDates}>
                    {format(week.weekStart, "d 'de' MMM", { locale: es })} - {format(week.weekEnd, "d 'de' MMM", { locale: es })}
                  </Text>
                  <Text style={styles.totalEarnings}>{formatCurrency(week.totalEarnings)}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="var(--text-muted)" />
              </View>
              
              <View style={styles.chartContainer}>
                {week.dailyData.map((day, dayIdx) => (
                  <View key={dayIdx} style={styles.barWrapper}>
                    <View style={styles.barBackground}>
                      <View 
                        style={[
                          styles.barFill, 
                          { 
                            height: Math.max((day.amount / maxAmount) * BAR_MAX_HEIGHT, 2),
                            backgroundColor: day.amount > 0 ? 'var(--gold)' : 'rgba(255,255,255,0.05)'
                          }
                        ]} 
                      />
                    </View>
                    <View style={styles.dayLabels}>
                      <Text style={styles.dayNumber}>{format(day.date, 'd')}</Text>
                      <Text style={styles.dayInitial}>{initials[dayIdx]}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 20,
  },
  weekCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  weekCardActive: {
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  weekInfo: {
    gap: 4,
  },
  weekDates: {
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  totalEarnings: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  barWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  barBackground: {
    width: 32,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 8,
    borderRadius: 4,
  },
  dayLabels: {
    alignItems: 'center',
    gap: 2,
  },
  dayNumber: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  dayInitial: {
    color: 'var(--text-muted)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default WeeklySelector;
