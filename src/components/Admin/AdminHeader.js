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
  setViewMode,
  isMobile
}) {
  return (
    <View style={[styles.header, { marginBottom: isMobile ? 16 : 30 }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.title, { color: COLORS.text, fontSize: isMobile ? 20 : 28 }]} numberOfLines={1}>
          Barbería
        </Text>
        <Text style={[styles.subtitleHeader, { color: COLORS.textSecondary, fontSize: isMobile ? 12 : 16 }]}>
          Panel Administrador
        </Text>
      </View>
      <View style={[styles.actionsRow, { gap: isMobile ? 4 : 6 }]}>
        <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.iconBtn}>
          <MaterialCommunityIcons name="bell-outline" size={isMobile ? 20 : 24} color={COLORS.primary} />
          {notifications.length > 0 && (
            <View style={styles.smallBadge}>
              <Text style={styles.smallBadgeText}>{notifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
          <MaterialCommunityIcons name={isDarkMode ? "weather-sunny" : "weather-night"} size={isMobile ? 20 : 24} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <MaterialCommunityIcons name="logout" size={isMobile ? 16 : 20} color={COLORS.error} />
          {!isMobile && <Text style={styles.logoutText}>Salir</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.usersBtn, {
            backgroundColor: viewMode === 'users' ? COLORS.primary : COLORS.surface,
            borderColor: COLORS.primary,
            paddingHorizontal: isMobile ? 10 : 14,
            paddingVertical: isMobile ? 7 : 8,
          }]}
          onPress={() => setViewMode('users')}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={isMobile ? 18 : 22}
            color={viewMode === 'users' ? '#FFFFFF' : COLORS.primary}
          />
          {!isMobile && (
            <Text style={{
              color: viewMode === 'users' ? '#FFFFFF' : COLORS.primary,
              fontWeight: 'bold',
              fontSize: 14,
              textTransform: 'uppercase',
              marginLeft: 6,
            }}>
              Usuarios
            </Text>
          )}
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
  },
  title: {
    fontWeight: 'bold',
  },
  subtitleHeader: {
    marginTop: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  iconBtn: {
    padding: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 5,
  },
  logoutText: {
    color: '#FF5252',
    fontWeight: 'bold',
    fontSize: 13,
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
    borderRadius: 12,
    borderWidth: 1,
    elevation: 3,
    marginLeft: 2,
  }
});
