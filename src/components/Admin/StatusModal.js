import React from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StatusModal({ visible, config, onClose, COLORS }) {
  if (!config) return null;

  const { type, title, message } = config;
  const isError = type === 'error';
  const iconName = isError ? 'alert-circle' : 'check-circle';
  const iconColor = isError ? '#FF5252' : COLORS.primary;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: COLORS.surface, borderColor: iconColor }]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={iconName} size={80} color={iconColor} />
          </View>
          
          <Text style={[styles.title, { color: COLORS.text }]}>{title}</Text>
          <Text style={[styles.message, { color: COLORS.textSecondary }]}>{message}</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: iconColor }]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>ENTENDIDO</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 2,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
