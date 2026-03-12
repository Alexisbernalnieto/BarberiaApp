import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

import AuthScreen from '../screens/AuthScreen';
import UserDashboard from '../components/UserDashboard';
import AdminDashboard from '../components/AdminDashboard';
import BarberDashboard from '../components/BarberDashboard';

import { createAppointment } from '../services/appointments';
import { UserRole } from '../types';

export default function AppNavigator() {
  const { currentUser, loading, logout } = useAuth();
  const { COLORS, toggleTheme, isDarkMode } = useTheme();
  const { appointments, barbers, setBarbers } = useData();

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  const isRole = (roleName: 'admin' | 'reception' | 'barber' | 'client'): boolean => {
    const r = currentUser.role;
    switch (roleName) {
      case 'admin': return r === 0 || r === 'admin';
      case 'reception': return r === 2 || r === 'reception';
      case 'barber': return r === 3 || r === 'barber';
      case 'client': return r === 1 || r === 'client';
      default: return false;
    }
  };

  if (isRole('admin')) {
    return (
      <AdminDashboard
        user={currentUser}
        onLogout={logout}
        appointments={appointments}
        barbers={barbers}
        setBarbers={setBarbers}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        onAddAppointment={createAppointment}
      />
    );
  } else if (isRole('reception')) {
    return (
      <AdminDashboard
        user={currentUser}
        role="reception"
        onLogout={logout}
        appointments={appointments}
        barbers={barbers}
        setBarbers={setBarbers}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        onAddAppointment={createAppointment}
      />
    );
  } else if (isRole('barber')) {
    return (
      <BarberDashboard
        role={currentUser.role as UserRole}
        user={currentUser}
        appointments={appointments}
        onLogout={logout}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
    );
  } else {
    return (
      <UserDashboard
        user={currentUser}
        onLogout={logout}
        appointments={appointments}
        barbers={barbers}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
    );
  }
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
