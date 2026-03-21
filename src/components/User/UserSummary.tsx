import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { Appointment } from '../../types';

interface UserSummaryProps {
  nextAppointment?: Appointment;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  COLORS: any;
}

export default function UserSummary({ nextAppointment, activeTab, setActiveTab, COLORS }: UserSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen del Cliente</Text>
      
      {nextAppointment ? (
        <TouchableOpacity 
          style={[styles.card, { borderColor: COLORS.primary || '#D4AF37' }]}
          onPress={() => setActiveTab('appointments')}
        >
          <View style={styles.cardHeader}>
            <Calendar size={20} color={COLORS.primary || '#D4AF37'} />
            <Text style={styles.cardTitle}>Próxima Cita</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.appointmentName}>{nextAppointment.serviceName}</Text>
            <View style={styles.timeRow}>
              <Clock size={16} color="#888" />
              <Text style={styles.timeText}>{nextAppointment.date} a las {nextAppointment.time}</Text>
            </View>
          </View>
          <ChevronRight size={20} color="#888" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.emptyCard}
          onPress={() => setActiveTab('book')}
        >
          <Text style={styles.emptyText}>No tienes citas programadas.</Text>
          <Text style={styles.bookNow}>¡Reserva una ahora!</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  appointmentName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: '#888',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  bookNow: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
});
