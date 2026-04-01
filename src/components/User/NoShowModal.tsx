import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AlertTriangle, Calendar, Clock, User, Scissors, X, Send, CheckCircle } from 'lucide-react';
import { Appointment } from '../../types';

interface NoShowModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSubmitJustification: (appointmentId: string, justification: string) => Promise<void>;
  COLORS: any;
}

export default function NoShowModal({ visible, appointment, onClose, onSubmitJustification, COLORS }: NoShowModalProps) {
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!appointment) return null;

  const handleSubmit = async () => {
    if (!justification.trim()) return;
    setLoading(true);
    try {
      await onSubmitJustification(appointment.id, justification);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting justification:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    onClose();
    // Reset state after closing
    setTimeout(() => {
      setSubmitted(false);
      setJustification('');
    }, 300);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface, borderColor: COLORS.glassBorder }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }]}>
                <AlertTriangle color="#EF4444" size={24} />
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <X color={COLORS.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            {!submitted ? (
              <ScrollView bounces={false} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: COLORS.text }]}>Cita Perdida</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                  Lamentamos que no hayas podido asistir a tu cita. Tu inasistencia ha sido registrada.
                </Text>

                {/* Appointment Info Card */}
                <View style={[styles.infoCard, { backgroundColor: COLORS.cardDark }]}>
                  <View style={styles.infoRow}>
                    <Scissors size={16} color={COLORS.primary} />
                    <Text style={styles.infoText}>{appointment.serviceName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <User size={16} color={COLORS.primary} />
                    <Text style={styles.infoText}>{appointment.barberName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Calendar size={16} color={COLORS.primary} />
                    <Text style={styles.infoText}>{appointment.date}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Clock size={16} color={COLORS.primary} />
                    <Text style={styles.infoText}>{appointment.time}</Text>
                  </View>
                </View>

                {/* Justification Input */}
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>¿Tuviste algún inconveniente?</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.05)' : 'rgba(0,0,0,0.03)',
                    color: COLORS.text,
                    borderColor: COLORS.glassBorder
                  }]}
                  placeholder="Explícanos brevemente qué sucedió..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                  value={justification}
                  onChangeText={setJustification}
                />
                
                <Text style={styles.penaltyNote}>
                  * El administrador revisará tu justificación para autorizar una reprogramación sin costo adicional.
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.secondaryBtn, { borderColor: COLORS.glassBorder }]} 
                    onPress={handleDismiss}
                  >
                    <Text style={[styles.secondaryBtnText, { color: COLORS.textSecondary }]}>Entendido</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.primaryBtn, { opacity: justification.trim() ? 1 : 0.5 }]} 
                    onPress={handleSubmit}
                    disabled={!justification.trim() || loading}
                  >
                    {loading ? (
                      <Text style={styles.primaryBtnText}>Enviando...</Text>
                    ) : (
                      <>
                        <Send size={18} color="#000" />
                        <Text style={styles.primaryBtnText}>Solicitar Reprogramación</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.successBody}>
                <CheckCircle color={COLORS.primary} size={64} style={styles.successIcon} />
                <Text style={[styles.title, { color: COLORS.text, textAlign: 'center' }]}>Solicitud Enviada</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary, textAlign: 'center' }]}>
                  Hemos recibido tu justificación. Te notificaremos en cuanto el administrador autorice tu reprogramación.
                </Text>
                <TouchableOpacity style={[styles.primaryBtn, { width: '100%', marginTop: 24 }]} onPress={handleDismiss}>
                  <Text style={styles.primaryBtnText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 450,
  },
  modalContent: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 0,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    marginBottom: 12,
  },
  penaltyNote: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 24,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    flex: 2,
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  successBody: {
    padding: 32,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  }
});
