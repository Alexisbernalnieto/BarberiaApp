import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import { db, auth, firebaseConfig } from '../../firebaseClient';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, getAuth } from 'firebase/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import BarberListView from './BarberListView';
import BarberFormView from './BarberFormView';
import BarberDetailsView from './BarberDetailsView';
import { DAYS, DEFAULT_SCHEDULE, getBarberManagementStyles } from './BarberManagementStyles';
import { logActivity } from '../../services/activityLogs';
import StatusModal from './StatusModal';

export default function BarberManagement({ appointments, onClose, COLORS, barbers, setBarbers }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const containerPadding = 40;
  const gap = 20;
  const numColumns = width > 1400 ? 4 : width > 1000 ? 3 : width > 700 ? 2 : 1;
  const itemWidth = (width - containerPadding - (numColumns - 1) * gap) / numColumns;

  const styles = useMemo(
    () => getBarberManagementStyles(COLORS, isMobile),
    [COLORS, isMobile],
  );

  const [viewMode, setViewMode] = useState('list'); // 'list', 'form', 'details'
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [editingBarber, setEditingBarber] = useState(null); // Used for form
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('Todos'); // 'Todos', 'Centro', 'Lomas'
  const [selectedDay, setSelectedDay] = useState(1); // 0=Domingo, 1=Lunes, etc.
  
  // Status Modal state
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalConfig, setStatusModalConfig] = useState({
    type: 'success',
    title: '',
    message: ''
  });

  const showStatus = (type, title, message) => {
    setStatusModalConfig({ type, title, message });
    setStatusModalVisible(true);
  };

  // Calculate stats for a barber
  const getBarberStats = (barberName) => {
    const barberApps = appointments.filter(app => app.barberName === barberName);
    const totalServices = barberApps.length;
    const totalEarnings = barberApps.reduce((acc, curr) => acc + (curr.price || 0), 0);
    // Mock hours/dates for demo
    const lastActive = barberApps.length > 0 ? barberApps[barberApps.length - 1].date : 'N/A';
    
    return { totalServices, totalEarnings, lastActive, history: barberApps };
  };

  const handleSave = async () => {
    if (editingBarber.name && editingBarber.role) {
        // Ensure schedule exists
        const barberToSave = {
            ...editingBarber,
            schedule: editingBarber.schedule || DEFAULT_SCHEDULE,
            active: editingBarber.active === undefined ? true : editingBarber.active,
            role: 'barber'
        };

        if (editingBarber.id) {
            // Edit existing
            try {
                // Remove password if it was somehow in the object (it shouldn't be for existing)
                const { password, ...updateData } = barberToSave;
                await updateDoc(doc(db, 'users', editingBarber.id), updateData);
                // Optimistic update
                setBarbers(barbers.map(b => b.id === editingBarber.id ? barberToSave : b));
                await logActivity({
                    adminEmail: auth.currentUser?.email || 'admin@admin.com',
                    adminRole: 'admin',
                    action: 'Actualizó perfil de un barbero',
                    details: `Barbero: ${editingBarber.name}`,
                    targetUserId: editingBarber.id
                });
                showStatus('success', '¡Éxito!', 'Barber@ actualizad@ correctamente');
            } catch (error) {
                console.error("Error updating barber:", error);
                showStatus('error', 'Error', 'No se pudo actualizar el barbero');
            }
        } else {
            // Add new barber
            if (!editingBarber.email || !editingBarber.password) {
                showStatus('error', 'Faltan datos', 'Se requiere correo y contraseña para dar de alta al barbero');
                return;
            }
            if (editingBarber.password.length < 6) {
                showStatus('error', 'Contraseña débil', 'La contraseña debe tener al menos 6 caracteres');
                return;
            }

            let secondaryAuth;
            let userCredential;

            try {
                // Secondary auth instance to not sign out current admin
                let secondaryApp = getApps().find(app => app.name === 'Secondary');
                if (!secondaryApp) {
                    secondaryApp = initializeApp(firebaseConfig, 'Secondary');
                }
                secondaryAuth = getAuth(secondaryApp);
                userCredential = await createUserWithEmailAndPassword(secondaryAuth, editingBarber.email, editingBarber.password);
                const uid = userCredential.user.uid;
                
                // Prepare data for Firestore
                const { password, ...firestoreData } = barberToSave;
                firestoreData.id = uid;
                
                try {
                    // Save in users collection
                    await setDoc(doc(db, 'users', uid), firestoreData);
                } catch (firestoreError) {
                    // ROLLBACK: Delete the auth user if Firestore fails to avoid "dangling" accounts
                    try {
                        await userCredential.user.delete();
                    } catch (deleteError) {
                        console.error("Critical: Could not rollback auth user creation:", deleteError);
                    }
                    throw firestoreError;
                }
                
                // Sign out from secondary app immediately to clear its session
                await signOut(secondaryAuth);
                
                // Update local state
                setBarbers([...barbers, firestoreData]);
                
                await logActivity({
                    adminEmail: auth.currentUser?.email || 'admin@admin.com',
                    adminRole: 'admin',
                    action: 'Registró nuevo barbero',
                    details: `Barbero: ${editingBarber.name} (${editingBarber.email})`,
                    targetUserId: uid
                });

                showStatus('success', '¡Registrado!', 'El barbero ha sido dado de alta correctamente.');
                setEditingBarber(null);
                setViewMode('list');
            } catch (error) {
                console.error("Error creating barber:", error);
                
                // Ensure secondaryAuth is signed out even on error
                if (secondaryAuth) {
                  try { await signOut(secondaryAuth); } catch(e) {}
                }

                let title = 'Error al registrar';
                let message = 'Hubo un problema al crear la cuenta del barbero.';
                
                if (error.code === 'auth/email-already-in-use') {
                    title = 'Correo ya registrado';
                    message = 'Este correo electrónico ya está en uso. Si falló un registro previo, contacta a soporte para limpiar la cuenta.';
                } else if (error.code === 'auth/invalid-email') {
                    message = 'El correo electrónico ingresado no tiene un formato válido.';
                } else if (error.code === 'auth/weak-password') {
                    message = 'La contraseña es demasiado débil (mínimo 6 caracteres).';
                } else if (error.message.includes('permission-denied') || error.code === 'permission-denied') {
                    message = 'Error de permisos en Firestore. No se pudo crear el perfil del barbero.';
                }
                
                showStatus('error', title, message);
                return;
            }
        }
        if (!editingBarber.id) return; // For new ones, it sets null inside try block
        setEditingBarber(null);
        setViewMode('list');
    }
  };

  const handleDelete = (barberId) => {
      const barberNameToDelete = barbers.find(b => b.id === barberId)?.name || 'Desconocido';
      Alert.alert(
          'Eliminar Barbero',
          '¿Estás seguro de que quieres eliminar este barbero?',
          [
              { text: 'Cancelar', style: 'cancel' },
              { 
                  text: 'Eliminar', 
                  style: 'destructive',
                  onPress: async () => {
                      setBarbers(barbers.filter(b => b.id !== barberId));
                      await logActivity({
                          adminEmail: 'admin@admin.com',
                          adminRole: 'admin',
                          action: 'Eliminó un barbero',
                          details: `Barbero eliminado: ${barberNameToDelete}`,
                          targetUserId: barberId
                      });
                      setViewMode('list');
                  }
              }
          ]
      );
  };

  const toggleServiceSelection = (serviceName) => {
    const currentServices = editingBarber.services || [];
    if (currentServices.includes(serviceName)) {
        setEditingBarber({
            ...editingBarber,
            services: currentServices.filter(s => s !== serviceName)
        });
    } else {
        setEditingBarber({
            ...editingBarber,
            services: [...currentServices, serviceName]
        });
    }
  };
  
  const toggleAllServices = (allServiceNames) => {
    const currentServices = editingBarber.services || [];
    const allSelected = allServiceNames.every(name => currentServices.includes(name));
    
    setEditingBarber({
        ...editingBarber,
        services: allSelected ? [] : allServiceNames
    });
  };

  const updateSchedule = (dayIndex, field, value) => {
    const currentSchedule = editingBarber.schedule || DEFAULT_SCHEDULE;
    setEditingBarber({
      ...editingBarber,
      schedule: {
        ...currentSchedule,
        [dayIndex]: {
          ...currentSchedule[dayIndex],
          [field]: value,
        },
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Barberos</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
      {viewMode === 'list' && (
        <BarberListView
          styles={styles}
          barbers={barbers}
          selectedBranchFilter={selectedBranchFilter}
          setSelectedBranchFilter={setSelectedBranchFilter}
          setEditingBarber={setEditingBarber}
          setViewMode={setViewMode}
          numColumns={numColumns}
          itemWidth={itemWidth}
          getBarberStats={getBarberStats}
          setSelectedBarber={setSelectedBarber}
        />
      )}
      {viewMode === 'form' && editingBarber && (
        <BarberFormView
          styles={styles}
          editingBarber={editingBarber}
          setEditingBarber={setEditingBarber}
          DAYS={DAYS}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          updateSchedule={updateSchedule}
          toggleServiceSelection={toggleServiceSelection}
          toggleAllServices={toggleAllServices}
          setViewMode={setViewMode}
          handleSave={handleSave}
          DEFAULT_SCHEDULE={DEFAULT_SCHEDULE}
          COLORS={COLORS}
        />
      )}
      {viewMode === 'details' && selectedBarber && (
        <BarberDetailsView
          styles={styles}
          selectedBarber={selectedBarber}
          setViewMode={setViewMode}
          DAYS={DAYS}
          DEFAULT_SCHEDULE={DEFAULT_SCHEDULE}
          handleDelete={handleDelete}
          setEditingBarber={setEditingBarber}
        />
      )}

      <StatusModal 
        visible={statusModalVisible}
        config={statusModalConfig}
        onClose={() => setStatusModalVisible(false)}
        COLORS={COLORS}
      />
    </View>
  );
}
