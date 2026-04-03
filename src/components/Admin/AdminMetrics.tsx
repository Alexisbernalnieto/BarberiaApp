import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

interface AdminMetricsProps {
  totalToday: number;
  totalWalkins: number;
  dateLabel: string;
  COLORS: any;
  isMobile: boolean;
}

export default function AdminMetrics({ totalToday, totalWalkins, dateLabel, COLORS, isMobile }: AdminMetricsProps) {
  return (
    <View style={[styles.metricRow, { gap: isMobile ? 16 : 24 }, isMobile && { flexDirection: 'column' }]}>
      <View style={[styles.glassCard, { flex: 1 }]} data-metric-card="true">
        <View style={styles.metricHeader}>
          <View style={[styles.iconContainer, { backgroundColor: 'var(--gold-subtle)' }]}>
            <DollarSign size={20} color={COLORS.primary || "var(--gold)"} strokeWidth={2.5} />
          </View>
          <Text style={[styles.metricLabel, { color: COLORS.textSecondary || 'var(--text-secondary)' }]}>Ingresos {dateLabel || 'hoy'}</Text>
        </View>
        <View style={styles.valueRow}>
          <View>
            <Text style={[styles.metricValue, { color: COLORS.primary || '#D4AF37' }]}>${totalToday.toLocaleString()}</Text>
            <Text style={{ color: COLORS.textSecondary || 'var(--text-secondary)', fontSize: 13, fontWeight: '600' }}>
              Bruto (100%)
            </Text>
          </View>
          
          <View style={{ height: 30, width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 8 }} />

          <View>
            <Text style={[styles.metricValue, { color: '#10B981', fontSize: 24 }]}>
              ${(totalToday * 0.5).toLocaleString()}
            </Text>
            <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700' }}>
              Neto (50%)
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.glassCard, { flex: 1 }]} data-metric-card="true">
        <View style={styles.metricHeader}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Users size={20} color="#3B82F6" strokeWidth={2.5} />
          </View>
          <Text style={[styles.metricLabel, { color: COLORS.textSecondary || 'var(--text-secondary)' }]}>Walk-ins</Text>
        </View>
        <View style={styles.valueRow}>
          <Text style={[styles.metricValue, { color: COLORS.text || '#FFF' }]}>{totalWalkins}</Text>
          <Text style={[styles.subValue, { color: COLORS.textMuted || 'var(--text-muted)' }]}>Clientes</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: 'row',
  },
  glassCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  trendText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  subValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
