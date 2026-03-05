import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminMetrics({ totalToday, totalWalkins, dateLabel, COLORS, isMobile }) {
  return (
    <View style={[styles.metricRow, { gap: isMobile ? 12 : 20, marginBottom: isMobile ? 16 : 30 }]}>
      <View style={[styles.metricCard, { backgroundColor: COLORS.surface, padding: isMobile ? 14 : 20 }]}>
        <View style={styles.metricHeader}>
          <MaterialCommunityIcons name="cash-multiple" size={isMobile ? 20 : 24} color={COLORS.primary} />
          <Text style={[styles.metricLabel, { color: COLORS.textSecondary, fontSize: isMobile ? 12 : 14 }]}>
            Ingresos {dateLabel || 'hoy'}
          </Text>
        </View>
        <Text style={[styles.metricValue, { color: COLORS.text, fontSize: isMobile ? 22 : 28 }]}>
          ${totalToday.toLocaleString()}
        </Text>
      </View>
      <View style={[styles.metricCard, { backgroundColor: COLORS.surface, padding: isMobile ? 14 : 20 }]}>
        <View style={styles.metricHeader}>
          <MaterialCommunityIcons name="walk" size={isMobile ? 20 : 24} color={COLORS.primary} />
          <Text style={[styles.metricLabel, { color: COLORS.textSecondary, fontSize: isMobile ? 12 : 14 }]}>
            Walk-ins
          </Text>
        </View>
        <Text style={[styles.metricValue, { color: COLORS.text, fontSize: isMobile ? 22 : 28 }]}>
          {totalWalkins}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
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
    marginBottom: 8,
  },
  metricLabel: {
    marginLeft: 8,
    fontWeight: '600',
  },
  metricValue: {
    fontWeight: 'bold',
  },
});
