import React from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BookingStepConfirm({
  styles,
  COLORS,
  user,
  isWalkIn,
  guestName,
  setGuestName,
  selectedBranch,
  selectedService,
  selectedBarber,
  selectedDate,
  selectedTime,
}) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeader}>CONFIRMACIÓN</Text>

      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <MaterialCommunityIcons
            name="mustache"
            size={40}
            color={COLORS.primary}
            style={{ marginBottom: 8 }}
          />
          <Text style={styles.ticketTitle}>EL CORONEL</Text>
          <Text style={styles.ticketSubtitle}>BARBER SHOP</Text>
        </View>

        <View style={styles.ticketContent}>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>CLIENTE</Text>
            {isWalkIn ? (
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, marginLeft: 10, textAlign: 'right', color: COLORS.text },
                ]}
                placeholder="Nombre del Cliente"
                placeholderTextColor={COLORS.textSecondary}
                value={guestName}
                onChangeText={setGuestName}
              />
            ) : (
              <Text style={styles.ticketValue}>{user.name}</Text>
            )}
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>SUCURSAL</Text>
            <Text style={styles.ticketValue}>{selectedBranch}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>SERVICIO</Text>
            <Text style={styles.ticketValue}>{selectedService?.name}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>BARBERO</Text>
            <Text style={styles.ticketValue}>{selectedBarber?.name}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>FECHA</Text>
            <Text style={styles.ticketValue}>{selectedDate}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>HORA</Text>
            <Text style={styles.ticketValue}>{selectedTime}</Text>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.ticketFooter}>
            <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
            <Text style={styles.totalPrice}>${selectedService?.price}</Text>
          </View>
        </View>

        <View style={[styles.ticketHole, { left: -10, top: '50%', marginTop: -10 }]} />
        <View style={[styles.ticketHole, { right: -10, top: '50%', marginTop: -10 }]} />
      </View>

      <Text style={styles.paymentNote}>* El pago se realizará en el establecimiento.</Text>
    </ScrollView>
  );
}

