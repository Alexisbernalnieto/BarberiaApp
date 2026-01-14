import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';

const COLORS = {
  primary: '#d4af37',
  background: '#1a1a1a',
  surface: '#222',
  text: '#fff',
};

export default function VerificationModal({ visible, email, onVerify, onCancel }) {
  const [code, setCode] = useState('');

  const handleVerify = () => {
    if (code === '1234') { // Código simulado fijo
      onVerify();
    } else {
      Alert.alert('Error', 'Código incorrecto. Intenta con 1234');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Verificar Cuenta</Text>
          <Text style={styles.subtitle}>
            Hemos enviado un código a: {"\n"}{email}
          </Text>
          <Text style={styles.hint}>(Usa el código: 1234)</Text>

          <TextInput
            style={styles.input}
            placeholder="Ingresa el código"
            placeholderTextColor="#888"
            keyboardType="number-pad"
            maxLength={4}
            value={code}
            onChangeText={setCode}
          />

          <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
            <Text style={styles.btnText}>VERIFICAR</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: COLORS.surface,
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 5,
  },
  hint: {
    color: '#888',
    fontSize: 12,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  input: {
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
    marginBottom: 20,
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
  },
  btnText: {
    color: '#000',
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#888',
  }
});
