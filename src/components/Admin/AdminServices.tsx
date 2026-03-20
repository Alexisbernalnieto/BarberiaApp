import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Search, Plus, ChevronDown, ChevronRight, Tag, Store, DollarSign, X } from 'lucide-react';
import { db } from '../../firebaseClient';
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Service } from '../../types';

const AdminServices = ({ COLORS, isMobile, onBack }: any) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('AMBAS');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['CORTES', 'BARBAS', 'FACIALES']);

  const categories = [
    { id: 'BARBAS', label: 'BARBAS', icon: '✂️' },
    { id: 'CORTES', label: 'CORTES', icon: '💇‍♂️' },
    { id: 'FACIALES', label: 'FACIALES', icon: '💆‍♂️' },
  ];

  const fetchServices = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'services'));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServices(fetched);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = selectedBranch === 'AMBAS' || s.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  const getServicesByCategory = (cat: string) => {
    return filteredServices.filter(s => {
        // Logic to group by category (mocking for now based on name or a category field)
        const name = s.name.toUpperCase();
        if (cat === 'BARBAS') return name.includes('BARBA') || name.includes('RASURADO');
        if (cat === 'FACIALES') return name.includes('FACIAL') || name.includes('MASCARILLA');
        if (cat === 'CORTES') return !name.includes('BARBA') && !name.includes('FACIAL') && !name.includes('RASURADO');
        return false;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.primary }]}>GESTIÓN DE SERVICIOS</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.closeBtn, { color: COLORS.text }]}>Cerrar</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.filterCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.1)' }]}>
        <View style={[styles.searchBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput 
            placeholder="Buscar servicio..."
            placeholderTextColor={COLORS.textSecondary + '80'}
            style={[styles.searchInput, { color: COLORS.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterSection}>
           <Text style={[styles.filterLabel, { color: COLORS.textSecondary }]}>SUCURSAL:</Text>
           <View style={styles.branchRow}>
             {['AMBAS', 'CENTRO', 'LOMAS'].map(b => (
               <TouchableOpacity 
                 key={b}
                 style={[styles.branchBtn, selectedBranch === b && { backgroundColor: COLORS.primary }]}
                 onPress={() => setSelectedBranch(b)}
               >
                 <Text style={[styles.branchBtnText, { color: selectedBranch === b ? '#000' : COLORS.textSecondary }]}>{b}</Text>
               </TouchableOpacity>
             ))}
           </View>
        </View>

        <View style={styles.filterSection}>
           <Text style={[styles.filterLabel, { color: COLORS.textSecondary }]}>PRECIO:</Text>
           <View style={styles.priceRange}>
              <Text style={{ color: COLORS.text }}>$ 0 - 1000</Text>
              <TouchableOpacity style={styles.resetBtn}>
                <Text style={{ color: '#888', fontSize: 12 }}>Restablecer</Text>
              </TouchableOpacity>
           </View>
        </View>

        <View style={styles.divider} />
        <Text style={[styles.resultsCount, { color: COLORS.primary }]}>{filteredServices.length} SERVICIOS ENCONTRADOS</Text>
      </View>

      <TouchableOpacity style={[styles.createBtn, { borderColor: COLORS.primary }]}>
        <Text style={[styles.createBtnText, { color: COLORS.primary }]}>+ CREAR NUEVO SERVICIO</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.categoryList}>
          {categories.map(cat => (
            <View key={cat.id} style={styles.categoryGroup}>
              <TouchableOpacity 
                style={[styles.categoryHeader, { backgroundColor: COLORS.surface, borderColor: 'rgba(212, 175, 55, 0.2)' }]}
                onPress={() => toggleCategory(cat.id)}
              >
                <View style={styles.categoryTitleRow}>
                  {expandedCategories.includes(cat.id) ? <ChevronDown size={20} color={COLORS.primary} /> : <ChevronRight size={20} color={COLORS.primary} />}
                  <Text style={[styles.categoryLabel, { color: COLORS.primary }]}>{cat.label}</Text>
                </View>
                <View style={[styles.countBadge, { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.countText}>{getServicesByCategory(cat.id).length}</Text>
                </View>
              </TouchableOpacity>

              {expandedCategories.includes(cat.id) && (
                <View style={styles.serviceItems}>
                  {getServicesByCategory(cat.id).map(service => (
                    <View key={service.id} style={[styles.serviceCard, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                        <View style={styles.serviceInfo}>
                            <Text style={[styles.serviceName, { color: COLORS.text }]}>{service.name}</Text>
                            <Text style={{ color: COLORS.textSecondary }}>{service.duration} min • {service.branch || 'Todas'}</Text>
                        </View>
                        <Text style={[styles.servicePrice, { color: COLORS.primary }]}>${service.price}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { fontSize: 16, fontWeight: '700' },
  filterCard: { padding: 24, borderRadius: 28, borderWidth: 1, gap: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 14, paddingHorizontal: 16, gap: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  filterSection: { gap: 10 },
  filterLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  branchRow: { flexDirection: 'row', gap: 8 },
  branchBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  branchBtnText: { fontSize: 12, fontWeight: '800' },
  priceRange: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resetBtn: { padding: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },
  resultsCount: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  createBtn: { height: 56, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { fontWeight: '800', fontSize: 15 },
  categoryList: { gap: 12, paddingBottom: 40 },
  categoryGroup: { gap: 8 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
  categoryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryLabel: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  countBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#000', fontSize: 13, fontWeight: '800' },
  serviceItems: { gap: 8, paddingHorizontal: 8 },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14 },
  serviceInfo: { gap: 2 },
  serviceName: { fontSize: 15, fontWeight: '700' },
  servicePrice: { fontSize: 18, fontWeight: '800' },
});

export default AdminServices;
