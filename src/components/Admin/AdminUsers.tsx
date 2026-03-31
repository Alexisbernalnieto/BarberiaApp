import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { Search, ArrowLeft, User, Shield, Scissors, UserCheck, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { db } from '@/firebaseClient';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AppUser } from '@/types';
import { logActivity } from '@/services/activityLogs';
import { useAuth } from '@/context/AuthContext';

const AdminUsers = ({ COLORS, isMobile, onBack }: any) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<AppUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("[ADMIN USERS] Iniciando carga de usuarios en Firestore...");
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      console.log(`[ADMIN USERS] Snapshot recibido: ${querySnapshot.size} documentos.`);
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as AppUser[];
      setUsers(fetchedUsers);
    } catch (error: any) {
      console.error("[ADMIN USERS] Error fatal cargando usuarios:", error);
      let errorMsg = error.message || "Error desconocido";
      if (errorMsg.includes('permission-denied') || error.code === 'permission-denied') {
        errorMsg = "Permisos insuficientes. Tu cuenta no tiene rango de Administrador en la base de datos.";
      }
      Alert.alert("Error de Acceso", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (user: AppUser, newRole: string) => {
    if (!currentUser) {
      Alert.alert("Error", "No tienes permisos (sesión no iniciada)");
      return;
    }
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: newRole });
      
      // Update local state
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole } as AppUser : u));

      // Log activity
      await logActivity({
        adminId: currentUser.uid,
        adminEmail: currentUser.email || 'unknown',
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

  const handleToggleSuspend = async (user: AppUser) => {
    if (!currentUser) {
       Alert.alert("Error", "Sesión no detectada");
       return;
    }

    if (user.status === 'suspended') {
      const performToggle = async () => {
        try {
          await updateDoc(doc(db, 'users', user.uid), { status: 'active', statusMessage: '' });
          setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, status: 'active', statusMessage: '' } as AppUser : u));
          
          await logActivity({
            adminId: currentUser.uid,
            adminEmail: currentUser.email || 'unknown',
            adminRole: 'admin',
            action: 'Activó a un usuario',
            targetUserId: user.uid,
            targetUserEmail: user.email,
            details: `Estado: ACTIVE`,
          });

          Alert.alert('Éxito', `Usuario activado correctamente.`);
        } catch (error: any) {
          Alert.alert('Error', `No se pudo activar el usuario: ` + error.message);
        }
      };

      const confirmMessage = `¿Estás seguro de activar a ${user.name || user.email}?`;
      if (Platform.OS === 'web') {
        if (window.confirm(confirmMessage)) performToggle();
      } else {
        Alert.alert('Activar Usuario', confirmMessage, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Activar', style: 'default', onPress: performToggle }
        ]);
      }
    } else {
      // Show Modal to prompt for reason
      setUserToSuspend(user);
      setSuspendReason('');
      setSuspendModalVisible(true);
    }
  };

  const confirmSuspendUser = async () => {
    if (!userToSuspend || !currentUser) return;
    try {
      const finalReason = suspendReason.trim() || 'Tu cuenta ha sido restringida por la administración.';
      await updateDoc(doc(db, 'users', userToSuspend.uid), { 
        status: 'suspended',
        statusMessage: finalReason
      });
      setUsers(prev => prev.map(u => u.uid === userToSuspend.uid ? { 
        ...u, 
        status: 'suspended',
        statusMessage: finalReason
      } as AppUser : u));
      
      await logActivity({
        adminId: currentUser.uid,
        adminEmail: currentUser.email || 'unknown',
        adminRole: 'admin',
        action: 'Suspendió a un usuario',
        targetUserId: userToSuspend.uid,
        targetUserEmail: userToSuspend.email,
        details: `Motivo: ${finalReason}`,
      });

      Alert.alert('Éxito', `Usuario suspendido correctamente.`);
      setSuspendModalVisible(false);
      setUserToSuspend(null);
    } catch (error: any) {
      Alert.alert('Error', `No se pudo suspender el usuario: ` + error.message);
    }
  };

  const handleDelete = (user: AppUser) => {
    const performDelete = async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), { status: 'deleted' });
        setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, status: 'deleted' } as AppUser : u));

        await logActivity({
          adminId: currentUser?.uid || 'system',
          adminEmail: currentUser?.email || 'system',
          adminRole: 'admin',
          action: 'Eliminó un usuario',
          targetUserId: user.uid,
          targetUserEmail: user.email,
          details: 'Eliminación lógica del sistema.'
        });

        Alert.alert('Eliminado', 'Usuario eliminado lógicamente.');
      } catch (error: any) {
        Alert.alert('Error', 'No se pudo eliminar el usuario: ' + error.message);
      }
    };

    const confirmMessage = `¿Estás seguro de eliminar a ${user.name || user.email}?`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Eliminar Usuario',
        confirmMessage,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    const n = u.name ? u.name.toLowerCase() : '';
    const e = u.email ? u.email.toLowerCase() : '';
    return n.includes(s) || e.includes(s);
  });

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
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    <Text style={[styles.roleBadge, { color: COLORS.primary }]}>
                      {(() => {
                        const r = user.role;
                        if (r === 0 || r === 'admin') return 'ADMIN';
                        if (r === 2 || r === 'reception') return 'RECEP';
                        if (r === 3 || r === 'barber') return 'BARBERO';
                        return 'CLIENTE';
                      })()}
                    </Text>
                    {user.status === 'suspended' && (
                      <Text style={[styles.roleBadge, { color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 6, borderRadius: 4 }]}>SUSPENDIDO</Text>
                    )}
                    {user.status === 'deleted' && (
                      <Text style={[styles.roleBadge, { color: '#6B7280', backgroundColor: 'rgba(107,114,128,0.1)', paddingHorizontal: 6, borderRadius: 4 }]}>ELIMINADO</Text>
                    )}
                  </View>
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
                 {user.status !== 'deleted' && (
                   <TouchableOpacity style={styles.actionItem} onPress={() => handleToggleSuspend(user)}>
                      <ShieldAlert size={18} color={user.status === 'suspended' ? "#10B981" : COLORS.primary} />
                      <Text style={[styles.actionLabel, { color: user.status === 'suspended' ? "#10B981" : COLORS.primary }]}>
                        {user.status === 'suspended' ? 'Activar' : 'Suspender'}
                      </Text>
                   </TouchableOpacity>
                 )}
                 <TouchableOpacity style={styles.actionItem}>
                    <Edit2 size={18} color={COLORS.primary} />
                    <Text style={[styles.actionLabel, { color: COLORS.primary }]}>Editar</Text>
                 </TouchableOpacity>
                 {user.status !== 'deleted' && (
                   <TouchableOpacity style={styles.actionItem} onPress={() => handleDelete(user)}>
                      <Trash2 size={18} color="#EF4444" />
                      <Text style={[styles.actionLabel, { color: "#EF4444" }]}>Eliminar</Text>
                   </TouchableOpacity>
                 )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal para suspender usuario */}
      <Modal visible={suspendModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface }]}>
            <Text style={[styles.modalTitle, { color: COLORS.text }]}>Suspender Usuario</Text>
            <Text style={{ color: COLORS.textSecondary, marginBottom: 15 }}>
              Escribe el motivo de la suspensión. Este mensaje se le mostrará al usuario al intentar acceder a la aplicación.
            </Text>
            
            <TextInput
              style={[styles.reasonInput, { color: COLORS.text, borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
              placeholder="Ej: Suspendido por faltar a 3 citas..."
              placeholderTextColor={COLORS.textSecondary}
              value={suspendReason}
              onChangeText={setSuspendReason}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                onPress={() => setSuspendModalVisible(false)}
              >
                <Text style={{ color: COLORS.text, fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#EF4444' }]}
                onPress={confirmSuspendUser}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Suspender</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  reasonInput: { borderWidth: 1, borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

export default AdminUsers;
