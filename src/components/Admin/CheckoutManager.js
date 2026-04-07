import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebaseClient';
import { doc, updateDoc, Timestamp, runTransaction } from 'firebase/firestore';

export default function CheckoutManager({ appointments, onClose, COLORS, isMobile, branch }) {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'Cash' or 'Card'

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Filter unpaid appointments for today and the selected branch
  const pendingAppointments = useMemo(() => {
    return appointments.filter(app => {
      const isToday = app.date === todayStr;
      const isBranch = branch ? app.branch === branch : true;
      const isNotPaid = !app.paid;
      const isNotUnhandled = app.status !== 'unhandled';
      const matchesSearch = app.userName?.toLowerCase().includes(searchText.toLowerCase());
      return isToday && isBranch && isNotPaid && isNotUnhandled && matchesSearch;
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [appointments, todayStr, branch, searchText]);

  const handleProcessPayment = async () => {
    if (!selectedAppointment || !paymentMethod) return;

    setLoading(true);
    try {
      const appRef = doc(db, 'appointments', selectedAppointment.id);
      
      await runTransaction(db, async (transaction) => {
        const appDoc = await transaction.get(appRef);
        if (!appDoc.exists()) throw new Error('Cita no encontrada.');
        
        const data = appDoc.data();
        if (data.paid) throw new Error('Esta cita ya ha sido pagada.');

        transaction.update(appRef, {
          paid: true,
          paymentMethod: paymentMethod,
          status: 'Completed',
          paidAt: Timestamp.now(),
        });
      });

      Alert.alert('Éxito', 'Pago procesado correctamente');
      setSelectedAppointment(null);
      setPaymentMethod(null);
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', error.message || 'No se pudo procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  const renderAppointmentItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.appointmentItem,
        { backgroundColor: COLORS.surface, borderColor: COLORS.border },
        selectedAppointment?.id === item.id && { borderColor: COLORS.primary, borderWidth: 2 }
      ]}
      onPress={() => {
        setSelectedAppointment(item);
        setPaymentMethod(null);
      }}
    >
      <View style={styles.itemHeader}>
        <View style={[styles.timeBadge, { backgroundColor: COLORS.primary + '15' }]}>
          <Text style={[styles.timeText, { color: COLORS.primary }]}>{item.time}</Text>
        </View>
        <Text style={[styles.priceText, { color: COLORS.text }]}>${item.price}</Text>
      </View>
      <Text style={[styles.clientName, { color: COLORS.text }]}>{item.userName}</Text>
      <Text style={[styles.serviceName, { color: COLORS.textSecondary }]}>{item.serviceName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Header removed for dashboard integration */}

      <View style={[styles.content, isMobile ? styles.contentMobile : styles.contentDesktop]}>
        {/* Left Side: List of pending appointments */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Citas por Cobrar ({pendingAppointments.length})</Text>
          
          <View style={[styles.searchBox, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: COLORS.text }]}
              placeholder="Buscar cliente..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <FlatList
            data={pendingAppointments}
            keyExtractor={item => item.id}
            renderItem={renderAppointmentItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="cash-check" size={64} color={COLORS.textSecondary + '40'} />
                <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>No hay cobros pendientes</Text>
              </View>
            }
          />
        </View>

        {/* Right Side / Modal Overlay Detail: Payment processing */}
        {(selectedAppointment || !isMobile) && (
          <View style={[
            styles.detailSection, 
            { backgroundColor: COLORS.surface, borderColor: COLORS.border },
            isMobile && styles.detailSectionMobile
          ]}>
            {!selectedAppointment ? (
              <View style={styles.noSelection}>
                <MaterialCommunityIcons name="cursor-default-outline" size={48} color={COLORS.textSecondary + '40'} />
                <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>Selecciona una cita para cobrar</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={styles.detailHeader}>
                  <Text style={[styles.detailTitle, { color: COLORS.text }]}>Resumen de Pago</Text>
                  {isMobile && (
                    <TouchableOpacity onPress={() => setSelectedAppointment(null)}>
                      <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Ticket style summary */}
                <View style={[styles.ticket, { backgroundColor: COLORS.background, borderColor: COLORS.border }]}>
                  <View style={styles.ticketRow}>
                    <Text style={[styles.ticketLabel, { color: COLORS.textSecondary }]}>CLIENTE</Text>
                    <Text style={[styles.ticketValue, { color: COLORS.text }]}>{selectedAppointment.userName}</Text>
                  </View>
                  <View style={styles.ticketRow}>
                    <Text style={[styles.ticketLabel, { color: COLORS.textSecondary }]}>SERVICIO</Text>
                    <Text style={[styles.ticketValue, { color: COLORS.text }]}>{selectedAppointment.serviceName}</Text>
                  </View>
                  <View style={styles.ticketRow}>
                    <Text style={[styles.ticketLabel, { color: COLORS.textSecondary }]}>BARBERO</Text>
                    <Text style={[styles.ticketValue, { color: COLORS.text }]}>{selectedAppointment.barberName}</Text>
                  </View>
                  <View style={[styles.divider, { borderBottomColor: COLORS.border }]} />
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: COLORS.text }]}>TOTAL A PAGAR</Text>
                    <Text style={[styles.totalValue, { color: COLORS.primary }]}>${selectedAppointment.price}</Text>
                  </View>
                </View>

                {/* Payment Methods */}
                <Text style={[styles.methodTitle, { color: COLORS.text }]}>Método de Pago</Text>
                <View style={styles.methodsGrid}>
                  <TouchableOpacity
                    style={[
                      styles.methodCard,
                      { borderColor: COLORS.border },
                      paymentMethod === 'Cash' && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' }
                    ]}
                    onPress={() => setPaymentMethod('Cash')}
                  >
                    <MaterialCommunityIcons name="cash" size={32} color={paymentMethod === 'Cash' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.methodLabel, { color: paymentMethod === 'Cash' ? COLORS.primary : COLORS.text }]}>Efectivo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.methodCard,
                      { borderColor: COLORS.border },
                      paymentMethod === 'Card' && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' }
                    ]}
                    onPress={() => setPaymentMethod('Card')}
                  >
                    <MaterialCommunityIcons name="credit-card" size={32} color={paymentMethod === 'Card' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.methodLabel, { color: paymentMethod === 'Card' ? COLORS.primary : COLORS.text }]}>Tarjeta</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.payBtn,
                    { backgroundColor: paymentMethod ? COLORS.primary : COLORS.textSecondary + '40' }
                  ]}
                  disabled={!paymentMethod || loading}
                  onPress={handleProcessPayment}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.payBtnText}>CONFIRMAR COBRO</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  contentMobile: {
    flexDirection: 'column',
  },
  contentDesktop: {
    padding: 20,
    gap: 20,
  },
  listSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  appointmentItem: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
      default: { elevation: 2 },
    }),
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  serviceName: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  // Detail Section
  detailSection: {
    width: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    }),
  },
  detailSectionMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    zIndex: 100,
    borderRadius: 0,
  },
  noSelection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ticket: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ticketLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  ticketValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 12,
    borderStyle: 'dashed',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  methodsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  methodCard: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  payBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { transition: 'background-color 0.2s' },
    }),
  },
  payBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
