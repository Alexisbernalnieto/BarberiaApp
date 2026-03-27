import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Scissors, Clock, DollarSign, ChevronRight, Star } from 'lucide-react';
import { SERVICES } from '../../data/mockData';

export default function UserServicesDetailed({ COLORS }: any) {
  // Sort services by price or category if we had one. 
  // Let's group them manually for a better look.
  const categories = [
    { name: 'CORTES DE CABELLO', items: [1, 2, 3, 4, 13] },
    { name: 'BARBA Y ROSTRO', items: [6, 7, 8, 9, 10] },
    { name: 'EXTRAS Y ESTILO', items: [5, 11, 12, 14] }
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.text }]}>Nuestros Servicios</Text>
        <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>Calidad y distinción en cada detalle</Text>
      </View>

      {categories.map((cat, idx) => (
        <View key={idx} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>{cat.name}</Text>
          <View style={styles.grid}>
            {cat.items.map((serviceId) => {
              const service = SERVICES.find(s => s.id === serviceId);
              if (!service) return null;
              return (
                <View 
                  key={serviceId} 
                  style={[styles.serviceCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.05)' }]}
                >
                  <View style={styles.cardMain}>
                    <View style={[styles.serviceIcon, { backgroundColor: COLORS.primary + '10' }]}>
                      <Scissors size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={[styles.serviceName, { color: COLORS.text }]}>{service.name}</Text>
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Clock size={12} color={COLORS.textSecondary} />
                          <Text style={[styles.metaText, { color: COLORS.textSecondary }]}>{service.duration} min</Text>
                        </View>
                        {service.assignedTo !== 'Todos' && (
                            <View style={styles.metaItem}>
                                <Star size={12} color="#D4AF37" fill="#D4AF37" />
                                <Text style={[styles.metaText, { color: "#D4AF37" }]}>Especializado</Text>
                            </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={[styles.priceTag, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.priceText}>${service.price}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 32, gap: 8 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, opacity: 0.8 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 16, opacity: 0.8 },
  grid: { gap: 12 },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  serviceIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  serviceInfo: { gap: 4, flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, fontWeight: '600' },
  priceTag: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 12,
    marginLeft: 12
  },
  priceText: { color: '#000', fontSize: 15, fontWeight: '900' }
});
