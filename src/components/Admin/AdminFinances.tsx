import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TrendingUp, ArrowLeft, DollarSign, Calendar, MapPin, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Appointment } from '../../types';

interface AdminFinancesProps {
  appointments: Appointment[];
  COLORS: any;
  isMobile?: boolean;
  onBack: () => void;
}

const COMMISSION_RATE = 0.5;

const AdminFinances = ({ appointments, COLORS, isMobile, onBack }: AdminFinancesProps) => {
  const data = useMemo(() => {
    // Only completed appointments generate revenue
    const completed = appointments.filter(a => a.status === 'completed');

    let totalGross = 0;
    let todayGross = 0;
    let weekGross = 0;
    let lomasGross = 0;
    let centroGross = 0;
    let cashGross = 0;
    let stripeGross = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().getTime();

    completed.forEach(app => {
      const p = app.price || 0;
      totalGross += p;

      if (app.date === todayStr) {
        todayGross += p;
      }

      const diffTime = Math.abs(nowTime - new Date(app.date).getTime());
      if (diffTime <= 7 * 24 * 60 * 60 * 1000) {
        weekGross += p;
      }

      if (app.branch === 'Sucursal Lomas' || app.branch === 'Lomas' || (app.branch && app.branch.toLowerCase().includes('lomas'))) {
        lomasGross += p;
      } else {
        centroGross += p;
      }

      const isPaidOnline = app.paymentIntentId || app.paid;
      if (isPaidOnline) {
        stripeGross += p;
      } else {
        cashGross += p;
      }
    });

    const totalNet = totalGross * (1 - COMMISSION_RATE);
    const totalCom = totalGross * COMMISSION_RATE;
    const todayNet = todayGross * (1 - COMMISSION_RATE);
    const weekNet = weekGross * (1 - COMMISSION_RATE);
    
    // Branch net calculations (50/50 breakdown)
    const lomasNet = lomasGross * (1 - COMMISSION_RATE);
    const centroNet = centroGross * (1 - COMMISSION_RATE);

    const cashPercent = totalGross ? Math.round((cashGross / totalGross) * 100) : 0;
    const stripePercent = totalGross ? Math.round((stripeGross / totalGross) * 100) : 0;

    return {
      totalGross,
      totalNet,
      totalCom,
      todayGross,
      todayNet,
      weekGross,
      weekNet,
      lomasGross,
      lomasNet,
      centroGross,
      centroNet,
      cashGross,
      stripeGross,
      cashPercent,
      stripePercent
    };
  }, [appointments]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={COLORS.primary} />
        <Text style={[styles.backText, { color: COLORS.primary }]}>Volver al Panel</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: COLORS.text }]}>Resumen Financiero Total</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainCard, { backgroundColor: COLORS.surface, borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
           <Text style={[styles.mainLabel, { color: COLORS.textSecondary }]}>Ingreso Neto Total (La Barbería)</Text>
           <Text style={[styles.mainValue, { color: COLORS.text }]}>${data.totalNet.toLocaleString()}</Text>
           
           <View style={styles.ratioContainer}>
              <View style={[styles.ratioBarBase, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                 <View style={[styles.ratioBarFill, { width: '50%', backgroundColor: COLORS.primary }]} />
              </View>
              <View style={styles.ratioLabels}>
                 <Text style={[styles.ratioText, { color: COLORS.primary }]}>50% Barbería</Text>
                 <Text style={[styles.ratioText, { color: '#EF4444' }]}>50% Barberos</Text>
              </View>
           </View>

           <View style={{ flexDirection: 'row', gap: 24, marginTop: 12 }}>
               <View>
                 <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Ingreso Bruto (Histórico)</Text>
                 <Text style={{ color: '#FFF', fontWeight: 'bold' }}>${data.totalGross.toLocaleString()}</Text>
               </View>
               <View>
                 <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Pago a Barberos (50%)</Text>
                 <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>-${data.totalCom.toLocaleString()}</Text>
               </View>
           </View>
        </View>

        <View style={styles.grid}>
           <View style={[styles.smallCard, { backgroundColor: COLORS.surface }]}>
              <Text style={[styles.smallLabel, { color: COLORS.textSecondary }]}>Neto Hoy</Text>
              <Text style={[styles.smallValue, { color: '#10B981' }]}>${data.todayNet.toLocaleString()}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>Bruto: ${data.todayGross.toLocaleString()}</Text>
           </View>
           <View style={[styles.smallCard, { backgroundColor: COLORS.surface }]}>
              <Text style={[styles.smallLabel, { color: COLORS.textSecondary }]}>Neto 7 Días</Text>
              <Text style={[styles.smallValue, { color: '#10B981' }]}>${data.weekNet.toLocaleString()}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>Bruto: ${data.weekGross.toLocaleString()}</Text>
           </View>
        </View>

        <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Desglose por Sucursal (50/50)</Text>
        <View style={styles.grid}>
           <View style={[styles.smallCard, { backgroundColor: COLORS.surface, minHeight: 140 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <MapPin size={20} color={COLORS.primary} />
                <Text style={[styles.smallLabel, { color: COLORS.textSecondary, marginLeft: 8 }]}>S. Lomas</Text>
              </View>
              <Text style={[styles.smallValue, { color: '#10B981', fontSize: 24 }]}>${data.lomasNet.toLocaleString()}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 4 }}>Neto Barbería (50%)</Text>
              <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 8 }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Bruto Total: <Text style={{ color: '#FFF' }}>${data.lomasGross.toLocaleString()}</Text></Text>
              </View>
           </View>
           
           <View style={[styles.smallCard, { backgroundColor: COLORS.surface, minHeight: 140 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <MapPin size={20} color={COLORS.primary} />
                <Text style={[styles.smallLabel, { color: COLORS.textSecondary, marginLeft: 8 }]}>S. Centro</Text>
              </View>
              <Text style={[styles.smallValue, { color: '#10B981', fontSize: 24 }]}>${data.centroNet.toLocaleString()}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 4 }}>Neto Barbería (50%)</Text>
              <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 8 }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Bruto Total: <Text style={{ color: '#FFF' }}>${data.centroGross.toLocaleString()}</Text></Text>
              </View>
           </View>
        </View>

        <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Métodos de Pago (Histórico Bruto)</Text>
        <View style={styles.paymentMethods}>
            <View style={[styles.pmItem, { backgroundColor: COLORS.surface }]}>
                <DollarSign size={24} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.pmName, { color: COLORS.text }]}>Efectivo en Sucursal</Text>
                    <Text style={{ color: COLORS.textSecondary }}>{data.cashPercent}% de transacciones</Text>
                </View>
                <Text style={[styles.pmValue, { color: COLORS.text }]}>${data.cashGross.toLocaleString()}</Text>
            </View>
            <View style={[styles.pmItem, { backgroundColor: COLORS.surface }]}>
                <Calendar size={24} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.pmName, { color: COLORS.text }]}>Tarjeta / Online</Text>
                    <Text style={{ color: COLORS.textSecondary }}>{data.stripePercent}% de transacciones</Text>
                </View>
                <Text style={[styles.pmValue, { color: COLORS.text }]}>${data.stripeGross.toLocaleString()}</Text>
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
  ratioContainer: { marginTop: 16, gap: 6 },
  ratioBarBase: { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' },
  ratioBarFill: { height: '100%' },
  ratioLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  ratioText: { fontSize: 11, fontWeight: '800' },
  grid: { flexDirection: 'row', gap: 16 },
  smallCard: { flex: 1, padding: 20, borderRadius: 20, gap: 4 },
  smallLabel: { fontSize: 12, fontWeight: '600' },
  smallValue: { fontSize: 28, fontWeight: '800' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  paymentMethods: { gap: 12 },
  pmItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, gap: 16 },
  pmName: { fontSize: 16, fontWeight: '700' },
  pmValue: { fontSize: 20, fontWeight: '800' },
});

export default AdminFinances;
