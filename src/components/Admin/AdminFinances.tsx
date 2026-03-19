import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TrendingUp, ArrowLeft, DollarSign, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const AdminFinances = ({ COLORS, isMobile, onBack }: any) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={COLORS.primary} />
        <Text style={[styles.backText, { color: COLORS.primary }]}>Volver al Panel</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: COLORS.text }]}>Finanzas e Ingresos</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.mainCard, { backgroundColor: COLORS.surface, borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
           <Text style={[styles.mainLabel, { color: COLORS.textSecondary }]}>Balance Total (Marzo)</Text>
           <Text style={[styles.mainValue, { color: COLORS.text }]}>$24,500.00</Text>
           <View style={styles.trendRow}>
              <ArrowUpRight size={16} color="#10B981" />
              <Text style={{ color: '#10B981', fontWeight: '700' }}>+15% <Text style={{ color: COLORS.textSecondary, fontWeight: '400' }}>vs mes pasado</Text></Text>
           </View>
        </View>

        <View style={styles.grid}>
           <View style={[styles.smallCard, { backgroundColor: COLORS.surface }]}>
              <Text style={[styles.smallLabel, { color: COLORS.textSecondary }]}>Hoy</Text>
              <Text style={[styles.smallValue, { color: COLORS.text }]}>$1,200</Text>
           </View>
           <View style={[styles.smallCard, { backgroundColor: COLORS.surface }]}>
              <Text style={[styles.smallLabel, { color: COLORS.textSecondary }]}>Semana</Text>
              <Text style={[styles.smallValue, { color: COLORS.text }]}>$8,400</Text>
           </View>
        </View>

        <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Métodos de Pago</Text>
        <View style={styles.paymentMethods}>
            <View style={[styles.pmItem, { backgroundColor: COLORS.surface }]}>
                <DollarSign size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.pmName, { color: COLORS.text }]}>Efectivo</Text>
                    <Text style={{ color: COLORS.textSecondary }}>65% de transacciones</Text>
                </View>
                <Text style={[styles.pmValue, { color: COLORS.text }]}>$15,925</Text>
            </View>
            <View style={[styles.pmItem, { backgroundColor: COLORS.surface }]}>
                <Calendar size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.pmName, { color: COLORS.text }]}>Tarjeta / Stripe</Text>
                    <Text style={{ color: COLORS.textSecondary }}>35% de transacciones</Text>
                </View>
                <Text style={[styles.pmValue, { color: COLORS.text }]}>$8,575</Text>
            </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontWeight: '700', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  content: { gap: 20, paddingBottom: 40 },
  mainCard: { padding: 32, borderRadius: 28, borderWidth: 1, gap: 8 },
  mainLabel: { fontSize: 14, fontWeight: '600' },
  mainValue: { fontSize: 40, fontWeight: '900' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  grid: { flexDirection: 'row', gap: 16 },
  smallCard: { flex: 1, padding: 20, borderRadius: 20, gap: 4 },
  smallLabel: { fontSize: 12, fontWeight: '600' },
  smallValue: { fontSize: 24, fontWeight: '800' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  paymentMethods: { gap: 12 },
  pmItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, gap: 16 },
  pmName: { fontSize: 16, fontWeight: '700' },
  pmValue: { fontSize: 18, fontWeight: '800' },
});

export default AdminFinances;
