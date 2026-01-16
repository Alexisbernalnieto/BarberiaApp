import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import QueueDisplay from './Admin/QueueDisplay';
import FinancialReport from './Admin/FinancialReport';
import BookingWizard from './Booking/BookingWizard';

const COLORS = {
  primary: '#d4af37',
  background: '#1a1a1a',
  surface: '#222222',
  text: '#ffffff',
  textSecondary: '#888888',
  accent: '#ff4444'
};

export default function AdminDashboard({ appointments, onLogout, onAddAppointment, role = 'admin' }) {
  const [viewMode, setViewMode] = useState('dashboard');

  const totalToday = appointments.reduce((acc, app) => acc + (app.price || 0), 0);
  const totalWalkins = appointments.filter(app => app.type === 'Walk-in').length;

  const handleWalkIn = (data) => {
    // Sobrescribir datos para Walk-in
    const walkInData = {
        ...data,
        userId: 'admin-walkin',
        userName: 'Cliente Presencial',
        status: 'En Local',
        type: 'Walk-in',
        isPaid: true // Asumimos pago en caja
    };
    onAddAppointment(walkInData);
    setViewMode('dashboard');
  };

  const renderDashboard = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Barbería</Text>
          <Text style={styles.subtitleHeader}>
            {role === 'reception' ? 'Panel recepción' : 'Panel administrador'}
          </Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Ingresos estimados hoy</Text>
          <Text style={styles.metricValue}>${totalToday}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Clientes walk-in</Text>
          <Text style={styles.metricValue}>{totalWalkins}</Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={[styles.actionCard, role === 'reception' && styles.actionCardWide]} onPress={() => setViewMode('walkin')}>
            <Text style={styles.actionIcon}>🚶</Text>
            <Text style={styles.actionText}>Nuevo Cliente (Walk-in)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, role === 'reception' && styles.actionCardWide]} onPress={() => setViewMode('queue')}>
            <Text style={styles.actionIcon}>📺</Text>
            <Text style={styles.actionText}>Pantalla Turnos</Text>
        </TouchableOpacity>
        {role === 'admin' && (
          <TouchableOpacity style={styles.actionCard} onPress={() => setViewMode('finance')}>
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionText}>Finanzas</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subtitle}>Agenda Global</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
            <View style={[styles.card, item.type === 'Walk-in' && styles.walkInCard]}>
            <View style={styles.cardHeader}>
                <Text style={styles.clientName}>{item.userName}</Text>
                <Text style={styles.status}>{item.time}</Text>
            </View>
            <Text style={styles.detail}>{item.date} - {item.barberName}</Text>
            <Text style={styles.detail}>{item.serviceName} - ${item.price}</Text>
            <Text style={styles.typeTag}>{item.type}</Text>
            </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </>
  );

  return (
    <View style={styles.container}>
      {viewMode === 'dashboard' && renderDashboard()}
      
      <Modal visible={viewMode === 'queue'} animationType="slide">
        <QueueDisplay appointments={appointments} onClose={() => setViewMode('dashboard')} />
      </Modal>

      <Modal visible={viewMode === 'finance'} animationType="slide">
        <FinancialReport appointments={appointments} onClose={() => setViewMode('dashboard')} />
      </Modal>

      <Modal visible={viewMode === 'walkin'} animationType="slide">
        <BookingWizard 
            user={{ email: role, name: role === 'reception' ? 'Recepción' : 'Admin' }}
            existingAppointments={appointments}
            onConfirm={handleWalkIn}
            onCancel={() => setViewMode('dashboard')}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  subtitleHeader: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  logoutText: {
    color: COLORS.text,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionCard: {
    width: '31%',
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  actionText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 5,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  walkInCard: {
    borderLeftColor: '#2ecc71',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  clientName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  status: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  detail: {
    color: '#aaa',
    fontSize: 14,
  },
  typeTag: {
    color: '#666',
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
    textTransform: 'uppercase',
  },
  actionCardWide: {
    width: '48%',
  }
});
