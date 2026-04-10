import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  useWindowDimensions 
} from 'react-native';
import { User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Appointment } from '../../types';
import { formatTime12h } from '../../utils/formatters';

interface AppointmentCheckModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onConfirm: (status: 'checked_in' | 'no_show') => void;
  COLORS: any;
}

export default function AppointmentCheckModal({ visible, appointment, onConfirm, COLORS }: AppointmentCheckModalProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (!appointment) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { 
          backgroundColor: COLORS.surface, 
          borderColor: COLORS.primary + '30',
          width: isMobile ? '90%' : 400
        }]}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '15' }]}>
            <Clock size={32} color={COLORS.primary} />
          </View>

          <Text style={[styles.title, { color: COLORS.text }]}>¿LLEGÓ EL CLIENTE?</Text>
          <Text style={[styles.description, { color: COLORS.textSecondary }]}>
            La cita de <Text style={{ color: COLORS.text, fontWeight: '700' }}>{appointment.userName}</Text> programada para las {formatTime12h(appointment.time)} ya ha pasado de su hora.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.btn, { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]} 
              onPress={() => onConfirm('no_show')}
            >
              <XCircle size={18} color="#EF4444" />
              <Text style={[styles.btnText, { color: '#EF4444' }]}>NO LLEGÓ</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]} 
              onPress={() => onConfirm('checked_in')}
            >
              <CheckCircle size={18} color="#10B981" />
              <Text style={[styles.btnText, { color: '#10B981' }]}>SÍ LLEGÓ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
