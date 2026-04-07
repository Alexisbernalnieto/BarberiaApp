import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { Clock, LogOut, AlertCircle } from 'lucide-react';

interface SessionExpiredModalProps {
  visible: boolean;
  reason: 'inactivity' | 'duplicate' | null;
  onClose: () => void;
  COLORS: any;
}

export default function SessionExpiredModal({ visible, reason, onClose, COLORS }: SessionExpiredModalProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const isDuplicate = reason === 'duplicate';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container, 
            { 
              backgroundColor: '#0A0A0A', 
              borderColor: isDuplicate ? '#EF4444' : COLORS.primary,
              width: isMobile ? '90%' : 440,
              opacity: fadeAnim,
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                })
              }]
            }
          ]}
        >
          {/* Decorative Elements */}
          <View style={[styles.glow, { backgroundColor: isDuplicate ? '#EF4444' : COLORS.primary }]} />
          
          <View style={styles.content}>
            <View style={[styles.iconBox, { backgroundColor: isDuplicate ? 'rgba(239, 68, 68, 0.1)' : `${COLORS.primary}20` }]}>
              {isDuplicate ? (
                <AlertCircle size={40} color="#EF4444" strokeWidth={2.5} />
              ) : (
                <Clock size={40} color={COLORS.primary} strokeWidth={2.5} />
              )}
              <View style={[styles.badge, { backgroundColor: '#FFF', borderColor: '#000' }]}>
                <LogOut size={12} color="#000" />
              </View>
            </View>

            <Text style={[styles.title, { color: COLORS.text }]}>
              {isDuplicate ? 'SESIÓN DUPLICADA' : 'SESIÓN EXPIRADA'}
            </Text>
            
            <View style={[styles.divider, { backgroundColor: isDuplicate ? '#EF4444' : COLORS.primary }]} />

            <Text style={[styles.description, { color: COLORS.textSecondary }]}>
              {isDuplicate 
                ? 'Tu sesión ha sido cerrada porque se detectó un inicio de sesión en otro dispositivo.' 
                : 'Tu sesión ha sido cerrada automáticamente debido a un periodo de inactividad por tu seguridad.'}
            </Text>

            <View style={styles.infoBox}>
              <Text style={[styles.infoText, { color: COLORS.textMuted }]}>
                Por favor, vuelve a iniciar sesión para continuar gestionando tus citas.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: isDuplicate ? '#EF4444' : COLORS.primary }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: isDuplicate ? '#FFF' : '#000' }]}>VUELVE A INICIAR SESIÓN</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 32,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  glow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  divider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 16,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
