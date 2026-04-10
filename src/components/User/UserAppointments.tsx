import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, useWindowDimensions } from 'react-native';
import { MapPin, Calendar, Clock, CalendarX } from 'lucide-react';
import AppointmentDetail from './AppointmentDetail';
import { Appointment } from '../../types';
import { formatFullDate, formatTime12h, isAppointmentExpired } from '../../utils/formatters';

interface UserAppointmentsProps {
  user: any;
  appointments: Appointment[];
  COLORS: any;
  isMobile: boolean;
}

export default function UserAppointments({ user, appointments, COLORS, isMobile }: UserAppointmentsProps) {
  const { width } = useWindowDimensions();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const numColumns = width < 600 ? 1 : width < 1024 ? 2 : 3;
  const gap = 16;
  const itemWidth = (width - (isMobile ? 40 : 320) - (numColumns + 1) * gap) / numColumns;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const filteredAppointments = appointments
    .filter((app: Appointment) => {
      const isExpired = isAppointmentExpired(app.date, app.time);
      const isActive = app.status === 'confirmed' || app.status === 'checked_in' || app.status === 'in_progress';
      
      if (filter === 'upcoming') {
        return !isExpired && isActive;
      }
      // Past tab: expired, completed, cancelled, no_show, or unhandled
      return isExpired || !isActive;
    })
    .sort((a: Appointment, b: Appointment) => filter === 'upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));

  const renderItem = ({ item }: { item: Appointment }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0,0,0,0.06)' }]}
      onPress={() => setSelectedAppointment(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.serviceInfo}>
          <Text style={[styles.idLabel, { color: COLORS.primary }]}>ID: {item.id.substring(item.id.length - 8).toUpperCase()}</Text>
          <Text style={[styles.serviceName, { color: COLORS.text }]}>{item.serviceName}</Text>
          <Text style={[styles.barberName, { color: COLORS.textSecondary }]}>con {item.barberName}</Text>
        </View>
        <View style={[styles.priceBadge, { backgroundColor: COLORS.primary + '15' }]}>
          <Text style={[styles.priceText, { color: COLORS.primary }]}>${item.price}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
         <View style={styles.dateTime}>
            <MapPin size={16} color={COLORS.primary} />
            <Text style={[styles.footerText, { color: COLORS.textSecondary }]}>{item.branch}</Text>
         </View>
         <View style={styles.dateTime}>
            <Calendar size={16} color={COLORS.primary} />
            <Text style={[styles.footerText, { color: COLORS.textSecondary }]}>{formatFullDate(item.date)}</Text>
         </View>
         <View style={styles.dateTime}>
            <Clock size={16} color={COLORS.primary} />
            <Text style={[styles.footerText, { color: COLORS.textSecondary }]}>{formatTime12h(item.time)}</Text>
         </View>
         <View style={[styles.statusBadge, { 
           backgroundColor: 
            item.status === 'confirmed' ? '#10B98120' : 
            item.status === 'checked_in' ? '#3B82F620' :
            item.status === 'completed' ? '#10B98120' :
            item.status === 'unhandled' ? '#F59E0B20' :
            '#EF444420',
           borderColor: 
            item.status === 'confirmed' ? '#10B981' : 
            item.status === 'checked_in' ? '#3B82F6' :
            item.status === 'completed' ? '#10B981' :
            item.status === 'unhandled' ? '#F59E0B' :
            '#EF4444'
         }]}>
            <Text style={[styles.statusText, { 
              color: 
                item.status === 'confirmed' ? '#10B981' : 
                item.status === 'checked_in' ? '#3B82F6' :
                item.status === 'completed' ? '#10B981' :
                item.status === 'unhandled' ? '#F59E0B' :
                '#EF4444'
            }]}>
              {item.status === 'unhandled' ? 'NO GESTIONADA' : 
               item.status === 'no_show' ? 'FALTÓ' : 
               item.status === 'checked_in' ? 'LLEGÓ' :
               item.status === 'in_progress' ? 'EN SERVICIO' :
               item.status === 'cancelled' ? (item.refundStatus === 'completed' ? 'REEMBOLSADO' : 'CANCELADA') :
               item.status === 'completed' ? 'COMPLETADA' :
               item.status === 'confirmed' ? 'CONFIRMADA' :
               item.status === 'rescheduled' ? 'REAGENDADA' :
               item.status === 'pending_payment' ? 'PAGO PENDIENTE' :
               item.status?.toUpperCase().replace('_', ' ')}
            </Text>
         </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.text }]}>Mis Reservas</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            onPress={() => setFilter('upcoming')}
            style={[styles.filterBtn, filter === 'upcoming' && { borderBottomColor: COLORS.primary }]}
          >
            <Text style={[styles.filterText, { color: filter === 'upcoming' ? COLORS.primary : COLORS.textSecondary }]}>Próximas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setFilter('past')}
            style={[styles.filterBtn, filter === 'past' && { borderBottomColor: COLORS.primary }]}
          >
            <Text style={[styles.filterText, { color: filter === 'past' ? COLORS.primary : COLORS.textSecondary }]}>Historial</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredAppointments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CalendarX size={48} color={COLORS.textSecondary + '40'} />
            <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>No hay citas para mostrar</Text>
          </View>
        }
      />

      <AppointmentDetail 
        visible={!!selectedAppointment}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        COLORS={COLORS}
        isMobile={isMobile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 20 },
  header: { gap: 16 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  filterContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  filterBtn: { paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterText: { fontSize: 14, fontWeight: '700' },
  listContent: { gap: 16, paddingBottom: 40 },
  card: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceInfo: { flex: 1 },
  idLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2, opacity: 0.8 },
  serviceName: { fontSize: 18, fontWeight: '700' },
  barberName: { fontSize: 14, marginTop: 4 },
  priceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  priceText: { fontWeight: '800', fontSize: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  dateTime: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  footerText: { fontSize: 13, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5 },
  statusText: { fontSize: 10, fontWeight: '800' },
  emptyState: { padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '500' }
});
