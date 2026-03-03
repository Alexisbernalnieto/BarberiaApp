import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserHeader({ user, onLogout, toggleTheme, isDarkMode, COLORS, isMobile }) {
  const styles = getStyles(COLORS, isMobile);

  return (
    <View style={styles.header} dataSet={{ header: 'true' }}>
      {/* Brand + User Section */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer} dataSet={{ logo: 'true' }}>
          <MaterialCommunityIcons name="content-cut" size={22} color={COLORS.primary} />
        </View>
        {!isMobile && (
          <View style={styles.brandText}>
            <Text style={styles.brandName}>EL CORONEL BARBÓN</Text>
            <Text style={styles.brandTagline}>PELUQUERÍA DE ALTO NIVEL</Text>
          </View>
        )}
        <View style={styles.separator} />
        <View>
          <Text style={styles.greeting}>Bienvenido,</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn} dataSet={{ themeToggle: 'true', headerBtn: 'true' }}>
          <MaterialCommunityIcons name={isDarkMode ? "white-balance-sunny" : "weather-night"} size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} dataSet={{ logoutBtn: 'true' }}>
          <MaterialCommunityIcons name="logout" size={16} color={COLORS.error} />
          {!isMobile && <Text style={styles.logoutText}>Salir</Text>}
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
    paddingHorizontal: isMobile ? 20 : 48,
    paddingVertical: 16,
    backgroundColor: COLORS.mode === 'dark' ? 'rgba(15,15,15,0.95)' : 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.06)',
    zIndex: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
      },
    }),
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.15)',
  },
  brandText: {
    marginRight: 8,
  },
  brandName: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandTagline: {
    color: COLORS.textSecondary,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '500',
  },
  separator: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  userName: {
    color: COLORS.text,
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.2s ease' },
    }),
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.mode === 'dark' ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)',
    borderWidth: 1,
    borderColor: COLORS.mode === 'dark' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.2s ease' },
    }),
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
});
