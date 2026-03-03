import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

import AuthScreen from '../screens/AuthScreen';
import UserDashboard from '../components/UserDashboard';
import AdminDashboard from '../components/AdminDashboard';
import BarberDashboard from '../components/BarberDashboard';

// 🔥 Importamos el servicio oficial para crear citas
import { createAppointment } from '../services/appointments';

export default function AppNavigator() {
  const { currentUser, loading, logout } = useAuth();
  const { theme, COLORS, toggleTheme, isDarkMode } = useTheme();
  const { appointments, barbers } = useData();

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

  // Render Dashboard based on Role
  if (currentUser.role === 'admin') {
    return (
      <AdminDashboard
        user={currentUser}
        onLogout={logout}
        appointments={appointments}
        barbers={barbers}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}

        // 🔥 Ahora AdminDashboard también puede crear citas
        onAddAppointment={createAppointment}
      />
    );
  } else if (currentUser.role === 'reception') {
    return (
      <AdminDashboard
        user={currentUser}
        onLogout={logout}
        appointments={appointments}
        barbers={barbers}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}

        // 🔥 Recepción también puede crear citas
        onAddAppointment={createAppointment}
      />
    );
  } else if (currentUser.role === 'barber') {
    return (
      <BarberDashboard
        role={currentUser.role}
        user={currentUser}
        appointments={appointments}
        onLogout={logout}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
    );
  } else {
    // Default: User Dashboard
    return (
      <UserDashboard
        user={currentUser}
        onLogout={logout}
        appointments={appointments}
        barbers={barbers}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}

        // 🔥 Aquí es donde realmente lo necesitabas
        onAddAppointment={createAppointment}
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
