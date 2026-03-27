import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Bell, X, CalendarCheck, MapPin, User, Scissors } from 'lucide-react';
import { formatTime12h } from '../../utils/formatters';

interface AdminNotificationsProps {
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  notifications: any[];
  handleMarkAsRead: () => void;
  COLORS: any;
}

export default function AdminNotifications({ 
  showNotifications, 
  setShowNotifications, 
  notifications, 
  handleMarkAsRead, 
  COLORS 
}: AdminNotificationsProps) {
  return (
    <Modal visible={showNotifications} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay} data-modal-overlay="true">
        <View style={styles.notificationModal} data-modal="true">
          <View style={styles.notificationHeader}>
            <View style={styles.titleContainer}>
              <Bell size={20} color="var(--gold)" />
              <Text style={styles.notificationTitle}>Notificaciones</Text>
              {notifications.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notifications.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setShowNotifications(false)} style={styles.closeBtn}>
              <X size={20} color="var(--text-secondary)" />
            </TouchableOpacity>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Bell size={40} color="var(--text-muted)" />
              </View>
              <Text style={styles.emptyStateText}>Todo al día por aquí</Text>
              <Text style={styles.emptySubtitle}>No tienes notificaciones nuevas en este momento.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <ScrollView 
                style={styles.scroll} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {notifications.map(notif => (
                  <View key={notif.id} style={styles.notificationItem}>
                    <View style={styles.itemHeader}>
                      <View style={styles.typeBadge}>
                        <CalendarCheck size={14} color="var(--gold)" />
                        <Text style={styles.typeText}>Nueva Cita</Text>
                      </View>
                      <Text style={styles.notifTime}>
                        {formatTime12h(new Date(notif.createdAt))}
                      </Text>
                    </View>

                    <View style={styles.itemContent}>
                      <View style={styles.contentRow}>
                        <User size={14} color="var(--text-muted)" />
                        <Text style={styles.contentValue} numberOfLines={1}>{notif.clientName || notif.message}</Text>
                      </View>
                      
                      <View style={styles.contentRow}>
                        <Scissors size={14} color="var(--text-muted)" />
                        <Text style={styles.contentValue} numberOfLines={1}>{notif.service}</Text>
                      </View>

                      <View style={styles.contentRow}>
                        <MapPin size={14} color="var(--text-muted)" />
                        <Text style={styles.contentValue} numberOfLines={1}>{notif.branch}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity 
                onPress={handleMarkAsRead}
                style={styles.markReadBtn}
                data-primary-btn="true"
              >
                <Text style={styles.markReadText}>Marcar todo como leído</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notificationModal: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'var(--bg-sidebar)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'var(--glass-border)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  badge: {
    backgroundColor: 'var(--gold)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--glass-surface)',
  },
  listContainer: {
    flex: 1,
    maxHeight: 500,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  notificationItem: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'var(--gold-subtle)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: 'var(--gold)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notifTime: {
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: '500',
  },
  itemContent: {
    gap: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contentValue: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  markReadBtn: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'var(--gold)',
  },
  markReadText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'var(--glass-surface)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'var(--text-muted)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  }
});
