import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BookingWizard from '../Booking/BookingWizard';
import AdminNotifications from './AdminNotifications';

// ─── Helpers ──────────────────────────────────────────────
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const BRANCHES = [
  { key: 'Centro', label: 'Centro', icon: 'store' },
  { key: 'Lomas', label: 'Lomas', icon: 'store-outline' },
];

// ─── Component ────────────────────────────────────────────
export default function AdminKiosk({
  notifications,
  setShowNotifications,
  showNotifications,
  handleMarkAsRead,
  onLogout,
  appointments,
  handleWalkIn,
  COLORS,
  viewMode,
  setViewMode,
  barbers,
  toggleTheme,
  isDarkMode,
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isSmall = width < 480;

  const [selectedBranch, setSelectedBranch] = useState('Centro');

  const todayStr = useMemo(() => getTodayStr(), []);

  // ─── Métricas del día ────────────────────────────────
  const todayAppointments = useMemo(
    () => appointments.filter(a => a.date === todayStr),
    [appointments, todayStr]
  );
  const totalToday = todayAppointments.length;
  const totalWalkins = todayAppointments.filter(a => a.type === 'Walk-in').length;
  const totalOnline = todayAppointments.filter(a => a.type === 'Online').length;
  const totalIngresos = todayAppointments.reduce((sum, a) => sum + (a.price || 0), 0);

  // ─── Turnos por sucursal ─────────────────────────────
  const branchAppointments = useMemo(() => {
    return todayAppointments
      .filter(a => (a.branch === selectedBranch || (!a.branch && selectedBranch === 'Centro')))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [todayAppointments, selectedBranch]);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const activeBarbers = useMemo(
    () => [...new Set(branchAppointments.map(a => a.barberName))],
    [branchAppointments]
  );

  const barberQueues = useMemo(() => {
    return activeBarbers.map(barber => {
      const apps = branchAppointments.filter(a => a.barberName === barber);
      return {
        name: barber,
        appointments: apps,
        current: apps[0] || null,
        next: apps[1] || null,
        remaining: Math.max(0, apps.length - 2),
      };
    });
  }, [activeBarbers, branchAppointments]);

  const styles = useMemo(() => getStyles(COLORS, isMobile, isSmall), [COLORS, isMobile, isSmall]);

  // ─── Render ──────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* ═══ HEADER ═══ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="store" size={isMobile ? 22 : 28} color={COLORS.primary} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerTitle}>Recepción</Text>
              <Text style={styles.headerSubtitle}>El Coronel Barbón</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setShowNotifications(true)}
              style={styles.headerBtn}
            >
              <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.text} />
              {notifications.length > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{notifications.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            {toggleTheme && (
              <TouchableOpacity onPress={toggleTheme} style={styles.headerBtn}>
                <MaterialCommunityIcons
                  name={isDarkMode ? 'weather-sunny' : 'weather-night'}
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onLogout} style={[styles.headerBtn, styles.logoutBtn]}>
              <MaterialCommunityIcons name="logout" size={18} color={COLORS.error || '#EF4444'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ MÉTRICAS ═══ */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon="calendar-check"
            label="Citas Hoy"
            value={totalToday}
            COLORS={COLORS}
            styles={styles}
            accent={COLORS.primary}
          />
          <MetricCard
            icon="walk"
            label="Walk-ins"
            value={totalWalkins}
            COLORS={COLORS}
            styles={styles}
            accent="#10B981"
          />
          <MetricCard
            icon="cellphone"
            label="Online"
            value={totalOnline}
            COLORS={COLORS}
            styles={styles}
            accent="#3B82F6"
          />
          <MetricCard
            icon="cash-multiple"
            label="Ingresos"
            value={`$${totalIngresos.toLocaleString()}`}
            COLORS={COLORS}
            styles={styles}
            accent={COLORS.primary}
          />
        </View>

        {/* ═══ QUICK ACTIONS ═══ */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: '#10B981' }]}
            onPress={() => setViewMode('walkin')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <MaterialCommunityIcons name="account-plus" size={isMobile ? 24 : 28} color="#10B981" />
            </View>
            <Text style={[styles.actionLabel, { color: COLORS.text }]}>Walk-in</Text>
            <Text style={[styles.actionHint, { color: COLORS.textSecondary }]}>Cita para hoy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: '#3B82F6' }]}
            onPress={() => setViewMode('walkin')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
              <MaterialCommunityIcons name="calendar-plus" size={isMobile ? 24 : 28} color="#3B82F6" />
            </View>
            <Text style={[styles.actionLabel, { color: COLORS.text }]}>Agendar</Text>
            <Text style={[styles.actionHint, { color: COLORS.textSecondary }]}>Cita otro día</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: COLORS.primary }]}
            onPress={() => setViewMode('walkin')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialCommunityIcons name="credit-card-outline" size={isMobile ? 24 : 28} color={COLORS.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: COLORS.text }]}>Cobrar</Text>
            <Text style={[styles.actionHint, { color: COLORS.textSecondary }]}>Procesar pago</Text>
          </TouchableOpacity>
        </View>

        {/* ═══ TURNOS POR SUCURSAL ═══ */}
        <View style={styles.queueSection}>
          <View style={styles.queueHeader}>
            <View>
              <Text style={styles.queueTitle}>Turnos del Día</Text>
              <Text style={[styles.queueSubtitle, { color: COLORS.textSecondary }]}>
                {branchAppointments.length} citas · {activeBarbers.length} barberos activos
              </Text>
            </View>
            <View style={styles.branchTabs}>
              {BRANCHES.map(b => {
                const isActive = selectedBranch === b.key;
                return (
                  <TouchableOpacity
                    key={b.key}
                    onPress={() => setSelectedBranch(b.key)}
                    style={[
                      styles.branchTab,
                      {
                        backgroundColor: isActive ? COLORS.primary : COLORS.surface,
                        borderColor: isActive ? COLORS.primary : COLORS.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={b.icon}
                      size={16}
                      color={isActive ? '#FFF' : COLORS.textSecondary}
                    />
                    <Text style={[
                      styles.branchTabText,
                      { color: isActive ? '#FFF' : COLORS.textSecondary },
                    ]}>
                      {b.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Queue Cards */}
          {barberQueues.length > 0 ? (
            <View style={styles.queueGrid}>
              {barberQueues.map((barber, idx) => (
                <View key={barber.name} style={styles.barberCard}>
                  {/* Barber Name Header */}
                  <View style={[styles.barberCardHeader, { borderBottomColor: COLORS.border }]}>
                    <View style={[styles.barberAvatar, { backgroundColor: COLORS.primary + '15' }]}>
                      <MaterialCommunityIcons name="account-tie" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.barberName}>{barber.name}</Text>
                    <View style={[styles.queueBadge, {
                      backgroundColor: barber.appointments.length > 0 ? '#10B981' + '15' : COLORS.surface,
                    }]}>
                      <Text style={[styles.queueBadgeText, {
                        color: barber.appointments.length > 0 ? '#10B981' : COLORS.textSecondary,
                      }]}>
                        {barber.appointments.length} {barber.appointments.length === 1 ? 'cita' : 'citas'}
                      </Text>
                    </View>
                  </View>

                  {/* Current Client */}
                  <View style={[styles.turnCard, { borderLeftColor: '#10B981', backgroundColor: COLORS.mode === 'dark' ? 'rgba(16,185,129,0.04)' : 'rgba(16,185,129,0.03)' }]}>
                    <Text style={styles.turnLabel}>ATENDIENDO</Text>
                    {barber.current ? (
                      <>
                        <Text style={styles.turnClientName}>{barber.current.userName}</Text>
                        <View style={styles.turnDetails}>
                          <MaterialCommunityIcons name="content-cut" size={13} color={COLORS.textSecondary} />
                          <Text style={styles.turnDetailText}>{barber.current.serviceName}</Text>
                          <View style={[styles.turnTimeBadge, { backgroundColor: '#10B981' }]}>
                            <Text style={styles.turnTimeText}>{barber.current.time}</Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <Text style={[styles.turnEmpty, { color: COLORS.textSecondary }]}>Disponible</Text>
                    )}
                  </View>

                  {/* Next Client */}
                  <View style={[styles.turnCard, { borderLeftColor: '#3B82F6', backgroundColor: COLORS.mode === 'dark' ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.03)' }]}>
                    <Text style={styles.turnLabel}>SIGUIENTE</Text>
                    {barber.next ? (
                      <>
                        <Text style={styles.turnClientName}>{barber.next.userName}</Text>
                        <View style={styles.turnDetails}>
                          <MaterialCommunityIcons name="content-cut" size={13} color={COLORS.textSecondary} />
                          <Text style={styles.turnDetailText}>{barber.next.serviceName}</Text>
                          <View style={[styles.turnTimeBadge, { backgroundColor: '#3B82F6' }]}>
                            <Text style={styles.turnTimeText}>{barber.next.time}</Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <Text style={[styles.turnEmpty, { color: COLORS.textSecondary }]}>Sin citas pendientes</Text>
                    )}
                  </View>

                  {barber.remaining > 0 && (
                    <Text style={[styles.remainingText, { color: COLORS.textSecondary }]}>
                      + {barber.remaining} en espera
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyQueue}>
              <MaterialCommunityIcons name="account-clock-outline" size={48} color={COLORS.textSecondary + '60'} />
              <Text style={[styles.emptyQueueTitle, { color: COLORS.textSecondary }]}>
                Sin barberos activos
              </Text>
              <Text style={[styles.emptyQueueHint, { color: COLORS.textSecondary + '80' }]}>
                No hay citas programadas hoy en {selectedBranch}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ═══ MODALS ═══ */}
      <Modal visible={viewMode === 'walkin'} animationType="slide">
        <BookingWizard
          user={null}
          isWalkIn={true}
          existingAppointments={appointments}
          onConfirm={(data) => {
            handleWalkIn(data);
          }}
          onCancel={() => setViewMode('dashboard')}
          COLORS={COLORS}
          barbers={barbers}
        />
      </Modal>

      <AdminNotifications
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifications={notifications}
        handleMarkAsRead={handleMarkAsRead}
        COLORS={COLORS}
      />
    </View>
  );
}

// ─── Metric Card Sub-component ──────────────────────────
function MetricCard({ icon, label, value, COLORS, styles, accent }) {
  return (
    <View style={[styles.metricCard, { borderColor: accent + '20' }]}>
      <View style={[styles.metricIconWrap, { backgroundColor: accent + '12' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={accent} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const getStyles = (COLORS, isMobile, isSmall) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: isMobile ? 16 : 32,
    paddingTop: isMobile ? 16 : 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isMobile ? 18 : 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  logoutBtn: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: isMobile ? 10 : 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: isSmall ? undefined : 1,
    width: isSmall ? '47%' : undefined,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: isMobile ? 14 : 18,
    borderWidth: 1,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: COLORS.mode === 'dark'
          ? '0 2px 12px rgba(0,0,0,0.3)'
          : '0 1px 8px rgba(0,0,0,0.04)',
      },
      default: { elevation: 2 },
    }),
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '900',
    color: COLORS.text,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    gap: isMobile ? 10 : 16,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: isMobile ? 16 : 20,
    alignItems: 'center',
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: COLORS.mode === 'dark'
          ? '0 2px 12px rgba(0,0,0,0.3)'
          : '0 1px 8px rgba(0,0,0,0.04)',
      },
      default: { elevation: 3 },
    }),
  },
  actionIconWrap: {
    width: isMobile ? 44 : 52,
    height: isMobile ? 44 : 52,
    borderRadius: isMobile ? 22 : 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: isMobile ? 13 : 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  actionHint: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Queue Section
  queueSection: {
    marginBottom: 40,
  },
  queueHeader: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    marginBottom: 16,
    gap: isMobile ? 12 : 0,
  },
  queueTitle: {
    fontSize: isMobile ? 18 : 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  queueSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  branchTabs: {
    flexDirection: 'row',
    gap: 10,
  },
  branchTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  branchTabText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Queue Grid
  queueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  barberCard: {
    flex: isMobile ? undefined : 1,
    width: isMobile ? '100%' : undefined,
    minWidth: isMobile ? '100%' : 280,
    maxWidth: isMobile ? '100%' : 420,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: COLORS.mode === 'dark'
          ? '0 2px 16px rgba(0,0,0,0.3)'
          : '0 2px 12px rgba(0,0,0,0.05)',
      },
      default: { elevation: 3 },
    }),
  },
  barberCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  barberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barberName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  queueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Turn Cards
  turnCard: {
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  turnLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  turnClientName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  turnDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  turnDetailText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  turnTimeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  turnTimeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  turnEmpty: {
    fontStyle: 'italic',
    fontSize: 13,
  },
  remainingText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // Empty Queue
  emptyQueue: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyQueueTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyQueueHint: {
    fontSize: 13,
    marginTop: 4,
  },
});
