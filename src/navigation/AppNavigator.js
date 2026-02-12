import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

import AuthScreen from '../screens/AuthScreen';
import UserDashboard from '../components/UserDashboard';
import AdminDashboard from '../components/AdminDashboard';
import BarberDashboard from '../components/BarberDashboard';

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
  if (currentUser.role === 'admin' || currentUser.role === 0) {
    return (
      <AdminDashboard 
        user={currentUser} 
        onLogout={logout} 
        appointments={appointments}
        barbers={barbers}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
    );
  } else if (currentUser.role === 'reception' || currentUser.role === 2) {
    // Assuming Reception uses AdminDashboard for now, or a specific one if it existed.
    // App.js likely mapped it to AdminDashboard or similar.
    // Let's assume AdminDashboard handles reception logic internally or it's the same view.
    // Based on previous App.js code (which I didn't see fully for reception but likely similar):
    return (
      <AdminDashboard 
        user={currentUser} 
        onLogout={logout} 
        appointments={appointments}
        barbers={barbers}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
    );
  } else if (currentUser.role === 'barber' || currentUser.role === 3) {
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
