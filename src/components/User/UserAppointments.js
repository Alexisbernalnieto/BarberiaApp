import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserAppointments({ appointments, COLORS, numColumns, gap, itemWidth, fadeAnim, onBookNow }) {
  const styles = getStyles(COLORS, itemWidth);

  const renderAppointmentItem = ({ item }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <View style={styles.rowCenter}>
                   <MaterialCommunityIcons name="account-tie" size={16} color={COLORS.primary} />
                   <Text style={styles.barberName}> {item.barberName}</Text>
                </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary }]}>
                <Text style={[styles.statusText, { color: COLORS.primary }]}>{item.status || 'Confirmado'}</Text>
            </View>
        </View>
        
        <View style={styles.cardBody}>
            <View style={styles.detailRow}>
                <View style={styles.rowCenter}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={16} color={COLORS.textSecondary} style={{marginRight: 6}} />
                    <Text style={styles.detailLabel}>Fecha</Text>
                </View>
                <Text style={styles.detailValue}>{item.date}</Text>
            </View>
            <View style={styles.detailRow}>
                <View style={styles.rowCenter}>
                     <MaterialCommunityIcons name="clock-time-four-outline" size={16} color={COLORS.textSecondary} style={{marginRight: 6}} />
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
  );

  return (
    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
      {appointments.length === 0 ? (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin Citas Programadas</Text>
            <Text style={styles.emptyText}>Agenda tu próxima visita para lucir impecable.</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={onBookNow}>
                <Text style={styles.ctaButtonText}>RESERVAR AHORA</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" style={{marginLeft: 8}} />
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
    padding: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.surfaceHighlight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
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
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    ...COLORS.shadows.medium,
  },
  ctaButtonText: {
    color: COLORS.textInverse,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 14,
  },

  // CARD ITEM
  card: {
    width: itemWidth,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...COLORS.shadows.light,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: COLORS.surfaceHighlight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  barberName: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 20,
    gap: 12,
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
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderStyle: 'dashed',
  },
  detailLabelTotal: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  priceValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
});
