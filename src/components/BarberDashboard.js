import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseClient';

export default function BarberDashboard({ appointments, currentUser, COLORS, toggleTheme, isDarkMode }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Filtrar citas asignadas a este barbero
  // Asumimos que el nombre del barbero está en currentUser.name o se busca coincidencia
  // Si no hay nombre asignado, mostramos advertencia
  const myAppointments = appointments.filter(app => {
      // Normalización simple para comparar nombres
      const appBarber = (app.barberName || '').toLowerCase().trim();
      const myName = (currentUser?.name || '').toLowerCase().trim();
      return appBarber === myName;
  });

  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = myAppointments.filter(app => app.date === today);
  
  // Calcular ganancias del día (comisiones o total, aquí total por simplicidad)
  const todaysEarnings = todaysAppointments.reduce((sum, app) => sum + (app.price || 0), 0);

  const handleLogout = () => {
    signOut(auth).catch(err => console.error("Error al salir:", err));
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: COLORS.border }]}>
        <View>
          <Text style={[styles.title, { color: COLORS.primary }]}>Panel de Barbero</Text>
          <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>Hola, {currentUser?.name || 'Barbero'}</Text>
        </View>
        <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
              <MaterialCommunityIcons name={isDarkMode ? "weather-sunny" : "weather-night"} size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} style={{ marginRight: 5 }} />
                <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>Salir</Text>
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Métricas Rápidas */}
        <View style={styles.metricsContainer}>
            <View style={[styles.metricCard, { backgroundColor: COLORS.surface }]}>
                <MaterialCommunityIcons name="calendar-check" size={30} color={COLORS.primary} />
                <View>
                    <Text style={[styles.metricValue, { color: COLORS.text }]}>{todaysAppointments.length}</Text>
                    <Text style={[styles.metricLabel, { color: COLORS.textSecondary }]}>Citas Hoy</Text>
                </View>
            </View>
            <View style={[styles.metricCard, { backgroundColor: COLORS.surface }]}>
                <MaterialCommunityIcons name="cash" size={30} color="#10B981" />
                <View>
                    <Text style={[styles.metricValue, { color: COLORS.text }]}>${todaysEarnings}</Text>
                    <Text style={[styles.metricLabel, { color: COLORS.textSecondary }]}>Generado Hoy</Text>
                </View>
            </View>
        </View>

        {/* Lista de Citas */}
        <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Tu Agenda de Hoy</Text>
        
        {todaysAppointments.length === 0 ? (
            <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank" size={50} color={COLORS.textSecondary} />
                <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>No tienes citas programadas para hoy.</Text>
            </View>
        ) : (
            todaysAppointments.map((app) => (
                <View key={app.id} style={[styles.appointmentCard, { backgroundColor: COLORS.surface, borderLeftColor: COLORS.primary }]}>
                    <View style={styles.appTime}>
                        <Text style={[styles.timeText, { color: COLORS.white }]}>{app.time}</Text>
                    </View>
                    <View style={styles.appInfo}>
                        <Text style={[styles.clientName, { color: COLORS.text }]}>{app.clientName || 'Cliente'}</Text>
                        <Text style={[styles.serviceName, { color: COLORS.textSecondary }]}>{app.serviceName} • ${app.price}</Text>
                    </View>
                    <View style={styles.appStatus}>
                        <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                            <Text style={styles.statusText}>Confirmada</Text>
                        </View>
                    </View>
                </View>
            ))
        )}

        <Text style={[styles.sectionTitle, { color: COLORS.text, marginTop: 30 }]}>Próximas Citas</Text>
        {myAppointments.filter(app => app.date > today).slice(0, 5).map((app) => (
             <View key={app.id} style={[styles.appointmentCard, { backgroundColor: COLORS.surface, borderLeftColor: COLORS.textSecondary, opacity: 0.8 }]}>
                <View style={[styles.appTime, { backgroundColor: COLORS.textSecondary }]}>
                    <Text style={[styles.timeText, { color: COLORS.white }]}>{app.date}</Text>
                </View>
                <View style={styles.appInfo}>
                    <Text style={[styles.clientName, { color: COLORS.text }]}>{app.time}</Text>
                    <Text style={[styles.serviceName, { color: COLORS.textSecondary }]}>{app.serviceName}</Text>
                </View>
            </View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: 8,
  },
  iconBtn: {
      padding: 8,
  },
  metricsContainer: {
      flexDirection: 'row',
      gap: 15,
      marginBottom: 30,
  },
  metricCard: {
      flex: 1,
      padding: 20,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
      elevation: 2,
  },
  metricValue: {
      fontSize: 24,
      fontWeight: 'bold',
  },
  metricLabel: {
      fontSize: 12,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
  },
  emptyState: {
      alignItems: 'center',
      padding: 40,
      opacity: 0.6,
  },
  appointmentCard: {
      flexDirection: 'row',
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      borderLeftWidth: 4,
      alignItems: 'center',
      elevation: 1,
  },
  appTime: {
      backgroundColor: '#3B82F6',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 6,
      marginRight: 15,
  },
  timeText: {
      fontWeight: 'bold',
      fontSize: 14,
  },
  appInfo: {
      flex: 1,
  },
  clientName: {
      fontWeight: 'bold',
      fontSize: 16,
  },
  serviceName: {
      fontSize: 14,
  },
  statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
  },
  statusText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
  }
});