import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminQuickActions({ setViewMode, COLORS }) {
  return (
    <View style={styles.actionGrid}>
      <TouchableOpacity 
        style={[styles.actionCard, { backgroundColor: COLORS.surface }]} 
        onPress={() => setViewMode('finance')}
      >
          <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialCommunityIcons name="finance" size={32} color={COLORS.primary} />
          </View>
          <Text style={[styles.actionText, { color: COLORS.text }]}>Finanzas</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionCard, { backgroundColor: COLORS.surface }]} 
        onPress={() => setViewMode('barbers')}
      >
          <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialCommunityIcons name="content-cut" size={32} color={COLORS.primary} />
          </View>
          <Text style={[styles.actionText, { color: COLORS.text }]}>Barberos</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionCard, { backgroundColor: COLORS.surface }]} 
        onPress={() => setViewMode('services')}
      >
          <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialCommunityIcons name="tag-multiple" size={32} color={COLORS.primary} />
          </View>
          <Text style={[styles.actionText, { color: COLORS.text }]}>Servicios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  actionCard: {
    flex: 1,
    padding: 20,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
