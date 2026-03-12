import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Clock } from 'lucide-react';

const AdminCalendar = ({ appointments, COLORS, isMobile }: any) => {
  const todayApps = appointments.slice(0, 5); // Mock today's first 5

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Próximas Citas</Text>
      <View style={styles.list}>
        {todayApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay citas programadas para hoy</Text>
          </View>
        ) : (
          todayApps.map((app: any) => (
            <View key={app.id} style={styles.apptCard}>
              <View style={styles.apptTime}>
                <Clock size={16} color="var(--gold)" />
                <Text style={styles.timeText}>{app.time}</Text>
              </View>
              <View style={styles.apptDetails}>
                <Text style={styles.clientName}>{app.userName}</Text>
                <Text style={styles.serviceName}>{app.serviceName} • {app.barberName}</Text>
              </View>
              <View style={[styles.statusBadge, app.status === 'confirmed' && styles.confirmedBadge]}>
                   <Text style={[styles.statusText, app.status === 'confirmed' && styles.confirmedText]}>{app.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  apptTime: {
    width: 80,
    gap: 4,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'var(--glass-border)',
    paddingRight: 16,
  },
  timeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  apptDetails: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 4,
  },
  clientName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  serviceName: {
    color: 'var(--text-secondary)',
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  confirmedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  confirmedText: {
    color: '#10B981',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: 14,
  },
});

export default AdminCalendar;
