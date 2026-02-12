import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminMetrics({ totalToday, totalWalkins, COLORS }) {
  return (
    <View style={styles.metricRow}>
      <View style={[styles.metricCard, { backgroundColor: COLORS.surface }]}>
        <View style={styles.metricHeader}>
           <MaterialCommunityIcons name="cash-multiple" size={24} color={COLORS.primary} />
           <Text style={[styles.metricLabel, { color: COLORS.textSecondary }]}>Ingresos hoy</Text>
        </View>
        <Text style={[styles.metricValue, { color: COLORS.text }]}>${totalToday}</Text>
      </View>
      <View style={[styles.metricCard, { backgroundColor: COLORS.surface }]}>
        <View style={styles.metricHeader}>
           <MaterialCommunityIcons name="walk" size={24} color={COLORS.primary} />
           <Text style={[styles.metricLabel, { color: COLORS.textSecondary }]}>Walk-ins</Text>
        </View>
        <Text style={[styles.metricValue, { color: COLORS.text }]}>{totalWalkins}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },
  metricCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});
