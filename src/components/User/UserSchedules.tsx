import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Clock, Calendar, MapPin, ChevronRight, Info } from 'lucide-react';

export default function UserSchedules({ COLORS }: any) {
  const branches = [
    {
      id: 'centro',
      name: 'Sucursal Centro',
      address: 'Mariano Abasolo 59 B',
      schedule: [
        { day: 'Lunes - Sábado', hours: '10:00 AM - 7:00 PM' },
        { day: 'Domingo', hours: '10:00 AM - 3:00 PM' },
      ],
      color: '#D4AF37'
    },
    {
      id: 'lomas',
      name: 'Sucursal Lomas',
      address: 'Av. Lomas de San Juan 1129',
      schedule: [
        { day: 'Lunes - Sábado', hours: '10:00 AM - 8:00 PM' },
        { day: 'Domingo', hours: '10:00 AM - 3:00 PM' },
      ],
      color: '#8B5CF6'
    }
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.text }]}>Nuestros Horarios</Text>
        <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>Visítanos en cualquiera de nuestras sucursales</Text>
      </View>

      <View style={styles.grid}>
        {branches.map((branch) => (
          <View key={branch.id} style={[styles.card, { backgroundColor: COLORS.surface, borderColor: branch.color + '20' }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: branch.color + '15' }]}>
                <MapPin size={20} color={branch.color} />
              </View>
              <View>
                <Text style={[styles.branchName, { color: COLORS.text }]}>{branch.name}</Text>
                <Text style={[styles.branchAddress, { color: COLORS.textSecondary }]}>{branch.address}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

            <View style={styles.scheduleList}>
              {branch.schedule.map((item, idx) => (
                <View key={idx} style={styles.scheduleItem}>
                  <View style={styles.dayCol}>
                    <Calendar size={14} color={COLORS.textSecondary} />
                    <Text style={[styles.dayText, { color: COLORS.text }]}>{item.day}</Text>
                  </View>
                  <View style={[styles.hoursBadge, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Clock size={12} color={branch.color} />
                    <Text style={[styles.hoursText, { color: COLORS.text }]}>{item.hours}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.infoFooter, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.05)' : 'rgba(212, 175, 55, 0.02)' }]}>
                <Info size={14} color="#D4AF37" />
                <Text style={[styles.infoText, { color: COLORS.textSecondary }]}>Sujeto a disponibilidad de barberos.</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 32, gap: 8 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, opacity: 0.8 },
  grid: { gap: 20 },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  branchName: { fontSize: 18, fontWeight: '800' },
  branchAddress: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 20 },
  scheduleList: { gap: 12 },
  scheduleItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 4
  },
  dayCol: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayText: { fontSize: 14, fontWeight: '600' },
  hoursBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10 
  },
  hoursText: { fontSize: 12, fontWeight: '700' },
  infoFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginTop: 24, 
    padding: 12, 
    borderRadius: 12 
  },
  infoText: { fontSize: 11, fontStyle: 'italic' }
});
