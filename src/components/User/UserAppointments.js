import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Animated, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserAppointments({ appointments, COLORS, numColumns, gap, itemWidth, fadeAnim, onBookNow }) {
  const styles = getStyles(COLORS, itemWidth);

  const renderAppointmentItem = ({ item }) => (
    <View style={styles.card} dataSet={{ card: 'true' }}>
      {/* Gold accent bar */}
      <View style={styles.cardAccent} dataSet={{ accentBar: 'true' }} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <View style={styles.rowCenter}>
              <MaterialCommunityIcons name="account-tie" size={14} color={COLORS.primary} />
              <Text style={styles.barberName}> {item.barberName}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge]} dataSet={{ badgeGold: 'true' }}>
            <Text style={styles.statusText}>{item.status || 'Confirmado'}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <View style={styles.rowCenter}>
              <MaterialCommunityIcons name="calendar-month-outline" size={15} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.detailLabel}>Fecha</Text>
            </View>
            <Text style={styles.detailValue}>{item.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.rowCenter}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={15} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.detailLabel}>Hora</Text>
            </View>
            <Text style={styles.detailValue}>{item.time}</Text>
          </View>
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.detailLabelTotal}>Total</Text>
            <Text style={styles.priceValue}>${item.price}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
      {appointments.length === 0 ? (
        <View style={styles.emptyState} dataSet={{ emptyState: 'true' }}>
          <View style={styles.emptyIconContainer} dataSet={{ emptyIcon: 'true' }}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Sin Citas Programadas</Text>
          <Text style={styles.emptyText}>Agenda tu próxima visita en El Coronel Barbón.</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={onBookNow} dataSet={{ btnGold: 'true', btn: 'true' }}>
            <Text style={styles.ctaButtonText}>RESERVAR AHORA</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#000" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={`grid-${numColumns}`}
          data={appointments}
          numColumns={numColumns}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 100, gap: gap }}
          columnWrapperStyle={numColumns > 1 ? { gap: gap } : undefined}
          renderItem={renderAppointmentItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Animated.View>
  );
}

const getStyles = (COLORS, itemWidth) => StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    padding: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    borderStyle: 'dashed',
    ...Platform.select({
      web: {
        boxShadow: COLORS.mode === 'dark' ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)',
      },
    }),
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.08)' : 'rgba(212, 175, 55, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 300,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)',
        transition: 'all 0.3s ease',
      },
      default: {
        backgroundColor: COLORS.primary,
        ...COLORS.shadows.medium,
      },
    }),
  },
  ctaButtonText: {
    color: '#000',
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 13,
  },

  // CARD ITEM
  card: {
    width: itemWidth,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    flexDirection: 'row',
    ...Platform.select({
      web: {
        boxShadow: COLORS.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
      },
      default: COLORS.shadows.light,
    }),
  },
  cardAccent: {
    width: 4,
    backgroundColor: COLORS.primary,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  barberName: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.primary,
  },
  cardBody: {
    padding: 20,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    borderStyle: 'dashed',
  },
  detailLabelTotal: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 15,
  },
  priceValue: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 18,
  },
});
