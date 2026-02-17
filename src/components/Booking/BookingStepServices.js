import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SERVICES } from '../../data/mockData';

export default function BookingStepServices({
  styles,
  COLORS,
  selectedBranch,
  selectedService,
  setSelectedService,
}) {
  const filteredServices = SERVICES.filter(
    s => !s.branch || s.branch === 'Ambas' || s.branch === selectedBranch,
  );

  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeader}>SERVICIOS DISPONIBLES</Text>
      <View style={styles.gridContainer}>
        {filteredServices.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.serviceCard,
              selectedService?.id === item.id && styles.activeServiceCard,
            ]}
            onPress={() => setSelectedService(item)}
          >
            <View style={styles.serviceRow}>
              <View style={styles.serviceInfo}>
                <Text
                  style={[
                    styles.serviceName,
                    selectedService?.id === item.id && styles.activeText,
                  ]}
                >
                  {item.name}
                </Text>
                <View style={styles.rowCenter}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={14}
                    color={COLORS.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.serviceDuration}>{item.duration} min</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.servicePrice,
                  selectedService?.id === item.id && styles.activeText,
                ]}
              >
                ${item.price}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

