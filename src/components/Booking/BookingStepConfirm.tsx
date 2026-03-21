import React from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Ticket, MapPin, Scissors, User as UserIcon, Calendar, Clock } from 'lucide-react';

interface BookingStepConfirmProps {
  styles: any;
  COLORS: any;
  isWalkIn: boolean;
  guestName: string;
  setGuestName: (name: string) => void;
  user: any;
  selectedBranch: string | null;
  selectedService: any;
  selectedBarber: any;
  selectedDate: string;
  selectedTime: string | null;
}

export default function BookingStepConfirm({
  styles,
  isWalkIn,
  guestName,
  setGuestName,
  user,
  selectedBranch,
  selectedService,
  selectedBarber,
  selectedDate,
  selectedTime,
}: BookingStepConfirmProps) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeader}>Confirmación</Text>
      <Text style={styles.subLabel}>Verifica los detalles de tu cita</Text>

      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <Ticket size={32} color="var(--gold)" />
          <Text style={styles.ticketTitle}>EL CORONEL</Text>
          <Text style={styles.ticketSubtitle}>EST. 2024</Text>
        </View>

        <View style={styles.ticketContent}>
            {isWalkIn && (
                <View style={[styles.ticketRow, { marginBottom: 20 }]}>
                    <Text style={styles.ticketLabel}>Cliente</Text>
                    <TextInput
                        style={styles.input}
                        value={guestName}
                        onChangeText={setGuestName}
                        placeholder="Nombre completo"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                </View>
            )}

            <View style={styles.ticketRow}>
                <View style={[styles.rowCenter, { flex: 1 }]}>
                    <MapPin size={14} color="var(--gold)" style={{ marginRight: 8 }} />
                    <Text style={styles.ticketLabel}>Sucursal</Text>
                </View>
                <Text style={[styles.ticketValue, { flex: 1 }]}>{selectedBranch || 'No seleccionada'}</Text>
            </View>

            <View style={styles.ticketRow}>
                <View style={[styles.rowCenter, { flex: 1 }]}>
                    <Scissors size={14} color="var(--gold)" style={{ marginRight: 8 }} />
                    <Text style={styles.ticketLabel}>Servicio</Text>
                </View>
                <Text style={[styles.ticketValue, { flex: 1 }]}>{selectedService?.name || 'No seleccionado'}</Text>
            </View>

            <View style={styles.ticketRow}>
                <View style={[styles.rowCenter, { flex: 1 }]}>
                    <UserIcon size={14} color="var(--gold)" style={{ marginRight: 8 }} />
                    <Text style={styles.ticketLabel}>Barbero</Text>
                </View>
                <Text style={[styles.ticketValue, { flex: 1 }]}>{selectedBarber?.name || 'No seleccionado'}</Text>
            </View>

            <View style={styles.ticketRow}>
                <View style={[styles.rowCenter, { flex: 1 }]}>
                    <Calendar size={14} color="var(--gold)" style={{ marginRight: 8 }} />
                    <Text style={styles.ticketLabel}>Fecha</Text>
                </View>
                <Text style={[styles.ticketValue, { flex: 1 }]}>{selectedDate || 'No seleccionada'}</Text>
            </View>

            <View style={styles.ticketRow}>
                <View style={[styles.rowCenter, { flex: 1 }]}>
                    <Clock size={14} color="var(--gold)" style={{ marginRight: 8 }} />
                    <Text style={styles.ticketLabel}>Hora</Text>
                </View>
                <Text style={[styles.ticketValue, { flex: 1 }]}>{selectedTime || 'No seleccionada'}</Text>
            </View>

            <View style={styles.dashedDivider} />

            <View style={styles.ticketFooter}>
                <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
                <Text style={styles.totalPrice}>${selectedService?.price || 0}</Text>
            </View>
        </View>
      </View>

      <Text style={styles.paymentNote}>
        * El pago se procesará de forma segura en el siguiente paso.
      </Text>
    </ScrollView>
  );
}
