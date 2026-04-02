import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { 
  CalendarDays, 
  MapPin, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid,
  History
} from 'lucide-react';
import { Appointment } from '@/types';

interface AdminCalendarProps {
  appointments: Appointment[];
  COLORS: any;
  isMobile: boolean;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const toLocalDateStr = (d: Date) => d.toISOString().split('T')[0];

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekDays = (weekStart: Date) => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
};

const BRANCHES = [
  { key: 'all', label: 'Todas' },
  { key: 'centro', label: 'Centro' },
  { key: 'lomas', label: 'Lomas' },
];

export default function AdminCalendar({ appointments, COLORS, isMobile, selectedDate, onDateChange }: AdminCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [weekStart, setWeekStart] = useState(() => getWeekStart(selectedDate));
  const [activeBranch, setActiveBranch] = useState('all');

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const selectedDateStr = useMemo(() => toLocalDateStr(selectedDate), [selectedDate]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(app => {
        if (app.date !== selectedDateStr) return false;
        if (activeBranch !== 'all') {
          const appBranch = (app.branch || '').toLowerCase();
          if (!appBranch.includes(activeBranch)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [appointments, selectedDateStr, activeBranch]);

  const datesWithAppointments = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach(a => {
      if (activeBranch === 'all' || (a.branch || '').toLowerCase().includes(activeBranch)) {
        set.add(a.date);
      }
    });
    return set;
  }, [appointments, activeBranch]);

  const headerLabel = useMemo(() => {
    const startM = MONTHS_ES[weekDays[0].getMonth()];
    const endM = MONTHS_ES[weekDays[6].getMonth()];
    const year = weekDays[0].getFullYear();
    return startM === endM ? `${startM} ${year}` : `${startM} - ${endM} ${year}`;
  }, [weekDays]);

  return (
    <View style={styles.container}>
      {/* Header & Branch Switch */}
      <View style={styles.calendarHeader}>
        <View style={styles.titleContainer}>
          <CalendarDays color="var(--gold)" size={24} />
          <Text style={styles.title}>Agenda Principal</Text>
        </View>

        <View style={[styles.branchTabs, { backgroundColor: 'var(--bg-card)' }]}>
          {BRANCHES.map(b => (
            <TouchableOpacity 
              key={b.key} 
              onPress={() => setActiveBranch(b.key)}
              style={[styles.branchTab, activeBranch === b.key && styles.activeBranchTab]}
            >
              <Text style={[styles.branchText, activeBranch === b.key && styles.activeBranchText]}>
                {b.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Week Navigator */}
      <View style={styles.weekNavigator}>
        <View style={styles.weekInfo}>
          <Text style={styles.monthLabel}>{headerLabel}</Text>
          <View style={styles.weekArrows}>
            <TouchableOpacity onPress={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() - 7)))} style={styles.arrow}>
              <ChevronLeft size={20} color="var(--text-secondary)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDateChange(today)} style={styles.todayMarker}>
                <History size={16} color="var(--gold)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() + 7)))} style={styles.arrow}>
              <ChevronRight size={20} color="var(--text-secondary)" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.daysRow}>
          {weekDays.map((day, idx) => {
            const dateStr = toLocalDateStr(day);
            const isSelected = dateStr === selectedDateStr;
            const isToday = dateStr === toLocalDateStr(today);
            const hasData = datesWithAppointments.has(dateStr);

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => onDateChange(day)}
                style={[styles.dayCell, isSelected && styles.selectedDayCell]}
              >
                <Text style={[styles.dayName, isSelected && styles.selectedDayText]}>{DAYS_ES[day.getDay()]}</Text>
                <Text style={[styles.dayNumber, isSelected && styles.selectedDayNumber]}>{day.getDate()}</Text>
                {hasData && !isSelected && <View style={styles.dataDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Appointments List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>No hay citas programadas para este día.</Text>
          </View>
        ) : (
          filteredAppointments.map((item, index) => (
            <View key={item.id} style={styles.appointmentCard} data-calendar-card="true">
              <View style={styles.timeSection}>
                <Clock size={16} color="var(--gold)" />
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
              
              <View style={styles.detailsSection}>
                <Text style={styles.clientName}>{item.userName}</Text>
                <View style={styles.serviceRow}>
                  <Text style={styles.serviceName}>{item.serviceName}</Text>
                  <Text style={styles.priceTag}>${item.price}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'checked_in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(212, 175, 55, 0.1)' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'checked_in' ? '#10B981' : '#D4AF37' }]}>
                        {item.status === 'checked_in' ? 'En Local' : item.status}
                    </Text>
                </View>
              </View>

              <View style={styles.staffSection}>
                <View style={styles.staffIcon}>
                    <Text style={styles.staffInitial}>{item.barberName.charAt(0)}</Text>
                </View>
                <Text style={styles.staffName}>{item.barberName}</Text>
                {item.branch && (
                    <View style={styles.branchPoint}>
                        <MapPin size={12} color="var(--text-muted)" />
                        <Text style={styles.branchName}>{item.branch}</Text>
                    </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'var(--bg-card)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    overflow: 'hidden',
  },
  calendarHeader: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'var(--glass-border)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  branchTabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  branchTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeBranchTab: {
    backgroundColor: 'var(--gold)',
  },
  branchText: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: '600',
  },
  activeBranchText: {
    color: '#000',
  },
  weekNavigator: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  weekInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  weekArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayMarker: {
    paddingHorizontal: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 44,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  selectedDayCell: {
    backgroundColor: 'var(--gold)',
  },
  dayName: {
    color: 'var(--text-secondary)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  selectedDayText: {
    color: '#000',
  },
  dayNumber: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  selectedDayNumber: {
    color: '#000',
  },
  dataDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'var(--gold)',
    position: 'absolute',
    bottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    gap: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: 'var(--bg-sidebar)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
  },
  timeSection: {
    width: 70,
    alignItems: 'center',
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: 'var(--glass-border)',
    paddingRight: 12,
  },
  timeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  detailsSection: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 4,
  },
  clientName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    color: 'var(--text-secondary)',
    fontSize: 13,
  },
  priceTag: {
    color: 'var(--gold)',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  staffSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  staffIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  staffInitial: {
    color: 'var(--gold)',
    fontSize: 10,
    fontWeight: 'bold',
  },
  staffName: {
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: '600',
  },
  branchPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  branchName: {
    color: 'var(--text-muted)',
    fontSize: 10,
    textTransform: 'capitalize',
  },
});
