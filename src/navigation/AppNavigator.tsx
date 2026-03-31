import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';

import AuthScreen from '@/screens/AuthScreen';
import UserDashboard from '@/components/UserDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import BarberDashboard from '@/components/BarberDashboard';

import { createAppointment } from '@/services/appointments';
import { UserRole } from '@/types';
import { SidebarProvider } from '@/context/SidebarContext';

export default function AppNavigator() {
  const { currentUser, loading, logout } = useAuth();
  const { COLORS, toggleTheme, isDarkMode } = useTheme();
  const { appointments, barbers, setBarbers } = useData();

  const isRole = (roleName: 'admin' | 'reception' | 'barber' | 'client'): boolean => {
    if (!currentUser) return false;
    const r = currentUser.role;
    switch (roleName) {
      case 'admin': return r === 0 || r === 'admin';
      case 'reception': return r === 2 || r === 'reception';
      case 'barber': return r === 3 || r === 'barber';
      case 'client': return r === 1 || r === 'client';
      default: return false;
    }
  };

  const renderDashboard = () => {
    if (isRole('admin') || isRole('reception')) {
      return (
        <AdminDashboard
          appointments={appointments}
          onLogout={logout}
          onAddAppointment={async (data: any) => { await createAppointment(data); }}
          role={isRole('admin') ? 'admin' : 'reception'}
          barbers={barbers}
          setBarbers={setBarbers}
          COLORS={COLORS}
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
        />
      );
    } else if (isRole('barber')) {
      return (
        <BarberDashboard
          user={currentUser!}
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
          user={currentUser!}
          appointments={appointments}
          onLogout={logout}
          COLORS={COLORS}
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          barbers={barbers}
        />
      );
    }
  };

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

  return (
    <SidebarProvider>
      {renderDashboard()}
    </SidebarProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
