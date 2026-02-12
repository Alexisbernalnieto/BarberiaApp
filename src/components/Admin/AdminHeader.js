import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminHeader({ 
  notifications, 
  setShowNotifications, 
  toggleTheme, 
  isDarkMode, 
  onLogout, 
  COLORS,
  viewMode,
  setViewMode 
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.title, { color: COLORS.text }]}>Barbería</Text>
        <Text style={[styles.subtitleHeader, { color: COLORS.textSecondary }]}>
          Panel Administrador
        </Text>
      </View>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.iconBtn}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.primary} />
              {notifications.length > 0 && (
                  <View style={styles.smallBadge}>
                      <Text style={styles.smallBadgeText}>{notifications.length}</Text>
                  </View>
              )}
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
            <MaterialCommunityIcons name={isDarkMode ? "weather-sunny" : "weather-night"} size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} style={{marginRight: 8}} />
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.usersBtn, { 
                backgroundColor: viewMode === 'users' ? COLORS.primary : COLORS.surface,
                borderColor: COLORS.primary,
                shadowColor: COLORS.primary
            }]} 
            onPress={() => setViewMode('users')}
        >
            <MaterialCommunityIcons 
                name="account-group" 
                size={22} 
                color={viewMode === 'users' ? '#FFFFFF' : COLORS.primary} 
                style={{marginRight: 8}}
            />
            <Text style={{
                color: viewMode === 'users' ? '#FFFFFF' : COLORS.primary, 
                fontWeight: 'bold', 
                fontSize: 14,
                textTransform: 'uppercase'
            }}>
                Usuarios
            </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitleHeader: {
    fontSize: 16,
    marginTop: 5,
  },
  iconBtn: {
    padding: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 10,
  },
  logoutText: {
    color: '#FF5252', // Fallback or explicit error color if not passed via style, but using passed color is better
    fontWeight: 'bold',
  },
  smallBadge: {
    position: 'absolute', top: -5, right: -5, 
    backgroundColor: '#FF5252', borderRadius: 10, 
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center'
  },
  smallBadgeText: {
    color: 'white', fontSize: 10, fontWeight: 'bold'
  },
  usersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 10
  }
});
