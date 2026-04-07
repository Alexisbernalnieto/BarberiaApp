import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  Platform
} from 'react-native';
import { Mail, ArrowRight, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  COLORS: any;
}

export default function ForgotPasswordModal({ visible, onClose, onSubmit, COLORS }: ForgotPasswordModalProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setSuccess(false);
      setError(null);
      setEmail('');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(email);
      setSuccess(true);
    } catch (err: any) {
      // Use mapped error if available
      setError(err.message || 'Ocurrió un problema al enviar el enlace.');
    } finally {
      setLoading(false);
    }
  };

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
              backgroundColor: COLORS.mode === 'dark' ? '#0A0A0A' : COLORS.surface, 
              borderColor: COLORS.primary + '40',
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
          {/* Subtle Glow Effect */}
          <View style={[styles.glow, { backgroundColor: COLORS.primary, top: -100, right: -100, opacity: 0.05 }]} />
          
          <TouchableOpacity 
            style={[styles.closeBtn, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]} 
            onPress={onClose}
          >
            <X size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '30' }]}>
              {success ? (
                <CheckCircle size={40} color={COLORS.primary} />
              ) : (
                <Mail size={40} color={COLORS.primary} />
              )}
            </View>

            <Text style={[styles.title, { color: COLORS.text }]}>
              {success ? '¡ENLACE ENVIADO!' : 'RECUPERAR CONTRASEÑA'}
            </Text>
            
            <View style={[styles.divider, { backgroundColor: COLORS.primary }]} />

            {success ? (
              <View style={styles.successArea}>
                <Text style={[styles.description, { color: COLORS.textSecondary }]}>
                  Hemos enviado las instrucciones para restablecer tu contraseña a:
                </Text>
                <Text style={[styles.emailDisplay, { color: COLORS.primary }]}>{email}</Text>
                <Text style={[styles.subText, { color: COLORS.textMuted }]}>
                  No olvides revisar tu carpeta de correo no deseado o spam.
                </Text>
                
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: COLORS.primary, marginTop: 32 }]}
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>VOLVER AL LOGIN</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                <Text style={[styles.description, { color: COLORS.textSecondary }]}>
                  Ingresa tu correo electrónico y te enviaremos un enlace para crear una nueva contraseña.
                </Text>

                <View style={[styles.inputWrapper, { 
                  backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
                  borderColor: error ? '#EF4444' : (COLORS.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                }]}>
                  <Mail size={18} color={error ? '#EF4444' : COLORS.textMuted} />
                  <TextInput
                    style={[styles.input, { color: COLORS.text }]}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      setError(null);
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoFocus={Platform.OS === 'web'}
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                  />
                </View>

                {error && (
                  <View style={styles.errorRow}>
                    <AlertCircle size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: COLORS.primary, marginTop: 24 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>ENVIAR INSTRUCCIONES</Text>
                      <ArrowRight size={18} color="#000" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    filter: 'blur(60px)',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconBox: {
    width: 84,
    height: 84,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    width: 50,
    height: 4,
    borderRadius: 2,
    marginBottom: 28,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 58,
    gap: 14,
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  successArea: {
    width: '100%',
    alignItems: 'center',
  },
  emailDisplay: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginLeft: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
