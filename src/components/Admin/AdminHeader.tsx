import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, Sun, Moon, LogOut, Menu } from 'lucide-react';

const AdminHeader = ({ onMenuPress, toggleTheme, isDarkMode, onLogout, COLORS, isMobile }: any) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {isMobile && (
          <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn}>
            <Menu size={24} color="var(--gold)" />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>Panel de Control</Text>
          <Text style={styles.subtitle}>Gestión integral de El Coronel</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={20} color="var(--text-secondary)" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
          {isDarkMode ? <Sun size={20} color="var(--gold)" /> : <Moon size={20} color="var(--text-secondary)" />}
        </TouchableOpacity>
        {!isMobile && (
          <TouchableOpacity style={[styles.iconBtn, styles.logoutBtn]} onPress={onLogout}>
            <LogOut size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
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
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
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
    borderColor: 'var(--bg-dark)',
  },
  logoutBtn: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
});

export default AdminHeader;
