import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CreditCard, Zap } from 'lucide-react';

const AdminMetrics = ({ totalToday, totalWalkins, dateLabel, COLORS, isMobile }: any) => {
  return (
    <View style={[styles.container, isMobile && styles.mobileContainer]}>
      <View style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.1)' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <CreditCard size={20} color={COLORS.primary} />
          </View>
          <Text style={[styles.title, { color: COLORS.textSecondary }]}>Ingresos {dateLabel}</Text>
        </View>
        <Text style={[styles.value, { color: COLORS.text }]}>${totalToday.toLocaleString()}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.1)' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <Zap size={20} color={COLORS.primary} />
          </View>
          <Text style={[styles.title, { color: COLORS.textSecondary }]}>Walk-ins</Text>
        </View>
        <Text style={[styles.value, { color: COLORS.text }]}>{totalWalkins}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
  },
  mobileContainer: {
    flexDirection: 'column',
  },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdminMetrics;
