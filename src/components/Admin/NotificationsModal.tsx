import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Bell, X, ZapOff } from 'lucide-react';

const NotificationsModal = ({ visible, onClose, COLORS }: any) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, { backgroundColor: COLORS.surface, borderColor: 'rgba(212, 175, 55, 0.2)' }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: COLORS.text }]}>Notificaciones</Text>
                <TouchableOpacity onPress={onClose}>
                    <X size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                 <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                    <Bell size={48} color={COLORS.textSecondary} style={{ opacity: 0.3 }} />
                 </View>
                 <Text style={[styles.emptyTitle, { color: COLORS.text }]}>No tienes nuevas notificaciones</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 400, borderRadius: 32, borderWidth: 1, padding: 24, gap: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900' },
  body: { alignItems: 'center', gap: 16, paddingVertical: 40 },
  iconBox: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, textAlign: 'center', fontWeight: '600', opacity: 0.8 },
});

export default NotificationsModal;
