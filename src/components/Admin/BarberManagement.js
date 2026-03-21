import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import { db } from '../../firebaseClient';
import { doc, updateDoc } from 'firebase/firestore';
import BarberListView from './BarberListView';
import BarberFormView from './BarberFormView';
import BarberDetailsView from './BarberDetailsView';
import { DAYS, DEFAULT_SCHEDULE, getBarberManagementStyles } from './BarberManagementStyles';
import { logActivity } from '../../services/activityLogs';

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
            schedule: editingBarber.schedule || DEFAULT_SCHEDULE
        };

        if (editingBarber.id) {
            // Edit existing
            try {
                await updateDoc(doc(db, 'users', editingBarber.id), barberToSave);
                // Optimistic update
                setBarbers(barbers.map(b => b.id === editingBarber.id ? barberToSave : b));
                await logActivity({
                    adminEmail: 'admin@admin.com',
                    adminRole: 'admin',
                    action: 'Actualizó perfil de un barbero',
                    details: `Barbero: ${editingBarber.name}`,
                    targetUserId: editingBarber.id
                });
                Alert.alert('Éxito', 'Barbero actualizado correctamente');
            } catch (error) {
                console.error("Error updating barber:", error);
                Alert.alert('Error', 'No se pudo actualizar el barbero');
            }
        } else {
            // Add new
            Alert.alert('Aviso', 'Para registrar nuevos barberos, por favor ve a "Gestión de Usuarios" y asigna el rol de Barbero a un usuario registrado.');
            return;
        }
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
          setViewMode={setViewMode}
          handleSave={handleSave}
          DEFAULT_SCHEDULE={DEFAULT_SCHEDULE}
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
    </View>
  );
}
