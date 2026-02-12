import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserSummary({ nextAppointment, activeTab, setActiveTab, COLORS, isMobile }) {
  const styles = getStyles(COLORS, isMobile);

  return (
    <View style={styles.dashboardSummary}>
      
      {/* NEXT APPOINTMENT CARD */}
      <View style={styles.heroCardContainer}>
        <Text style={styles.sectionTitle}>TU PRÓXIMA VISITA</Text>
        <View style={styles.heroCard}>
          {nextAppointment ? (
            <>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroService}>{nextAppointment.serviceName}</Text>
                  <View style={styles.rowCenter}>
                    <MaterialCommunityIcons name="account-tie" size={16} color={COLORS.textSecondary} style={{marginRight: 6}} />
                    <Text style={styles.heroBarber}>{nextAppointment.barberName}</Text>
                  </View>
                </View>
                <View style={styles.heroPriceBadge}>
                  <Text style={styles.heroPrice}>${nextAppointment.price}</Text>
                </View>
              </View>
              
              <View style={styles.heroDivider} />
              
              <View style={styles.heroFooter}>
                <View style={styles.heroInfoItem}>
                  <Text style={styles.heroInfoLabel}>FECHA</Text>
                  <View style={styles.rowCenter}>
                    <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.primary} style={{marginRight: 8}} />
                    <Text style={styles.heroInfoValue}>{nextAppointment.date}</Text>
                  </View>
                </View>
                <View style={styles.heroInfoSeparator} />
                <View style={styles.heroInfoItem}>
                  <Text style={styles.heroInfoLabel}>HORA</Text>
                  <View style={styles.rowCenter}>
                    <MaterialCommunityIcons name="clock-time-four" size={20} color={COLORS.primary} style={{marginRight: 8}} />
                    <Text style={styles.heroInfoValue}>{nextAppointment.time}</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.heroEmpty}>
              <View style={styles.heroEmptyIconBg}>
                <MaterialCommunityIcons name="calendar-clock" size={32} color={COLORS.primary} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.heroEmptyTitle}>Sin reservas activas</Text>
                <Text style={styles.heroEmptyText}>¿Listo para un nuevo look?</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveTab('book')} style={styles.heroBookBtn}>
                <Text style={styles.heroBookBtnText}>Reservar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>ACCIONES RÁPIDAS</Text>
        <View style={styles.actionButtonsWrapper}>
          <TouchableOpacity 
            style={[styles.actionCard, activeTab === 'book' && styles.actionCardActive]} 
            onPress={() => setActiveTab('book')}
          >
            <View style={[styles.actionIconCircle, activeTab === 'book' && styles.actionIconCircleActive]}>
              <MaterialCommunityIcons 
                name="chair-rolling" 
                size={24} 
                color={activeTab === 'book' ? COLORS.primary : COLORS.text} 
              />
            </View>
            <View>
              <Text style={[styles.actionCardTitle, activeTab === 'book' && styles.actionTextActive]}>Nueva Reserva</Text>
              <Text style={[styles.actionCardDesc, activeTab === 'book' && styles.actionTextActive]}>Agenda tu corte</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, activeTab === 'appointments' && styles.actionCardActive]} 
            onPress={() => setActiveTab('appointments')}
          >
            <View style={[styles.actionIconCircle, activeTab === 'appointments' && styles.actionIconCircleActive]}>
              <MaterialCommunityIcons 
                name="calendar-multiselect" 
                size={24} 
                color={activeTab === 'appointments' ? COLORS.primary : COLORS.text} 
              />
            </View>
            <View>
              <Text style={[styles.actionCardTitle, activeTab === 'appointments' && styles.actionTextActive]}>Mis Citas</Text>
              <Text style={[styles.actionCardDesc, activeTab === 'appointments' && styles.actionTextActive]}>Ver historial</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
  dashboardSummary: {
    flexDirection: isMobile ? 'column' : 'row',
    padding: isMobile ? 20 : 40,
    gap: isMobile ? 24 : 32,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // HERO CARD
  heroCardContainer: {
    flex: isMobile ? undefined : 1.2,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...COLORS.shadows.medium,
    position: 'relative',
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  heroService: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroPriceBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  heroPrice: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  heroBarber: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  heroDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInfoItem: {
    flex: 1,
  },
  heroInfoLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroInfoValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  heroInfoSeparator: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
  },
  heroEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroEmptyIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmptyTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  heroEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  heroBookBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  heroBookBtnText: {
    color: COLORS.textInverse,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // ACTIONS
  actionsContainer: {
    flex: isMobile ? undefined : 1.8,
  },
  actionButtonsWrapper: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
    ...COLORS.shadows.light,
    ...Platform.select({
        web: { cursor: 'pointer', transition: '0.2s' },
    }),
  },
  actionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    ...COLORS.shadows.medium,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconCircleActive: {
    backgroundColor: COLORS.primary + '20',
  },
  actionCardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  actionCardDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  actionTextActive: {
    color: COLORS.primary,
  },
});
