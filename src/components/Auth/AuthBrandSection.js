import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AuthBrandSection({ styles, COLORS }) {
  return (
    <View style={styles.brandSide}>
      <View style={styles.brandOverlay} />
      <View style={[styles.decoCircle, { borderColor: COLORS.primary }]} />
      <View style={[styles.decoCircleSmall, { backgroundColor: COLORS.primary }]} />
      <View style={styles.brandContent}>
        <MaterialCommunityIcons
          name="content-cut"
          size={80}
          color={COLORS.primary}
          style={{ marginBottom: 20 }}
        />
        <Text style={styles.brandTitle}>BARBERÍA</Text>
        <Text style={styles.brandSubtitle}>Estilo & Elegancia</Text>
        <View style={styles.divider} />
        <Text style={styles.quote}>
          "Tu estilo es nuestra prioridad. Agenda tu cita y vive la experiencia."
        </Text>
      </View>
    </View>
  );
}

