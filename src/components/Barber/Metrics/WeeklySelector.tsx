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
          return (
            <TouchableOpacity 
              key={index} 
              style={[styles.weekCard, isSelected && styles.weekCardActive]}
              onPress={() => onSelectWeek(week.weekStart)}
            >
              <View style={styles.weekInfo}>
                <Text style={styles.weekDates}>
                  {format(week.weekStart, "d 'de' MMM", { locale: es })} - {format(week.weekEnd, "d 'de' MMM", { locale: es })}
                </Text>
                <View style={styles.tripCountRow}>
                  <Feather name="scissors" size={14} color="var(--text-muted)" />
                  <Text style={styles.tripCount}>{week.totalTrips} cortes</Text>
                </View>
              </View>
              
              <View style={styles.amountContainer}>
                <Text style={styles.amount}>{formatCurrency(week.totalEarnings)}</Text>
                <Feather name="chevron-right" size={18} color="var(--text-muted)" />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  weekCardActive: {
    borderColor: 'var(--gold)',
    backgroundColor: 'var(--gold-subtle)',
  },
  weekInfo: {
    gap: 4,
  },
  weekDates: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tripCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripCount: {
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    color: 'var(--gold)',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default WeeklySelector;
