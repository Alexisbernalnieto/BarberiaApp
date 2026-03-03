import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserSummary({ nextAppointment, activeTab, setActiveTab, COLORS, isMobile }) {
  const styles = getStyles(COLORS, isMobile);

  return (
    <View style={styles.dashboardSummary}>
      {/* TAB NAVIGATION — Desktop: horizontal bar, elegant */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'book' && styles.tabActive]}
          onPress={() => setActiveTab('book')}
          dataSet={{ tab: 'true' }}
        >
          <MaterialCommunityIcons
            name="chair-rolling"
            size={20}
            color={activeTab === 'book' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'book' && styles.tabTextActive]}>
            Nueva Reserva
          </Text>
          {activeTab === 'book' && <View style={styles.tabIndicator} dataSet={{ tabIndicator: 'true' }} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => setActiveTab('appointments')}
          dataSet={{ tab: 'true' }}
        >
          <MaterialCommunityIcons
            name="calendar-multiselect"
            size={20}
            color={activeTab === 'appointments' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.tabTextActive]}>
            Mis Citas
          </Text>
          {activeTab === 'appointments' && <View style={styles.tabIndicator} dataSet={{ tabIndicator: 'true' }} />}
        </TouchableOpacity>
      </View>

      {/* NEXT APPOINTMENT — Compact hero card */}
      {nextAppointment && (
        <View style={styles.heroCard} dataSet={{ heroCard: 'true' }}>
          <View style={styles.heroAccent} dataSet={{ accentBar: 'true' }} />
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.heroIconWrap}>
                <MaterialCommunityIcons name="calendar-check" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.heroLabel}>PRÓXIMA CITA</Text>
                <Text style={styles.heroService}>{nextAppointment.serviceName}</Text>
              </View>
            </View>
            <View style={styles.heroDetails}>
              <View style={styles.heroDetail}>
                <MaterialCommunityIcons name="calendar-month" size={16} color={COLORS.textSecondary} />
                <Text style={styles.heroDetailText}>{nextAppointment.date}</Text>
              </View>
              <View style={styles.heroDetailSep} />
              <View style={styles.heroDetail}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.heroDetailText}>{nextAppointment.time}</Text>
              </View>
              <View style={styles.heroDetailSep} />
              <View style={styles.heroDetail}>
                <MaterialCommunityIcons name="account-tie" size={16} color={COLORS.textSecondary} />
                <Text style={styles.heroDetailText}>{nextAppointment.barberName}</Text>
              </View>
            </View>
            <View style={styles.heroPriceBadge}>
              <Text style={styles.heroPrice}>${nextAppointment.price}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
  dashboardSummary: {
    paddingHorizontal: isMobile ? 20 : 48,
    paddingTop: 0,
    backgroundColor: COLORS.background,
  },

  // TAB BAR
  tabBar: {
    flexDirection: 'row',
    gap: isMobile ? 0 : 8,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    marginBottom: 24,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: isMobile ? 16 : 24,
    position: 'relative',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.2s ease' },
    }),
  },
  tabActive: {},
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: isMobile ? 16 : 24,
    right: isMobile ? 16 : 24,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },

  // HERO CARD
  heroCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.12)' : 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginBottom: 8,
    ...Platform.select({
      web: {
        boxShadow: COLORS.mode === 'dark'
          ? '0 4px 24px rgba(0,0,0,0.3), 0 0 60px rgba(212, 175, 55, 0.03)'
          : '0 4px 16px rgba(0,0,0,0.06)',
      },
      default: {
        ...COLORS.shadows.medium,
      },
    }),
  },
  heroAccent: {
    width: 4,
    backgroundColor: COLORS.primary,
  },
  heroContent: {
    flex: 1,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    padding: isMobile ? 16 : 20,
    gap: isMobile ? 12 : 24,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: isMobile ? undefined : 1,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  heroService: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  heroDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroDetailText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  heroDetailSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textSecondary,
    opacity: 0.4,
  },
  heroPriceBadge: {
    backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.15)',
  },
  heroPrice: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});
