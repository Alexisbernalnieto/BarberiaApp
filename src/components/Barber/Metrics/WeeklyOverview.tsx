import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';
import { WeeklyMetrics, formatCurrency, formatDuration } from '@/utils/barberMetrics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  metrics: WeeklyMetrics;
  COLORS: any;
  onSelectWeek: () => void;
  onViewActivity: () => void;
  onOpenFilters: () => void;
}

const WeeklyOverview: React.FC<Props> = ({ 
  metrics, 
  COLORS, 
  onSelectWeek, 
  onViewActivity,
  onOpenFilters 
}) => {
  const chartConfig = {
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    fillShadowGradientFrom: COLORS.primary || '#D4AF37',
    fillShadowGradientTo: COLORS.primary || '#D4AF37',
    fillShadowGradientOpacity: 1,
    color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`, // Gold color
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.6})`,
    strokeWidth: 2,
    barPercentage: 0.5, // Slightly thinner bars to fit better
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeDasharray: '', // solid background lines
      stroke: 'rgba(255, 255, 255, 0.05)',
    },
  };

  const chartData = {
    labels: metrics.dailyData.map(d => {
      // Use single-letter labels in Spanish (L, M, X, J, V, S, D) to save space
      const day = d.day.toLowerCase();
      if (day.includes('mon')) return 'L';
      if (day.includes('tue')) return 'M';
      if (day.includes('wed')) return 'X'; // X for Wednesday in Spanish (Miércoles)
      if (day.includes('thu')) return 'J';
      if (day.includes('fri')) return 'V';
      if (day.includes('sat')) return 'S';
      if (day.includes('sun')) return 'D';
      return d.day.charAt(0);
    }),
    datasets: [
      {
        data: metrics.dailyData.map(d => d.amount),
      },
    ],
  };

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Top Navigation / Filters */}
      <View style={styles.topActions}>
        <TouchableOpacity style={styles.filterBtn} onPress={onOpenFilters}>
          <Feather name="filter" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.weekPicker} onPress={onSelectWeek}>
          <Text style={styles.weekPickerText}>
            {format(metrics.weekStart, "d 'de' MMM", { locale: es })} - {format(metrics.weekEnd, "d 'de' MMM", { locale: es })}
          </Text>
          <Feather name="chevron-down" size={16} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      {/* Earnings Total */}
      <View style={styles.header}>
        <Text style={[styles.totalEarnings, { color: COLORS.primary }]}>{formatCurrency(metrics.totalEarnings)}</Text>
        <Text style={styles.totalLabel}>Ganancia Total</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.secondary}20` }]}>
              <Feather name="clock" size={16} color={COLORS.secondary} />
            </View>
            <Text style={styles.statValue}>{formatDuration(metrics.onlineMinutes)}</Text>
            <Text style={styles.statLabel}>Horas Trabajadas</Text>
          </View>
          
          <View style={[styles.statItem, styles.statItemBorder]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${COLORS.secondary}20` }]}>
              <Feather name="scissors" size={16} color={COLORS.secondary} />
            </View>
            <Text style={styles.statValue}>{metrics.totalTrips}</Text>
            <Text style={styles.statLabel}>Cortes</Text>
          </View>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Gráfico Semanal</Text>
          <Feather name="trending-up" size={16} color={COLORS.secondary} />
        </View>
        <BarChart
          data={chartData}
          width={Dimensions.get('window').width - 80}
          height={200}
          yAxisLabel="$"
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
          withInnerLines={true}
          style={styles.chart}
          showBarTops={false}
          flatColor={true}
        />
      </View>

      {/* Activity Link */}
      <TouchableOpacity style={styles.activityLink} onPress={onViewActivity}>
        <View style={styles.activityLeft}>
          <View style={[styles.activityIcon, { backgroundColor: `${COLORS.secondary}20` }]}>
            <Feather name="list" size={20} color={COLORS.secondary} />
          </View>
          <View>
            <Text style={styles.activityTitle}>Actividad de Ganancias</Text>
            <Text style={styles.activitySub}>Ver todos los cortes</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={COLORS.text} />
      </TouchableOpacity>

      {/* Breakdown Placeholder */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownHeader}>Desglose Estimado</Text>
        
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLeft}>
            <Feather name="dollar-sign" size={18} color={COLORS.primary} />
            <Text style={styles.breakdownLabel}>Tarifa Neta</Text>
          </View>
          <Text style={styles.breakdownValue}>{formatCurrency(metrics.totalEarnings)}</Text>
        </View>

        <View style={[styles.breakdownRow, styles.totalRow]}>
          <Text style={styles.finalLabel}>Total Bruto</Text>
          <Text style={styles.finalValue}>{formatCurrency(metrics.totalEarnings)}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  weekPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  weekPickerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  totalEarnings: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  totalLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  chart: {
    paddingRight: 40,
    borderRadius: 16,
    marginLeft: -10,
  },
  activityLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  activitySub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
  },
  breakdownCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 16,
  },
  breakdownHeader: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
  },
  finalLabel: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  finalValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
});

export default WeeklyOverview;
