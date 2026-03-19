import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Search, ArrowLeft, User, Shield, Scissors, UserCheck, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { db } from '../../firebaseClient';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AppUser } from '../../types';
import { logActivity } from '../../services/activityLogs';
import { useAuth } from '../../context/AuthContext';

const AdminUsers = ({ COLORS, isMobile, onBack }: any) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as AppUser[];
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (user: AppUser, newRole: string) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: newRole });
      
      // Update local state
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole } as AppUser : u));

      // Log activity
      await logActivity({
        adminId: currentUser.uid,
        adminEmail: currentUser.email,
        adminRole: 'admin',
        action: 'Cambió el rol de un usuario',
        targetUserId: user.uid,
        targetUserEmail: user.email,
        details: `Nuevo Rol: ${newRole.toUpperCase()}`,
      });

      Alert.alert("Éxito", `Rol de ${user.name || user.email} actualizado a ${newRole}`);
    } catch (error: any) {
      Alert.alert("Error", "No se pudo actualizar el rol: " + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(search.toLowerCase())) || 
    (u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={COLORS.primary} />
        <Text style={[styles.backText, { color: COLORS.primary }]}>Volver al Panel</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: COLORS.text }]}>Gestión de Usuarios</Text>

      <View style={[styles.searchContainer, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.1)' }]}>
        <Search size={20} color={COLORS.textSecondary} />
        <TextInput 
          placeholder="Buscar por nombre o correo..."
          placeholderTextColor={COLORS.textSecondary + '80'}
          style={[styles.searchInput, { color: COLORS.text }]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.usersList}>
          {filteredUsers.map(user => (
            <View key={user.uid} style={[styles.userCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.1)' }]}>
              <View style={styles.userHeader}>
                <View style={[styles.avatar, { backgroundColor: COLORS.primary + '20' }]}>
                  <User size={24} color={COLORS.primary} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: COLORS.text }]}>{user.name || 'Sin Nombre'}</Text>
                  <Text style={[styles.userEmail, { color: COLORS.textSecondary }]}>{user.email}</Text>
                  <Text style={[styles.roleBadge, { color: COLORS.primary }]}>{String(user.role || 'cliente').toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.roleActions}>
                <Text style={[styles.actionTitle, { color: COLORS.textSecondary }]}>ASIGNAR ROL:</Text>
                <View style={styles.roleGrid}>
                  {['admin', 'reception', 'barber', 'client'].map(role => (
                    <TouchableOpacity 
                      key={role}
                      style={[
                        styles.roleBtn, 
                        { backgroundColor: 'rgba(255,255,255,0.05)' },
                        user.role === role && { backgroundColor: COLORS.primary }
                      ]}
                      onPress={() => handleUpdateRole(user, role)}
                    >
                      <Text style={[styles.roleBtnText, { color: user.role === role ? '#000' : COLORS.text }]}>
                        {role === 'reception' ? 'Recep' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.quickActions}>
                 <TouchableOpacity style={styles.actionItem}>
                    <ShieldAlert size={18} color={COLORS.primary} />
                    <Text style={[styles.actionLabel, { color: COLORS.primary }]}>Suspender</Text>
                 </TouchableOpacity>
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
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderRadius: 16, borderWidth: 1, gap: 12 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '500' },
  usersList: { gap: 16, paddingBottom: 40 },
  userCard: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 20 },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 18, fontWeight: '800' },
  userEmail: { fontSize: 14, opacity: 0.8 },
  roleBadge: { fontSize: 12, fontWeight: '900', marginTop: 4 },
  roleActions: { gap: 12 },
  actionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  roleGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  roleBtn: { flex: 1, minWidth: 70, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roleBtnText: { fontSize: 13, fontWeight: '700' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionLabel: { fontWeight: '700', fontSize: 14 },
});

export default AdminUsers;
