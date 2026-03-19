import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Search, Plus, User, Scissors, Mail, Phone, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { db } from '../../firebaseClient';
import { collection, query, getDocs } from 'firebase/firestore';
import { AppUser } from '../../types';

const AdminBarbers = ({ COLORS, isMobile, onBack }: any) => {
  const [barbers, setBarbers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users')); // We'll filter for role 'barber'
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as AppUser))
        .filter(u => u.role === 'barber' || u.role === 3);
      setBarbers(fetched);
    } catch (error) {
      console.error("Error fetching barbers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  const filteredBarbers = barbers.filter(b => 
    (b.name?.toLowerCase().includes(search.toLowerCase())) || 
    (b.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={COLORS.primary} />
        <Text style={[styles.backText, { color: COLORS.primary }]}>Volver al Panel</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: COLORS.text }]}>Gestión de Barberos</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: COLORS.primary }]}>
            <Plus size={20} color="#000" />
            <Text style={styles.addBtnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBox, { backgroundColor: COLORS.surface, borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
        <Search size={20} color={COLORS.textSecondary} />
        <TextInput 
          placeholder="Buscar barbero..."
          placeholderTextColor={COLORS.textSecondary + '80'}
          style={[styles.searchInput, { color: COLORS.text }]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filteredBarbers.map(barber => (
            <View key={barber.uid} style={[styles.card, { backgroundColor: COLORS.surface, borderColor: 'rgba(212, 175, 55, 0.1)' }]}>
               <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.primary + '20' }]}>
                    <User size={32} color={COLORS.primary} />
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: COLORS.text }]}>{barber.name || 'Sin Nombre'}</Text>
                    <View style={styles.row}>
                        <Mail size={12} color={COLORS.textSecondary} />
                        <Text style={[styles.subtext, { color: COLORS.textSecondary }]}>{barber.email}</Text>
                    </View>
                  </View>
               </View>

               <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionItem}>
                    <Edit2 size={18} color={COLORS.primary} />
                    <Text style={[styles.actionLabel, { color: COLORS.primary }]}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionItem}>
                    <Trash2 size={18} color="#EF4444" />
                    <Text style={[styles.actionLabel, { color: "#EF4444" }]}>Eliminar</Text>
                  </TouchableOpacity>
               </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontWeight: '700', fontSize: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { fontWeight: '800', fontSize: 14 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, gap: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  list: { gap: 16, paddingBottom: 40 },
  card: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 20 },
  cardHeader: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subtext: { fontSize: 13 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionLabel: { fontWeight: '700', fontSize: 14 },
});

export default AdminBarbers;
