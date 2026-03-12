import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Calendar, Clock, Scissors, User as UserIcon, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

const BookingWizard = ({ user, existingAppointments, onConfirm, onCancel, COLORS, barbers, isWalkIn }: any) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    service: null as any,
    barber: null as any,
    date: null as any,
    time: null as any,
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const services = [
    { id: 1, name: 'Corte Clásico', price: 350, duration: 45 },
    { id: 2, name: 'Barba Premium', price: 250, duration: 30 },
    { id: 3, name: 'Servicio Completo', price: 500, duration: 75 },
  ];

  const times = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '04:00 PM', '05:00 PM'];

  const handleFinish = () => {
    onConfirm({
      ...data,
      userId: user.email,
      userName: user.name || 'Invitado',
      status: 'confirmed',
      paid: false,
      createdAt: new Date(),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.wizardHeader}>
        <Text style={styles.wizardTitle}>{isWalkIn ? 'Registro de Walk-in' : 'Agendar Nueva Cita'}</Text>
        <Text style={styles.wizardSubtitle}>Paso {step} de 4</Text>
      </View>

      <View style={styles.progressTrack}>
        {[1, 2, 3, 4].map(idx => (
           <View key={idx} style={[styles.progressPoint, step >= idx && styles.activePoint]} />
        ))}
      </View>

      <View style={styles.stepContent}>
        {step === 1 && (
            <ScrollView gap={12}>
                <Text style={styles.stepTitle}>Selecciona el Servicio</Text>
                {services.map(s => (
                  <TouchableOpacity 
                    key={s.id} 
                    style={[styles.optionCard, data.service?.id === s.id && styles.selectedCard]}
                    onPress={() => { setData({...data, service: s}); nextStep(); }}
                  >
                    <Scissors size={20} color={data.service?.id === s.id ? 'var(--gold)' : 'var(--text-secondary)'} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.optionName}>{s.name}</Text>
                        <Text style={styles.optionMeta}>{s.duration} min • ${s.price}</Text>
                    </View>
                    <ChevronRight size={20} color="var(--text-muted)" />
                  </TouchableOpacity>
                ))}
            </ScrollView>
        )}

        {step === 2 && (
            <ScrollView gap={12}>
                <Text style={styles.stepTitle}>Selecciona tu Barbero</Text>
                {barbers.map((b: any) => (
                    <TouchableOpacity 
                        key={b.uid} 
                        style={[styles.optionCard, data.barber?.uid === b.uid && styles.selectedCard]}
                        onPress={() => { setData({...data, barber: b}); nextStep(); }}
                    >
                        <UserIcon size={20} color={data.barber?.uid === b.uid ? 'var(--gold)' : 'var(--text-secondary)'} />
                        <Text style={styles.optionName}>{b.name}</Text>
                        <ChevronRight size={20} color="var(--text-muted)" />
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
                    <Text style={styles.backText}>Anterior</Text>
                </TouchableOpacity>
            </ScrollView>
        )}

        {step === 3 && (
            <View gap={20}>
                <Text style={styles.stepTitle}>Horario Disponible</Text>
                <View style={styles.timeGrid}>
                    {times.map(t => (
                        <TouchableOpacity 
                            key={t} 
                            style={[styles.timeSlot, data.time === t && styles.selectedSlot]}
                            onPress={() => { setData({...data, time: t}); nextStep(); }}
                        >
                            <Text style={[styles.slotText, data.time === t && styles.selectedSlotText]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
                    <Text style={styles.backText}>Anterior</Text>
                </TouchableOpacity>
            </View>
        )}

        {step === 4 && (
            <View gap={24} style={styles.summaryContainer}>
                <CheckCircle2 size={64} color="var(--gold)" style={{ alignSelf: 'center' }} />
                <View>
                    <Text style={styles.summaryTitle}>Resumen de Cita</Text>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryLabel}>Servicio:</Text>
                        <Text style={styles.summaryText}>{data.service?.name}</Text>
                        <Text style={styles.summaryLabel}>Barbero:</Text>
                        <Text style={styles.summaryText}>{data.barber?.name}</Text>
                        <Text style={styles.summaryLabel}>Hora:</Text>
                        <Text style={styles.summaryText}>{data.time}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleFinish}>
                    <Text style={styles.confirmText}>Confirmar Cita</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
                    <Text style={styles.backText}>Anterior</Text>
                </TouchableOpacity>
            </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 24 },
  wizardHeader: { gap: 4 },
  wizardTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  wizardSubtitle: { color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  progressTrack: { flexDirection: 'row', gap: 6 },
  progressPoint: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)' },
  activePoint: { backgroundColor: 'var(--gold)' },
  stepContent: { minHeight: 400 },
  stepTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 20 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, gap: 16, borderWidth: 1, borderColor: 'var(--glass-border)' },
  selectedCard: { borderColor: 'var(--gold)', backgroundColor: 'rgba(212, 175, 55, 0.05)' },
  optionName: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  optionMeta: { color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  timeSlot: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'var(--glass-border)', width: '30%' },
  selectedSlot: { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)' },
  slotText: { color: '#FFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  selectedSlotText: { color: '#000' },
  summaryContainer: { justifyContent: 'center' },
  summaryTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  summaryBox: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, gap: 8 },
  summaryLabel: { color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase' },
  summaryText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  confirmBtn: { backgroundColor: 'var(--gold)', padding: 18, borderRadius: 16, alignItems: 'center' },
  confirmText: { color: '#000', fontSize: 16, fontWeight: '800' },
  backBtn: { padding: 12, alignItems: 'center' },
  backText: { color: 'var(--text-muted)', fontSize: 14 },
});

export default BookingWizard;
