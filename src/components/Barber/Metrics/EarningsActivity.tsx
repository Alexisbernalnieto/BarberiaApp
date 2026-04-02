import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Appointment } from '@/types';
import { formatCurrency } from '@/utils/barberMetrics';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  appointments: Appointment[];
  onOpenFilter: () => void;
  onBack: () => void;
  COLORS: any;
}

const EarningsActivity: React.FC<Props> = ({ appointments, onOpenFilter, onBack, COLORS }) => {
  // Grouping appointments by date
  const grouped = appointments.reduce((acc, app) => {
    const date = app.date || 'unknown';
    if (!acc[date]) acc[date] = [];
    acc[date].push(app);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Sorting dates descending
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Feather name="chevron-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Actividad</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={onOpenFilter}>
          <Feather name="calendar" size={18} color="var(--gold)" />
          <Text style={styles.filterBtnText}>Filtrar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sortedDates.map((dateString) => (
          <View key={dateString} style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateText}>
                {dateString === 'unknown' 
                  ? 'Fecha desconocida' 
                  : format(parseISO(dateString), "EEEE d 'de' MMMM", { locale: es })}
              </Text>
              <View style={styles.dateLine} />
            </View>

            {grouped[dateString].map((app, index) => (
              <View key={app.id || index} style={styles.activityCard}>
                <View style={styles.activityMain}>
                  <View style={styles.serviceIcon}>
                    <Feather name="scissors" size={18} color="var(--gold)" />
                  </View>
                  <View style={styles.serviceDetails}>
                    <Text style={styles.serviceName}>{app.serviceName || 'Corte de Cabello'}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.timeText}>{app.time || '00:00'}</Text>
                      <View style={styles.dot} />
                      <View style={[
                        styles.branchBadge,
                        app.branch?.toLowerCase().includes('lomas') ? styles.lomasBadge : styles.centroBadge
                      ]}>
                        <Text style={styles.branchText}>{app.branch || 'Sucursal'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Text style={styles.priceText}>{formatCurrency(app.price || 0)}</Text>
              </View>
            ))}
          </View>
        ))}

        {appointments.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="search" size={40} color="var(--text-muted)" />
            </View>
            <Text style={styles.emptyTitle}>No hay actividad</Text>
            <Text style={styles.emptySubtitle}>No se encontraron cortes en este periodo.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'var(--glass-surface)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  filterBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 24,
  },
  dateGroup: {
    gap: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  dateText: {
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'var(--glass-border)',
  },
  activityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  activityMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceDetails: {
    gap: 4,
    flex: 1,
  },
  serviceName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'var(--text-muted)',
  },
  branchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lomasBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  centroBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  branchText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#FFF',
  },
  priceText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'var(--glass-surface)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'var(--text-muted)',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EarningsActivity;
