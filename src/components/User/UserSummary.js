import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserSummary({ nextAppointment, activeTab, setActiveTab, COLORS }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(COLORS, isMobile, width);

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

const getStyles = (COLORS, isMobile, width) => StyleSheet.create({
  dashboardSummary: {
    paddingHorizontal: isMobile ? 20 : 48,
    paddingTop: 0,
    gap: 32,
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
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    overflow: 'hidden',
    marginBottom: 8,
    ...Platform.select({
      web: {
        boxShadow: COLORS.mode === 'dark' ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 20px rgba(0,0,0,0.05)',
      },
    }),
  },
  heroAccent: {
    width: 4,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  heroContent: {
    flex: 1,
    flexDirection: width < 600 ? 'column' : 'row',
    alignItems: 'center',
    padding: width < 600 ? 16 : 24,
    gap: 20,
    marginLeft: 4,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: width < 600 ? undefined : 1,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  heroLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  heroService: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  heroDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
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
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  heroPrice: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '900',
  },
});
