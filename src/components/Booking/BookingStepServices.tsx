import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Scissors, Clock, Check } from 'lucide-react';

interface BookingStepServicesProps {
  styles: any;
  COLORS: any;
  SERVICES: any[];
  selectedBranch: string | null;
  selectedService: any;
  setSelectedService: (service: any) => void;
}

export default function BookingStepServices({
  styles,
  SERVICES,
  selectedService,
  setSelectedService,
}: BookingStepServicesProps) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={true}>
      <Text style={styles.stepHeader}>Elige tu Servicio</Text>
      <Text style={styles.subLabel}>Calidad y distinción en cada detalle</Text>

      <View style={styles.gridContainer}>
        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              selectedService?.id === service.id && styles.activeServiceCard
            ]}
            onPress={() => setSelectedService(service)}
          >
            <View style={styles.serviceRow}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.rowCenter}>
                    <Clock size={12} color="var(--text-muted)" style={{ marginRight: 6 }} />
                    <Text style={styles.serviceDuration}>{service.duration} min</Text>
                </View>
              </View>
              <Text style={styles.servicePrice}>${service.price}</Text>
            </View>

            {selectedService?.id === service.id && (
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
