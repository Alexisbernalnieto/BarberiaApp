import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, CreditCard, Store } from 'lucide-react';

const AdminAgenda = ({ appointments, COLORS, isMobile }: any) => {
  const [selectedBranch, setSelectedBranch] = useState('Todas');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const branches = ['Todas', 'Centro', 'Lomas'];
  
  // Get week days starting from a date
  const getWeekDays = (baseDate: Date) => {
    const days = [];
    for (let i = -2; i < 5; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(selectedDate);
  const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.text }]}>Agenda</Text>
        <TouchableOpacity style={[styles.todayBtn, { borderColor: COLORS.primary }]}>
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
          <TouchableOpacity><ChevronLeft size={24} color={COLORS.primary} /></TouchableOpacity>
          <Text style={[styles.monthYear, { color: COLORS.text }]}>Marzo 2026</Text>
          <TouchableOpacity><ChevronRight size={24} color={COLORS.primary} /></TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {weekDays.map((date, idx) => {
            const isSelected = date.getDate() === 18; // Mock selection for MIÉ 18
            return (
              <TouchableOpacity key={idx} style={[styles.dayCol, isSelected && { backgroundColor: COLORS.primary, borderRadius: 16 }]}>
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
            <Text style={[styles.statValue, { color: COLORS.text }]}>0 <Text style={styles.statLabel}>citas</Text></Text>
         </View>
         <View style={styles.divider} />
         <View style={styles.statItem}>
            <CreditCard size={16} color={COLORS.primary} />
            <Text style={[styles.statValue, { color: COLORS.text }]}>$0 <Text style={styles.statLabel}>ingresos</Text></Text>
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
