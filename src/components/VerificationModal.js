import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

const COLORS = {
  primary: '#d4af37',
  background: '#1a1a1a',
  surface: '#222',
  text: '#fff',
};

export default function VerificationModal({ visible, email, onVerify, onCancel, onResend }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Verificar correo</Text>
          <Text style={styles.subtitle}>
            Hemos enviado un enlace de verificación a:
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.hint}>
            Revisa tu bandeja de entrada y carpeta de spam.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={onVerify}>
            <Text style={styles.primaryText}>YA VERIFIQUÉ MI CORREO</Text>
          </TouchableOpacity>

          {onResend && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onResend}>
              <Text style={styles.secondaryText}>REENVIAR CORREO</Text>
            </TouchableOpacity>
          )}

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
    marginBottom: 10,
  },
  emailText: {
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  hint: {
    color: '#888',
    fontSize: 12,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
  },
  primaryText: {
    color: '#000',
    fontWeight: 'bold',
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 15,
  },
  secondaryText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#888',
  }
});
