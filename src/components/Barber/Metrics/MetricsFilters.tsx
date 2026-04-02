import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { startDate: string | undefined, endDate: string | undefined, branchId: 'all' | 'Lomas' | 'Centro' }) => void;
  initialFilters: { startDate: string | undefined, endDate: string | undefined, branchId: 'all' | 'Lomas' | 'Centro' };
  COLORS: any;
}

const MetricsFilters: React.FC<Props> = ({ visible, onClose, onApply, initialFilters, COLORS }) => {
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'Lomas' | 'Centro'>(initialFilters.branchId);
  const [markedDates, setMarkedDates] = useState<any>(() => {
    const marked: any = {};
    if (initialFilters.startDate) {
      marked[initialFilters.startDate] = { startingDay: true, color: 'var(--gold)', textColor: 'white' };
    }
    if (initialFilters.endDate) {
      marked[initialFilters.endDate] = { endingDay: true, color: 'var(--gold)', textColor: 'white' };
    }
    return marked;
  });
  const [range, setRange] = useState({ 
    start: initialFilters.startDate || '', 
    end: initialFilters.endDate || '' 
  });

  const onDayPress = (day: any) => {
    const { dateString } = day;
    
    if (!range.start || (range.start && range.end)) {
      setRange({ start: dateString, end: '' });
      setMarkedDates({
        [dateString]: { startingDay: true, color: 'var(--gold)', textColor: 'white' }
      });
    } else {
      let start = range.start;
      let end = dateString;
      
      if (dateString < start) {
        end = start;
        start = dateString;
      }
      
      setRange({ start, end });
      
      const newMarked: any = {};
      let curr = new Date(start);
      const last = new Date(end);
      
      while (curr <= last) {
        const str = format(curr, 'yyyy-MM-dd');
        newMarked[str] = {
          color: 'rgba(234, 179, 8, 0.3)',
          textColor: 'white',
          ...(str === start ? { startingDay: true, color: 'var(--gold)' } : {}),
          ...(str === end ? { endingDay: true, color: 'var(--gold)' } : {})
        };
        curr.setDate(curr.getDate() + 1);
      }
      setMarkedDates(newMarked);
    }
  };

  const handleApply = () => {
    onApply({
      startDate: range.start || undefined,
      endDate: range.end || range.start || undefined,
      branchId: selectedBranch
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtrar Métricas</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Branch Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sucursal</Text>
              <View style={styles.branchGrid}>
                {[
                  { label: 'Todas', value: 'all' as const },
                  { label: 'Lomas', value: 'Lomas' as const },
                  { label: 'Centro', value: 'Centro' as const }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.branchItem,
                      selectedBranch === item.value && styles.branchItemActive
                    ]}
                    onPress={() => setSelectedBranch(item.value)}
                  >
                    <Text style={[
                      styles.branchLabel,
                      selectedBranch === item.value && styles.branchLabelActive
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rango de Fechas</Text>
              <Calendar
                theme={{
                  backgroundColor: 'transparent',
                  calendarBackground: 'transparent',
                  textSectionTitleColor: 'var(--text-muted)',
                  selectedDayBackgroundColor: 'var(--gold)',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: 'var(--gold)',
                  dayTextColor: '#ffffff',
                  textDisabledColor: 'var(--glass-border)',
                  monthTextColor: '#ffffff',
                  indicatorColor: 'var(--gold)',
                  textDayFontWeight: '600',
                  textMonthFontWeight: '800',
                  textDayHeaderFontWeight: '600',
                }}
                markedDates={markedDates}
                markingType="period"
                onDayPress={onDayPress}
                locale={es}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={() => {
              setSelectedBranch('all');
              setRange({ start: '', end: '' });
              setMarkedDates({});
            }}>
              <Text style={styles.resetBtnText}>Limpiar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'var(--bg-card)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  branchGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  branchItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    backgroundColor: 'var(--glass-surface)',
    alignItems: 'center',
  },
  branchItemActive: {
    borderColor: 'var(--gold)',
    backgroundColor: 'var(--gold-subtle)',
  },
  branchLabel: {
    color: 'var(--text-muted)',
    fontSize: 14,
    fontWeight: '700',
  },
  branchLabelActive: {
    color: 'var(--gold)',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: 'var(--glass-border)',
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'var(--glass-surface)',
    alignItems: 'center',
  },
  resetBtnText: {
    color: 'var(--text-secondary)',
    fontSize: 16,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'var(--gold)',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default MetricsFilters;
