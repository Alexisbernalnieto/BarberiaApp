import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users, CreditCard, TrendingUp, Calendar } from 'lucide-react';

const MetricCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <View style={styles.card}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
      <Icon size={22} color={color} />
    </View>
    <View style={styles.content}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtext}>{subtext}</Text>
    </View>
  </View>
);

const AdminMetrics = ({ totalToday, totalWalkins, dateLabel, COLORS, isMobile }: any) => {
  return (
    <View style={[styles.container, isMobile && styles.mobileContainer]}>
      <MetricCard 
        title="Citas Hoy" 
        value={totalToday} 
        subtext={dateLabel}
        icon={Calendar} 
        color="var(--gold)"
      />
      <MetricCard 
        title="Walk-ins" 
        value={totalWalkins} 
        subtext="Sin previa cita"
        icon={Users} 
        color="#10B981"
      />
      <MetricCard 
        title="Ingresos Estimados" 
        value={`$${(totalToday * 350).toLocaleString()}`} 
        subtext="Basado en servicios"
        icon={CreditCard} 
        color="#3B82F6"
      />
      <MetricCard 
        title="Ocupación" 
        value="85%" 
        subtext="+12% vs ayer"
        icon={TrendingUp} 
        color="#8B5CF6"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  mobileContainer: {
    flexDirection: 'column',
  },
  card: {
    flex: 1,
    minWidth: 200,
    backgroundColor: 'var(--bg-card)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  value: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  title: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  subtext: {
    color: 'var(--text-muted)',
    fontSize: 12,
    marginTop: 4,
  },
});

export default AdminMetrics;
