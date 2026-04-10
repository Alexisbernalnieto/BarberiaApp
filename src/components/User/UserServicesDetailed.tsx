import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Scissors, Clock, DollarSign, ChevronDown, Star, Store, Info } from 'lucide-react';
import { db } from '../../firebaseClient';
import { collection, query, getDocs } from 'firebase/firestore';
import { Service } from '../../types';

export default function UserServicesDetailed({ COLORS }: any) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});

  const fetchServices = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'services'));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      
      setServices(fetched.filter(s => (s as any).active !== false));
    } catch (error) {
      console.error("[USER SERVICES] Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Group services by category
  const servicesByCategory = services.reduce((acc: any, service) => {
    const cat = (service.category || 'OTROS').toUpperCase();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {});

  const categoryIds = Object.keys(servicesByCategory).sort();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.text }]}>Nuestros Servicios</Text>
        <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>Calidad y distinción en cada detalle</Text>
      </View>

      {categoryIds.length === 0 && (
        <View style={styles.emptyState}>
          <Info size={40} color={COLORS.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>No hay servicios disponibles en este momento.</Text>
        </View>
      )}

      {categoryIds.map((catId) => (
        <View key={catId} style={styles.section}>
          <TouchableOpacity 
            style={[
              styles.categoryHeader, 
              { 
                backgroundColor: COLORS.surface,
                borderColor: expandedCategories[catId] ? COLORS.primary : 'rgba(255,255,255,0.05)',
                borderWidth: 1,
              }
            ]} 
            onPress={() => toggleCategory(catId)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.categoryIcon, { backgroundColor: expandedCategories[catId] ? COLORS.primary : COLORS.primary + '10' }]}>
                <Scissors size={20} color={expandedCategories[catId] ? '#000' : COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.categoryTitle, { color: expandedCategories[catId] ? COLORS.primary : COLORS.text }]}>{catId}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '800' }}>
                  {servicesByCategory[catId].length} OPCIONES
                </Text>
              </View>
            </View>
            <ChevronDown 
              size={20} 
              color={expandedCategories[catId] ? COLORS.primary : COLORS.textSecondary} 
              style={{ transform: [{ rotate: expandedCategories[catId] ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {expandedCategories[catId] && (
            <View style={styles.grid}>
              {servicesByCategory[catId].map((service: Service) => (
                <View 
                  key={service.id} 
                  style={[styles.serviceCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                >
                  <View style={styles.cardMain}>
                    <View style={styles.serviceInfo}>
                      <Text style={[styles.serviceName, { color: COLORS.text }]}>{service.name}</Text>
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Clock size={12} color={COLORS.textSecondary} />
                          <Text style={[styles.metaText, { color: COLORS.textSecondary }]}>{service.duration} min</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Store size={12} color={COLORS.textSecondary} />
                          <Text style={[styles.metaText, { color: COLORS.textSecondary }]}>{service.branch || 'Todas'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.priceTag, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.priceText}>${Number(service.price).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 32, gap: 8 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, opacity: 0.8 },
  section: { marginBottom: 16 },
  categoryHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 20,
    marginBottom: 8
  },
  categoryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  grid: { gap: 12, paddingHorizontal: 4, marginTop: 8, marginBottom: 16 },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
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
  priceText: { color: '#000', fontSize: 15, fontWeight: '900' },
  emptyState: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', fontSize: 14, fontStyle: 'italic' }
});
