import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, TextInput, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseClient';

export default function UserManagement({ COLORS }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

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

  // Función para cambiar rol
  const changeRole = async (userId, newRole, roleName) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      Alert.alert('Éxito', `Usuario actualizado a rol: ${roleName}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No tienes permisos para cambiar roles.');
    }
  };

  const performDelete = async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      if (Platform.OS === 'web') {
        window.alert('Usuario eliminado correctamente.');
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

  const handleDelete = (user) => {
    if (!user || !user.id) {
        console.error("Intento de eliminar usuario sin ID válido", user);
        return;
    }

    const confirmMessage = `¿Estás seguro de eliminar a ${user.name || user.email}? Esta acción no se puede deshacer.`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        performDelete(user.id);
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
            onPress: () => performDelete(user.id)
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
    return role; // Fallback por si hay roles antiguos en texto
  };

  const renderUser = ({ item }) => (
    <View style={[styles.card, { backgroundColor: COLORS.surface }]}>
      <View style={styles.userInfo}>
        <MaterialCommunityIcons name="account-circle" size={40} color={COLORS.primary} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={[styles.userName, { color: COLORS.text }]}>{item.name || 'Sin Nombre'}</Text>
          <Text style={[styles.userEmail, { color: COLORS.textSecondary }]}>{item.email}</Text>
          <View style={styles.roleBadge}>
             <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 12 }}>
              {getRoleName(item.role)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, {color: COLORS.textSecondary}]}>Asignar Rol:</Text>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: item.role === 0 ? COLORS.primary : COLORS.border }]}
          onPress={() => changeRole(item.id, 0, 'ADMIN')}
        >
          <Text style={styles.btnText}>Admin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: item.role === 2 ? '#F59E0B' : COLORS.border }]} 
          onPress={() => changeRole(item.id, 2, 'RECEPCIÓN')}
        >
          <Text style={styles.btnText}>Recep</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: item.role === 1 ? '#10B981' : COLORS.border }]}
          onPress={() => changeRole(item.id, 1, 'CLIENTE')}
        >
          <Text style={styles.btnText}>Cliente</Text>
        </TouchableOpacity>
      </View>

      <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, borderTopWidth: 1, borderTopColor: COLORS.border || '#ccc', paddingTop: 10}}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={{marginRight: 20, flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons name="pencil" size={18} color={COLORS.primary} />
            <Text style={{color: COLORS.primary, marginLeft: 4, fontWeight: 'bold'}}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons name="delete" size={18} color={'#EF4444'} />
            <Text style={{color: '#EF4444', marginLeft: 4, fontWeight: 'bold'}}>Eliminar</Text>
        </TouchableOpacity>
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
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' }
});