import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { AlertTriangle, Calendar, Clock, User, Scissors, X, Send, CheckCircle, Building2, Hash, XCircle, RotateCcw } from 'lucide-react';
import { Appointment } from '../../types';
import { formatFullDate, formatTime12h } from '../../utils/formatters';

interface NoShowModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSubmitJustification: (appointmentId: string, justification: string) => Promise<void>;
  COLORS: any;
}

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function NoShowModal({ visible, appointment, onClose, onSubmitJustification, COLORS }: NoShowModalProps) {
  const { width, height } = useWindowDimensions();
  const [justification, setJustification] = useState('');
  const [status, setStatus] = useState<SubmissionStatus>('idle');

  const isSmallScreen = height < 700;

  if (!appointment) return null;

  const handleSubmit = async () => {
    if (!justification.trim()) return;
    setStatus('submitting');
    try {
      await onSubmitJustification(appointment.id, justification);
      setStatus('success');
    } catch (error) {
      console.error("Error submitting justification:", error);
      setStatus('error');
    }
  };

  const handleDismiss = () => {
    onClose();
    // Reset state after closing
    setTimeout(() => {
      setStatus('idle');
      setJustification('');
    }, 300);
  };

  const renderContent = () => {
    switch (status) {
      case 'submitting':
        return (
          <View style={styles.stateBody}>
            <View style={[styles.loadingContainer, { backgroundColor: COLORS.cardDark }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
            <Text style={[styles.title, { color: COLORS.text, marginTop: 24 }]}>Enviando...</Text>
            <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                Estamos procesando tu justificación, un momento por favor.
            </Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.stateBody}>
            <View style={[styles.successIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <CheckCircle color="#22C55E" size={50} />
            </View>
            <Text style={[styles.title, { color: COLORS.text, marginTop: 24 }]}>¡Todo listo!</Text>
            <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                Tu justificación ha sido enviada con éxito. Te avisaremos pronto.
            </Text>
            <TouchableOpacity 
                style={[styles.primaryBtn, { width: '100%', marginTop: 20 }]} 
                onPress={handleDismiss}
            >
              <Text style={styles.primaryBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.stateBody}>
            <View style={[styles.successIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <XCircle color="#EF4444" size={50} />
            </View>
            <Text style={[styles.title, { color: COLORS.text, marginTop: 24 }]}>Hubo un error</Text>
            <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                No pudimos procesar tu solicitud en este momento. Intenta de nuevo.
            </Text>
            <TouchableOpacity 
                style={[styles.primaryBtn, { width: '100%', marginTop: 20 }]} 
                onPress={() => setStatus('idle')}
            >
              <RotateCcw size={16} color="#000" />
              <Text style={styles.primaryBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return (
            <ScrollView bounces={false} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Central Icon - Smaller */}
                <View style={[styles.centerIconArea, isSmallScreen && { marginBottom: 10 }]}>
                    <View style={[styles.mainIconContainer, { 
                        width: isSmallScreen ? 60 : 80, 
                        height: isSmallScreen ? 60 : 80,
                        backgroundColor: COLORS.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)' 
                    }]}>
                        <AlertTriangle color="#EF4444" size={isSmallScreen ? 32 : 44} />
                    </View>
                </View>

                <Text style={[styles.title, { color: COLORS.text, fontSize: isSmallScreen ? 22 : 26 }]}>Cita Perdida</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary, marginBottom: isSmallScreen ? 12 : 20 }]}>
                    Lamentamos que no hayas podido asistir. Tu inasistencia ha sido registrada.
                </Text>

                {/* Appointment Info Card - Grid Style */}
                <View style={[styles.infoCard, { backgroundColor: COLORS.cardDark, borderColor: COLORS.primary + '20' }]}>
                    <View style={styles.ticketHeader}>
                        <Hash size={12} color={COLORS.primary} />
                        <Text style={[styles.appointmentId, { color: COLORS.textMuted }]}>ID: {appointment.id.substring(Math.max(0, appointment.id.length - 8)).toUpperCase()}</Text>
                    </View>
                    
                    <View style={styles.dashedDivider} />

                    <View style={styles.infoGrid}>
                        <View style={styles.infoGridItem}>
                            <Scissors size={14} color={COLORS.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>SERVICIO</Text>
                                <Text style={styles.infoText} numberOfLines={1}>{appointment.serviceName}</Text>
                            </View>
                        </View>
                        <View style={styles.infoGridItem}>
                            <User size={14} color={COLORS.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>BARBERO</Text>
                                <Text style={styles.infoText} numberOfLines={1}>{appointment.barberName}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoGrid}>
                        <View style={styles.infoGridItem}>
                            <Calendar size={14} color={COLORS.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>FECHA</Text>
                                <Text style={styles.infoText}>{formatFullDate(appointment.date)}</Text>
                            </View>
                        </View>
                        <View style={styles.infoGridItem}>
                            <Clock size={14} color={COLORS.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>HORARIO</Text>
                                <Text style={styles.infoText}>{formatTime12h(appointment.time)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.infoGrid, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12, marginTop: 4 }]}>
                        <View style={[styles.infoGridItem, { width: '100%' }]}>
                            <Building2 size={14} color={COLORS.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>SUCURSAL</Text>
                                <Text style={styles.infoText}>{appointment.branch || 'Sucursal Matriz'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Justification Input - Smaller */}
                <View style={{ width: '100%' }}>
                    <Text style={[styles.label, { color: COLORS.textSecondary, marginBottom: 8 }]}>¿Tuviste algún inconveniente?</Text>
                    <TextInput
                        style={[styles.input, { 
                            backgroundColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.05)' : 'rgba(0,0,0,0.03)',
                            color: COLORS.text,
                            borderColor: COLORS.glassBorder,
                            height: isSmallScreen ? 60 : 80
                        }]}
                        placeholder="Explícanos brevemente..."
                        placeholderTextColor={COLORS.textMuted}
                        multiline
                        numberOfLines={2}
                        value={justification}
                        onChangeText={setJustification}
                    />
                </View>
                
                <Text style={[styles.penaltyNote, isSmallScreen && { marginBottom: 12, marginTop: 4 }]}>
                    * El administrador revisará tu justificación para una reprogramación.
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
                        disabled={!justification.trim()}
                    >
                        <Send size={16} color="#000" />
                        <Text style={styles.primaryBtnText}>Solicitar</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.container, { maxWidth: width > 500 ? 480 : '95%' }]}
        >
          <View style={[styles.modalContent, { backgroundColor: COLORS.surface, borderColor: COLORS.glassBorder }]}>
            {/* Header - Transparent/Minimal */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <X color={COLORS.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            {renderContent()}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  container: {
    width: '100%',
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 15,
  },
  header: {
    padding: 10,
    alignItems: 'flex-end',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 15,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    alignItems: 'center',
  },
  stateBody: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
    minHeight: 300,
    justifyContent: 'center',
  },
  loadingContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  mainIconContainer: {
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    opacity: 0.8,
  },
  appointmentId: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
    width: '100%',
    marginVertical: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  infoGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    width: '100%',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 8,
  },
  penaltyNote: {
    color: '#94A3B8',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 20,
    lineHeight: 16,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#D4AF37',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  }
});
