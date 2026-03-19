import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, TextInput, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseClient';
import { DEFAULT_SCHEDULE } from './BarberManagementStyles';
import { logActivity } from '../../services/logs';

export default function UserManagement({ COLORS }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [branchModalUser, setBranchModalUser] = useState(null);
  const [branchSelection, setBranchSelection] = useState('Centro');

  // Escuchar cambios en la colección de usuarios en tiempo real
  useEffect(() => {
    // Ordenamos por fecha de creación si existe, si no por defecto
    const q = query(collection(db, 'users'), orderBy('email')); 
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      setUsers(userList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
      Alert.alert("Error", "No se pudieron cargar los usuarios.");
    });

    return () => unsubscribe();
  }, []);

  const changeRole = async (userId, newRole, roleName, userEmail) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      await logActivity(
        'Cambió el rol de un usuario',
        `Usuario: ${userEmail}\nNuevo Rol: ${roleName}`,
        'admin@admin.com', // Asumido por ahora, en un sistema real vendría del auth context
        0
      );
      Alert.alert('Éxito', `Usuario actualizado a rol: ${roleName}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No tienes permisos para cambiar roles.');
    }
  };

  const handleSetBarberRole = (user) => {
    setBranchSelection(user.branch || 'Centro');
    setBranchModalUser(user);
  };

  const confirmSetBarberRole = async () => {
    if (!branchModalUser) return;
    try {
      await updateDoc(doc(db, 'users', branchModalUser.id), {
        role: 3,
        branch: branchSelection,
        active: true,
        schedule: DEFAULT_SCHEDULE,
      });
      await logActivity(
        'Asignó usuario como Barbero',
        `Usuario: ${branchModalUser.email}\nSucursal: ${branchSelection}`,
        'admin@admin.com',
        0
      );
      setBranchModalUser(null);
      Alert.alert('Éxito', `Usuario actualizado a rol: BARBERO`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No tienes permisos para cambiar roles.');
    }
  };

  const performDelete = async (userEmail, userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'deleted' });
      await logActivity(
        'Eliminó un usuario',
        `Usuario eliminado: ${userEmail}`,
        'admin@admin.com',
        0
      );
      if (Platform.OS === 'web') {
        window.alert('Usuario eliminado lógicamente.');
      } else {
        Alert.alert('Eliminado', 'Usuario eliminado correctamente.');
      }
    } catch (error) {
      console.error(error);
      const errorMsg = 'No se pudo eliminar el usuario. Verifica las reglas de seguridad.';
      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  };

  const handleToggleSuspend = async (user) => {
    const isSuspended = user.status === 'suspended';
    const newStatus = isSuspended ? 'active' : 'suspended';
    const actionText = isSuspended ? 'Activar' : 'Suspender';
    const pastTense = isSuspended ? 'Activó' : 'Suspendió';

    const confirmMessage = `¿Estás seguro de ${actionText.toLowerCase()} a ${user.name || user.email}?`;

    const performToggle = async () => {
      try {
        await updateDoc(doc(db, 'users', user.id), { status: newStatus });
        await logActivity(
          `${pastTense} a un usuario`,
          `Usuario: ${user.email}`,
          'admin@admin.com',
          0
        );
        if (Platform.OS === 'web') {
          window.alert(`Usuario ${isSuspended ? 'activado' : 'suspendido'} correctamente.`);
        } else {
          Alert.alert('Éxito', `Usuario ${isSuspended ? 'activado' : 'suspendido'} correctamente.`);
        }
      } catch (error) {
        console.error(error);
        if (Platform.OS === 'web') {
          window.alert(`Error: No se pudo ${actionText.toLowerCase()} el usuario.`);
        } else {
          Alert.alert('Error', `No se pudo ${actionText.toLowerCase()} el usuario.`);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        performToggle();
      }
    } else {
      Alert.alert(
        `${actionText} Usuario`,
        confirmMessage,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: actionText, 
            style: isSuspended ? 'default' : 'destructive',
            onPress: performToggle
          }
        ]
      );
    }
  };

  const handleDelete = (user) => {
    if (!user || !user.id) {
        console.error("Intento de eliminar usuario sin ID válido", user);
        return;
    }

    const confirmMessage = `¿Estás seguro de eliminar a ${user.name || user.email}? Esta acción no se puede deshacer.`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        performDelete(user.email, user.id);
      }
    } else {
      Alert.alert(
        'Eliminar Usuario',
        confirmMessage,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Eliminar', 
            style: 'destructive',
            onPress: () => performDelete(user.email, user.id)
          }
        ]
      );
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditPhone(user.phone || ''); 
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        name: editName,
        phone: editPhone
      });
      await logActivity(
        'Editó un perfil de usuario',
        `Usuario: ${editingUser.email}\nNuevo Nombre: ${editName}`,
        'admin@admin.com',
        0
      );
      setEditingUser(null);
      Alert.alert('Éxito', 'Datos actualizados correctamente.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron actualizar los datos.');
    }
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const getRoleName = (role) => {
    if (role === 0) return 'ADMIN';
    if (role === 1) return 'CLIENTE';
    if (role === 2) return 'RECEPCIÓN';
    if (role === 3) return 'BARBERO';
    return role; // Fallback por si hay roles antiguos en texto
  };

  const renderUser = ({ item }) => (
    <View style={[styles.card, { backgroundColor: COLORS.surface }]}>
      <View style={styles.userInfo}>
        <MaterialCommunityIcons name="account-circle" size={40} color={COLORS.primary} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={[styles.userName, { color: COLORS.text }]}>{item.name || 'Sin Nombre'}</Text>
          <Text style={[styles.userEmail, { color: COLORS.textSecondary }]}>{item.email}</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4}}>
            <View style={styles.roleBadge}>
               <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 12 }}>
                {getRoleName(item.role)}
              </Text>
            </View>
            {item.status === 'suspended' && (
              <View style={[styles.roleBadge, {backgroundColor: 'rgba(239,68,68,0.1)'}]}>
                 <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 12 }}>
                  SUSPENDIDO
                </Text>
              </View>
            )}
            {item.status === 'deleted' && (
              <View style={[styles.roleBadge, {backgroundColor: 'rgba(107,114,128,0.1)'}]}>
                 <Text style={{ color: '#6B7280', fontWeight: 'bold', fontSize: 12 }}>
                  ELIMINADO
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, {color: COLORS.textSecondary}]}>Asignar Rol:</Text>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: item.role === 0 ? COLORS.primary : COLORS.border }]}
          onPress={() => changeRole(item.id, 0, 'ADMIN', item.email)}
        >
          <Text style={styles.btnText}>Admin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: item.role === 2 ? '#F59E0B' : COLORS.border }]} 
          onPress={() => changeRole(item.id, 2, 'RECEPCIÓN', item.email)}
        >
          <Text style={styles.btnText}>Recep</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: item.role === 3 ? '#8B5CF6' : COLORS.border }]}
          onPress={() => handleSetBarberRole(item)}
        >
          <Text style={styles.btnText}>Barbero</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: item.role === 1 ? '#10B981' : COLORS.border }]}
          onPress={() => changeRole(item.id, 1, 'CLIENTE', item.email)}
        >
          <Text style={styles.btnText}>Cliente</Text>
        </TouchableOpacity>
      </View>

      <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, borderTopWidth: 1, borderTopColor: COLORS.border || '#ccc', paddingTop: 10}}>
        {item.status !== 'deleted' && (
          <TouchableOpacity onPress={() => handleToggleSuspend(item)} style={{marginRight: 20, flexDirection: 'row', alignItems: 'center'}}>
              <MaterialCommunityIcons name={item.status === 'suspended' ? "account-check" : "account-off"} size={18} color={item.status === 'suspended' ? '#10B981' : '#F59E0B'} />
              <Text style={{color: item.status === 'suspended' ? '#10B981' : '#F59E0B', marginLeft: 4, fontWeight: 'bold'}}>
                {item.status === 'suspended' ? 'Activar' : 'Suspender'}
              </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => openEditModal(item)} style={{marginRight: item.status !== 'deleted' ? 20 : 0, flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons name="pencil" size={18} color={COLORS.primary} />
            <Text style={{color: COLORS.primary, marginLeft: 4, fontWeight: 'bold'}}>Editar</Text>
        </TouchableOpacity>
        {item.status !== 'deleted' && (
          <TouchableOpacity onPress={() => handleDelete(item)} style={{flexDirection: 'row', alignItems: 'center'}}>
              <MaterialCommunityIcons name="delete" size={18} color={'#EF4444'} />
              <Text style={{color: '#EF4444', marginLeft: 4, fontWeight: 'bold'}}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return (
    <View style={[styles.container, {justifyContent:'center'}]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: COLORS.text }]}>Gestión de Usuarios</Text>
      
      {/* Barra de búsqueda */}
      <View style={[styles.searchContainer, {backgroundColor: COLORS.inputBg, borderColor: COLORS.border}]}>
        <MaterialCommunityIcons name="magnify" size={24} color={COLORS.textSecondary} />
        <TextInput 
            style={[styles.searchInput, {color: COLORS.text}]}
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
            <Text style={{color: COLORS.textSecondary, textAlign: 'center', marginTop: 20}}>
                No se encontraron usuarios.
            </Text>
        }
      />

      <Modal visible={!!editingUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {backgroundColor: COLORS.surface}]}>
                <Text style={[styles.modalTitle, {color: COLORS.text}]}>Editar Usuario</Text>
                
                <Text style={[styles.label, {color: COLORS.textSecondary}]}>Nombre:</Text>
                <TextInput 
                    style={[styles.input, {color: COLORS.text, borderColor: COLORS.border}]}
                    value={editName}
                    onChangeText={setEditName}
                />

                <Text style={[styles.label, {color: COLORS.textSecondary}]}>Teléfono:</Text>
                <TextInput 
                    style={[styles.input, {color: COLORS.text, borderColor: COLORS.border}]}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    keyboardType="phone-pad"
                />

                <View style={styles.modalActions}>
                    <TouchableOpacity onPress={() => setEditingUser(null)} style={[styles.modalBtn, {borderColor: COLORS.border, borderWidth: 1}]}>
                        <Text style={{color: COLORS.text}}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={saveEdit} style={[styles.modalBtn, {backgroundColor: COLORS.primary}]}>
                        <Text style={{color: 'white', fontWeight: 'bold'}}>Guardar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      <Modal visible={!!branchModalUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface }]}>
            <Text style={[styles.modalTitle, { color: COLORS.text }]}>Asignar sucursal</Text>
            <Text style={[styles.label, { color: COLORS.textSecondary }]}>Sucursal:</Text>
            <View style={styles.branchRow}>
              {['Centro', 'Lomas'].map(branch => (
                <TouchableOpacity
                  key={branch}
                  style={[
                    styles.branchOption,
                    branchSelection === branch && styles.branchOptionActive,
                  ]}
                  onPress={() => setBranchSelection(branch)}
                >
                  <Text
                    style={[
                      styles.branchText,
                      branchSelection === branch && styles.branchTextActive,
                    ]}
                  >
                    {branch}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setBranchModalUser(null)}
                style={[styles.modalBtn, { borderColor: COLORS.border, borderWidth: 1 }]}
              >
                <Text style={{ color: COLORS.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSetBarberRole}
                style={[styles.modalBtn, { backgroundColor: COLORS.primary }]}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    height: 50,
  },
  searchInput: { flex: 1, marginLeft: 10, height: '100%' },
  card: { padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  userName: { fontSize: 16, fontWeight: 'bold' },
  userEmail: { fontSize: 14 },
  roleBadge: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.05)', alignSelf: 'flex-start', borderRadius: 4},
  sectionTitle: { fontSize: 12, marginBottom: 8, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { marginBottom: 5, fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  branchRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  branchOption: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, marginHorizontal: 4, alignItems: 'center' },
  branchOptionActive: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)' },
  branchText: { fontSize: 14 },
  branchTextActive: { fontWeight: 'bold' }
});
