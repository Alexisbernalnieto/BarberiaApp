import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, Sun, Moon, LogOut, Users, Menu } from 'lucide-react';

interface AdminHeaderProps {
  notifications: any[];
  setShowNotifications: (show: boolean) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  onLogout: () => void;
  COLORS: any;
  viewMode: string;
  setViewMode: (mode: string) => void;
  isMobile: boolean;
  onMenuPress?: () => void;
}

export default function AdminHeader({
  notifications,
  setShowNotifications,
  toggleTheme,
  isDarkMode,
  onLogout,
  COLORS,
  viewMode,
  setViewMode,
  isMobile,
  onMenuPress
}: AdminHeaderProps) {
  return (
    <View style={[styles.header, { marginBottom: isMobile ? 16 : 32 }]}>
      <View style={styles.leftSection}>
        {isMobile && (
          <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn}>
            <Menu size={24} color={COLORS.primary || "var(--gold)"} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: COLORS.text || '#FFF', fontSize: isMobile ? 18 : 24 }]} numberOfLines={1}>
            EL CORONEL BARBÓN
          </Text>
          <Text style={[styles.subtitleHeader, { color: COLORS.primary || '#D4AF37', fontSize: isMobile ? 9 : 11, letterSpacing: 1, marginTop: -2, textTransform: 'uppercase' }]}>
            Peluquería y Barbería de alto nivel
          </Text>
        </View>
      </View>

      <View style={[styles.actionsRow, { gap: isMobile ? 8 : 12 }]}>
        <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'users' ? 'appointments' : 'users')} 
            style={[
                styles.iconBtn, 
                !isMobile && { width: 'auto', paddingHorizontal: 16 },
                viewMode === 'users' && styles.activeBtn
            ]}
        >
            <Users size={isMobile ? 20 : 24} color={viewMode === 'users' ? '#000' : (COLORS.primary || 'var(--gold)')} />
            {!isMobile && (
                <Text style={[styles.btnText, viewMode === 'users' && { color: '#000' }]}>
                    Usuarios
                </Text>
            )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.iconBtn}>
          <Bell size={isMobile ? 20 : 24} color={COLORS.primary || "var(--gold)"} />
          {notifications.length > 0 && (
            <View style={styles.smallBadge}>
              <Text style={styles.smallBadgeText}>{notifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
          {isDarkMode ? <Sun size={isMobile ? 20 : 24} color={COLORS.primary || "var(--gold)"} /> : <Moon size={isMobile ? 20 : 24} color={COLORS.textSecondary || "var(--text-secondary)"} />}
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
    paddingVertical: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginRight: 12,
  },
  title: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitleHeader: {
    marginTop: 2,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 8,
    position: 'relative',
  },
  activeBtn: {
    backgroundColor: 'var(--gold)',
    borderColor: 'var(--gold)',
  },
  btnText: {
    color: 'var(--gold)',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutBtn: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  smallBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  smallBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
});
