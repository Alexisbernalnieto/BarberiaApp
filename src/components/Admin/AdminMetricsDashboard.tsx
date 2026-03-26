import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { DollarSign, Calendar, Users, Trophy } from 'lucide-react';

interface AdminMetricsDashboardProps {
  metrics: {
    revenueMonth: number;
    appointmentsToday: { completed: number; cancelled: number; total: number };
    newUsersMonth: number;
    topServiceMonth: string;
    revenueByDay: { day: number; revenue: number }[];
  };
  COLORS: any;
  isMobile: boolean;
}

export default function AdminMetricsDashboard({ metrics, COLORS, isMobile }: AdminMetricsDashboardProps) {
  const maxRevenue = Math.max(...metrics.revenueByDay.map(d => d.revenue), 1);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, isMobile && { flexDirection: 'column' }]}>
        {/* 1. Ingresos Mensuales */}
        <View style={[styles.glassCard, { flex: 1, minWidth: isMobile ? '100%' : '22%' }]} data-metric-card="true">
          <View style={styles.metricHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'var(--gold-subtle)' }]}>
              <DollarSign size={20} color={COLORS.primary || "var(--gold)"} strokeWidth={2.5} />
            </View>
            <Text style={[styles.metricLabel, { color: COLORS.textSecondary || 'var(--text-secondary)' }]}>Ingresos del Mes</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.metricValue, { color: COLORS.text || '#FFF' }]}>
              ${metrics.revenueMonth.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* 2. Citas Hoy */}
        <View style={[styles.glassCard, { flex: 1, minWidth: isMobile ? '100%' : '22%' }]} data-metric-card="true">
          <View style={styles.metricHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Calendar size={20} color="#3B82F6" strokeWidth={2.5} />
            </View>
            <Text style={[styles.metricLabel, { color: COLORS.textSecondary || 'var(--text-secondary)' }]}>Citas de Hoy</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.metricValue, { color: COLORS.text || '#FFF' }]}>{metrics.appointmentsToday.completed}</Text>
            <Text style={[styles.subValue, { color: COLORS.textMuted || 'var(--text-muted)' }]}>de {metrics.appointmentsToday.total}</Text>
          </View>
        </View>

        {/* 3. Nuevos Usuarios */}
        <View style={[styles.glassCard, { flex: 1, minWidth: isMobile ? '100%' : '22%' }]} data-metric-card="true">
          <View style={styles.metricHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Users size={20} color="#10B981" strokeWidth={2.5} />
            </View>
            <Text style={[styles.metricLabel, { color: COLORS.textSecondary || 'var(--text-secondary)' }]}>Nuevos Usuarios</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.metricValue, { color: COLORS.text || '#FFF' }]}>{metrics.newUsersMonth}</Text>
            <Text style={[styles.subValue, { color: COLORS.textMuted || 'var(--text-muted)' }]}>este mes</Text>
          </View>
        </View>

        {/* 4. Top Servicio */}
        <View style={[styles.glassCard, { flex: 1, minWidth: isMobile ? '100%' : '22%' }]} data-metric-card="true">
          <View style={styles.metricHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Trophy size={20} color="#8B5CF6" strokeWidth={2.5} />
            </View>
            <Text style={[styles.metricLabel, { color: COLORS.textSecondary || 'var(--text-secondary)' }]}>Top Servicio</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.metricValue, { color: COLORS.text || '#FFF', fontSize: 22 }]} numberOfLines={1}>
              {metrics.topServiceMonth}
            </Text>
          </View>
        </View>
      </View>

      {/* Gráfica de Ingresos por Día */}
      <View style={[styles.glassCard, styles.chartContainer]}>
        <Text style={[styles.metricLabel, { color: COLORS.text || '#FFF', marginBottom: 24, fontSize: 16 }]}>
          Ingresos por Día (Este Mes)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
          {metrics.revenueByDay.map((item, index) => {
            const heightPercentage = Math.max((item.revenue / maxRevenue) * 100, item.revenue > 0 ? 5 : 0);

            return (
              <View key={index} style={styles.barGroup}>
                <View style={[styles.barTooltip, { opacity: item.revenue > 0 ? 1 : 0 }]}>
                    <Text style={[styles.tooltipText, { color: COLORS.textMuted || '#888' }]}>${item.revenue}</Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                  <View style={[
                    styles.barFill, 
                    { height: `${heightPercentage}%`, backgroundColor: COLORS.primary || 'var(--gold)' }
                  ]} />
                </View>
                <Text style={[styles.barLabel, { color: COLORS.textSecondary || 'var(--text-secondary)' }]}>
                  {item.day}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 24,
  },
  container: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
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
  subValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    width: '100%',
    paddingVertical: 24,
  },
  chartScroll: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingBottom: 8,
    paddingHorizontal: 8,
    minWidth: '100%',
  },
  barGroup: {
    alignItems: 'center',
    width: 36,
    gap: 8,
  },
  barTooltip: {
    marginBottom: 4,
    height: 14,
    justifyContent: 'center'
  },
  tooltipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  barTrack: {
    width: 16,
    height: 160,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
