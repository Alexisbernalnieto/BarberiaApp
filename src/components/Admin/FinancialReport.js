import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const COLORS = {
  primary: '#d4af37',
  background: '#1a1a1a',
  surface: '#222',
  text: '#fff',
  secondaryText: '#888',
  green: '#2ecc71'
};

export default function FinancialReport({ appointments, onClose }) {
  const [filter, setFilter] = useState('day'); // 'day', 'month'

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // YYYY-MM

  const filteredAppointments = appointments.filter(app => {
    if (filter === 'day') return app.date === today;
    if (filter === 'month') return app.date.startsWith(currentMonth);
    return true;
  });

  const totalEarnings = filteredAppointments.reduce((sum, app) => sum + (app.price || 0), 0);
  const totalServices = filteredAppointments.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FINANZAS</Text>
        <TouchableOpacity onPress={onClose}><Text style={styles.close}>Cerrar</Text></TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
            style={[styles.tab, filter === 'day' && styles.activeTab]} 
            onPress={() => setFilter('day')}
        >
            <Text style={[styles.tabText, filter === 'day' && styles.activeTabText]}>HOY</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, filter === 'month' && styles.activeTab]} 
            onPress={() => setFilter('month')}
        >
            <Text style={[styles.tabText, filter === 'month' && styles.activeTabText]}>ESTE MES</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Ganancias Totales</Text>
        <Text style={styles.bigMoney}>${totalEarnings}</Text>
        <Text style={styles.cardSub}>{totalServices} servicios realizados</Text>
      </View>

      <Text style={styles.sectionTitle}>Desglose</Text>
      <ScrollView>
        {filteredAppointments.map((app, index) => (
            <View key={index} style={styles.row}>
                <View>
                    <Text style={styles.rowTitle}>{app.serviceName}</Text>
                    <Text style={styles.rowSub}>{app.date} - {app.barberName}</Text>
                </View>
                <Text style={styles.rowPrice}>+${app.price}</Text>
            </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  close: {
    color: '#fff',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: '#888',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#000',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardLabel: {
    color: '#888',
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  bigMoney: {
    color: COLORS.green,
    fontSize: 48,
    fontWeight: 'bold',
  },
  cardSub: {
    color: '#666',
    marginTop: 5,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  rowTitle: {
    color: '#fff',
    fontSize: 16,
  },
  rowSub: {
    color: '#666',
    fontSize: 12,
  },
  rowPrice: {
    color: COLORS.green,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
