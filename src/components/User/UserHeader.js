import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserHeader({ user, onLogout, toggleTheme, isDarkMode, COLORS, isMobile }) {
  const styles = getStyles(COLORS, isMobile);

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>Bienvenido,</Text>
        <Text style={styles.userName}>{user.name}</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
          <MaterialCommunityIcons name={isDarkMode ? "white-balance-sunny" : "weather-night"} size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <MaterialCommunityIcons name="logout" size={18} color={COLORS.error} />
          {!isMobile && <Text style={styles.logoutText}>CERRAR SESIÓN</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 20 : 40,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    ...COLORS.shadows.light,
    zIndex: 10,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  userName: {
    color: COLORS.primary,
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceHighlight,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    borderRadius: 20,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginLeft: 8,
  },
});
