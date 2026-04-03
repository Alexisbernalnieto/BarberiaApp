import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, CreditCard, Store } from 'lucide-react';
import { formatFullDate } from '../../utils/formatters';

const AdminAgenda = ({ 
  appointments, 
  COLORS, 
  isMobile, 
  selectedDate, 
  setSelectedDate, 
  selectedBranch, 
  setSelectedBranch 
}: any) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const branches = ['Todas', 'Centro', 'Lomas'];
  
  // Get week days starting from a date
  const getWeekDays = (baseDate: Date) => {
    const days = [];
    const first = new Date(baseDate);
    // Align to some window or just show 7 days around baseDate
    for (let i = -3; i < 4; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(viewDate);
  
  const handlePrevWeek = () => {
    const next = new Date(viewDate);
    next.setDate(viewDate.getDate() - 7);
    setViewDate(next);
  };

  const handleNextWeek = () => {
    const next = new Date(viewDate);
    next.setDate(viewDate.getDate() + 7);
    setViewDate(next);
  };

  const handleSetToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setViewDate(today);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  // Filter appointments for the summary stats
  const activeDateStr = selectedDate.toISOString().split('T')[0];
  const dayAppointments = appointments.filter((app: any) => {
    const dateMatch = app.date === activeDateStr;
    const branchMatch = selectedBranch === 'Todas' || app.branch === selectedBranch;
    return dateMatch && branchMatch;
  });

  const dayRevenue = dayAppointments
    .filter((app: any) => app.status !== 'cancelled')
    .reduce((acc: number, app: any) => acc + (app.price || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.text }]}>Agenda</Text>
        <TouchableOpacity 
          style={[styles.todayBtn, { borderColor: COLORS.primary }]}
          onPress={handleSetToday}
        >
          <CalendarIcon size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.todayText, { color: COLORS.primary }]}>Hoy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.branchFilter}>
        {branches.map(branch => (
          <TouchableOpacity 
            key={branch}
            style={[
              styles.branchBtn, 
              { backgroundColor: selectedBranch === branch ? COLORS.primary : 'rgba(255,255,255,0.05)', borderColor: 'rgba(212, 175, 55, 0.2)' },
              selectedBranch === branch && { borderColor: COLORS.primary }
            ]}
            onPress={() => setSelectedBranch(branch)}
          >
            <Text style={[styles.branchText, { color: selectedBranch === branch ? '#000' : COLORS.textSecondary }]}>{branch}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.calendarCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.1)' }]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={handlePrevWeek}><ChevronLeft size={24} color={COLORS.primary} /></TouchableOpacity>
          <Text style={[styles.monthYear, { color: COLORS.text }]}>
            {formatFullDate(viewDate).split(' ').slice(-2).join(' ').toUpperCase()}
          </Text>
          <TouchableOpacity onPress={handleNextWeek}><ChevronRight size={24} color={COLORS.primary} /></TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {weekDays.map((date, idx) => {
            const isSelected = isSameDay(date, selectedDate);
            return (
              <TouchableOpacity 
                key={idx} 
                onPress={() => setSelectedDate(date)}
                style={[styles.dayCol, isSelected && { backgroundColor: COLORS.primary, borderRadius: 16 }]}
              >
                <Text style={[styles.dayName, { color: isSelected ? '#000' : COLORS.textSecondary }]}>{dayNames[date.getDay()]}</Text>
                <Text style={[styles.dayNum, { color: isSelected ? '#000' : COLORS.text }]}>{date.getDate()}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={styles.footerStats}>
          <View style={styles.statItem}>
            <CalendarIcon size={16} color={COLORS.primary} />
            <Text style={[styles.statValue, { color: COLORS.text }]}>{dayAppointments.length} <Text style={styles.statLabel}>citas</Text></Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <CreditCard size={16} color={COLORS.primary} />
            <Text style={[styles.statValue, { color: COLORS.text }]}>${dayRevenue.toLocaleString()} <Text style={styles.statLabel}>ingresos</Text></Text>
          </View>
         <View style={styles.divider} />
         <View style={styles.statItem}>
            <Store size={16} color={COLORS.primary} />
            <Text style={[styles.statValue, { color: COLORS.text }]}>{selectedBranch} <Text style={styles.statLabel}>sucursal</Text></Text>
         </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  todayText: {
    fontWeight: '700',
    fontSize: 15,
  },
  branchFilter: {
    flexDirection: 'row',
    gap: 12,
  },
  branchBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  branchText: {
    fontWeight: '700',
    fontSize: 15,
  },
  calendarCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    gap: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    width: 44,
    gap: 8,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  footerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    fontWeight: '400',
    fontSize: 13,
    color: '#888',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  }
});

export default AdminAgenda;
