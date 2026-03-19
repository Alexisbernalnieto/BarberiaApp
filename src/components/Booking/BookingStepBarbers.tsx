import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { User, Check } from 'lucide-react';

interface BookingStepBarbersProps {
  styles: any;
  COLORS: any;
  BARBERS: any[];
  selectedBranch: string | null;
  selectedBarber: any;
  setSelectedBarber: (barber: any) => void;
}

export default function BookingStepBarbers({
  styles,
  BARBERS,
  selectedBarber,
  setSelectedBarber,
}: BookingStepBarbersProps) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeader}>Elige a tu Barbero</Text>
      <Text style={styles.subLabel}>Nuestros maestros del estilo a tu disposición</Text>

      <View style={styles.barbersGrid}>
        {BARBERS.map((barber) => (
          <TouchableOpacity
            key={barber.id}
            style={[
              styles.barberCard,
              selectedBarber?.id === barber.id && styles.activeBarberCard
            ]}
            onPress={() => setSelectedBarber(barber)}
          >
            <View style={[styles.avatarBig, selectedBarber?.id === barber.id && styles.activeAvatarBig]}>
              <User size={40} color={selectedBarber?.id === barber.id ? "#000" : "var(--text-muted)"} />
            </View>
            <Text style={styles.barberName}>{barber.name}</Text>
            
            {selectedBarber?.id === barber.id && (
              <View style={styles.checkBadge}>
                <Check size={14} color="#000" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
