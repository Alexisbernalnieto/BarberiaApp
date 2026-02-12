import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminNotifications({ 
  showNotifications, 
  setShowNotifications, 
  notifications, 
  handleMarkAsRead, 
  COLORS 
}) {
  return (
    <Modal visible={showNotifications} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
          <View style={[styles.notificationModal, { backgroundColor: COLORS.surface }]}>
              <View style={styles.notificationHeader}>
                  <Text style={[styles.notificationTitle, { color: COLORS.text }]}>Notificaciones</Text>
                  <TouchableOpacity onPress={() => setShowNotifications(false)}>
                      <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
              </View>

              {notifications.length === 0 ? (
                  <View style={styles.emptyState}>
                      <MaterialCommunityIcons name="bell-sleep" size={48} color={COLORS.textSecondary} style={{marginBottom: 10}} />
                      <Text style={[styles.emptyStateText, { color: COLORS.textSecondary }]}>No tienes nuevas notificaciones</Text>
                  </View>
              ) : (
                  <ScrollView style={{maxHeight: 400}}>
                      {notifications.map(notif => (
                          <View key={notif.id} style={[styles.notificationItem, { borderColor: COLORS.border }]}>
                              {/* Card Header */}
                              <View style={[styles.notifItemHeader, { backgroundColor: COLORS.primary }]}>
                                  <View style={{flexDirection:'row', alignItems:'center'}}>
                                      <MaterialCommunityIcons name="calendar-check" size={18} color="#FFFFFF" style={{marginRight: 8}} />
                                      <Text style={styles.notifItemTitle}>Nueva Cita Agendada</Text>
                                  </View>
                                  <Text style={styles.notifTime}>
                                      {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </Text>
                              </View>

                              {/* Card Body */}
                              <View style={styles.notifBody}>
                                  <View style={styles.notifRow}>
                                      <Text style={[styles.notifLabel, { color: COLORS.textSecondary }]}>Cliente:</Text>
                                      <Text style={[styles.notifValue, { color: COLORS.text }]}>{notif.clientName || notif.message}</Text>
                                  </View>
                                  
                                  <View style={styles.notifRow}>
                                      <Text style={[styles.notifLabel, { color: COLORS.textSecondary }]}>Servicio:</Text>
                                      <Text style={[styles.notifValue, { color: COLORS.text }]}>{notif.service}</Text>
                                  </View>

                                  <View style={styles.notifRow}>
                                      <Text style={[styles.notifLabel, { color: COLORS.textSecondary }]}>Fecha:</Text>
                                      <Text style={[styles.notifValue, { color: COLORS.text }]}>
                                          {notif.dateDisplay || notif.subtext} - {notif.time}
                                      </Text>
                                  </View>

                                  <View style={styles.notifRow}>
                                      <Text style={[styles.notifLabel, { color: COLORS.textSecondary }]}>Sucursal:</Text>
                                      <Text style={[styles.notifValue, { color: COLORS.text }]}>{notif.branch}</Text>
                                  </View>

                                  <View style={styles.notifRow}>
                                      <Text style={[styles.notifLabel, { color: COLORS.textSecondary }]}>Barbero:</Text>
                                      <Text style={[styles.notifValue, { color: COLORS.primary }]}>{notif.barber}</Text>
                                  </View>
                              </View>
                          </View>
                      ))}
                  </ScrollView>
              )}

              {notifications.length > 0 && (
                  <TouchableOpacity 
                      onPress={handleMarkAsRead}
                      style={[styles.markReadBtn, { backgroundColor: COLORS.primary }]}
                  >
                      <Text style={styles.markReadText}>Marcar todo como leído</Text>
                  </TouchableOpacity>
              )}
          </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationModal: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  notificationItem: {
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    backgroundColor: 'white', // Default, overridden by prop if needed or transparent if using parent bg
  },
  notifItemHeader: {
    paddingVertical: 10, 
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  notifItemTitle: {
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 16
  },
  notifTime: {
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 12
  },
  notifBody: {
    padding: 15,
    backgroundColor: 'transparent', // Assuming container handles bg
  },
  notifRow: {
    flexDirection: 'row', 
    marginBottom: 8
  },
  notifLabel: {
    width: 80, 
    fontWeight: 'bold'
  },
  notifValue: {
    flex: 1,
    fontSize: 14,
  },
  markReadBtn: {
    marginTop: 20, 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center'
  },
  markReadText: {
    color: '#FFFFFF', 
    fontWeight: 'bold'
  }
});
