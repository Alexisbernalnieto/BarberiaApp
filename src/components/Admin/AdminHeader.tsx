import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, Sun, Moon, LogOut, Menu, Users as UsersIcon } from 'lucide-react';

const AdminHeader = ({ onMenuPress, toggleTheme, isDarkMode, onLogout, COLORS, isMobile, setViewMode, setShowNotifications }: any) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {isMobile && (
          <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn}>
            <Menu size={24} color={COLORS.primary || "#D4AF37"} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={[styles.title, { color: COLORS.text || "#FFF" }]}>Barbería</Text>
          <Text style={[styles.subtitle, { color: COLORS.textSecondary || "#888" }]}>Panel Administrador</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.1)' }]}
          onPress={() => setShowNotifications(true)}
        >
          <Bell size={20} color={COLORS.textSecondary} />
          <View style={[styles.notifBadge, { borderColor: COLORS.background || '#080808' }]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.1)' }]} 
          onPress={toggleTheme}
        >
          {isDarkMode ? <Sun size={20} color={COLORS.primary} /> : <Moon size={20} color={COLORS.textSecondary} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.iconBtn, styles.logoutBtn, { backgroundColor: COLORS.surface, borderColor: 'rgba(239, 68, 68, 0.2)' }]} 
          onPress={onLogout}
        >
          <LogOut size={20} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.iconBtn, styles.usersBtn, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: COLORS.primary }]}
            onPress={() => setViewMode('users')}
        >
          <UsersIcon size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
  },
  logoutBtn: {},
  usersBtn: {
      marginLeft: 4,
  }
});

export default AdminHeader;
