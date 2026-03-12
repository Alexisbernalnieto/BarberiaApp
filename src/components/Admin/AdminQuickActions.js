import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminQuickActions({ setViewMode, COLORS, isMobile }) {
  const iconSize = isMobile ? 24 : 32;
  const containerSize = isMobile ? 44 : 60;

  return (
    <View style={[styles.actionGrid, { gap: isMobile ? 10 : 15, marginBottom: isMobile ? 16 : 30 }]}>
      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: COLORS.surface, padding: isMobile ? 14 : 20 }]}
        onPress={() => setViewMode('finance')}
      >
        <View style={[styles.actionIconContainer, {
          backgroundColor: COLORS.primary + '15',
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        }]}>
          <MaterialCommunityIcons name="finance" size={iconSize} color={COLORS.primary} />
        </View>
        <Text style={[styles.actionText, { color: COLORS.text, fontSize: isMobile ? 12 : 14 }]}>
          Finanzas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: COLORS.surface, padding: isMobile ? 14 : 20 }]}
        onPress={() => setViewMode('barbers')}
      >
        <View style={[styles.actionIconContainer, {
          backgroundColor: COLORS.primary + '15',
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        }]}>
          <MaterialCommunityIcons name="content-cut" size={iconSize} color={COLORS.primary} />
        </View>
        <Text style={[styles.actionText, { color: COLORS.text, fontSize: isMobile ? 12 : 14 }]}>
          Barberos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: COLORS.surface, padding: isMobile ? 14 : 20 }]}
        onPress={() => setViewMode('services')}
      >
        <View style={[styles.actionIconContainer, {
          backgroundColor: COLORS.primary + '15',
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        }]}>
          <MaterialCommunityIcons name="tag-multiple" size={iconSize} color={COLORS.primary} />
        </View>
        <Text style={[styles.actionText, { color: COLORS.text, fontSize: isMobile ? 12 : 14 }]}>
          Servicios
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: COLORS.surface, padding: isMobile ? 14 : 20 }]}
        onPress={() => setViewMode('logs')}
      >
        <View style={[styles.actionIconContainer, {
          backgroundColor: COLORS.primary + '15',
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        }]}>
          <MaterialCommunityIcons name="history" size={iconSize} color={COLORS.primary} />
        </View>
        <Text style={[styles.actionText, { color: COLORS.text, fontSize: isMobile ? 12 : 14 }]}>
          Historial
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontWeight: '600',
  },
});
