import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Modal,
  ImageBackground,
  Image,
  ActivityIndicator
} from 'react-native';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Scissors, 
  Sun, 
  Moon, 
  ChevronRight,
  ArrowRight,
  CheckCircle,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ForgotPasswordModal from '../components/Common/ForgotPasswordModal';
import { NAME_REGEX, PASSWORD_REGEX, mapAuthError } from '../utils/authUtils';

export default function AuthScreen() {
  const { width, height } = useWindowDimensions();
  const [isReady, setIsReady] = useState(false);
  
  // Robust mobile detection: width threshold OR vertical orientation
  const isMobile = width < 768 || width < height;

  useEffect(() => {
    // Tiny delay to allow window dimensions to settle on web/mobile initial load
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const { login, register, resetPassword } = useAuth();
  const { COLORS, toggleTheme, isDarkMode } = useTheme();

  const [isLogin, setIsLogin] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successModalConfig, setSuccessModalConfig] = useState({
    visible: false,
    title: '',
    message: ''
  });

  // Refs for keyboard navigation
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  const toggleSwitch = () => {
    setErrorMessage(null);
    Animated.timing(fadeAnim, { 
      toValue: 0, 
      duration: 250, 
      useNativeDriver: true 
    }).start(() => {
      setIsLogin(!isLogin);
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 250, 
        useNativeDriver: true 
      }).start();
    });
  };

  const handleSuccessModalClose = () => {
    setSuccessModalConfig(prev => ({ ...prev, visible: false }));
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setIsLogin(true);
  };

  const handleAuth = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (isLogin) {
        if (!email.trim() || !password) throw { code: 'auth/invalid-credential' };
        const result = await login(email, password);
        if (!result.success && result.sessionActive) {
          setShowSessionModal(true);
        }
      } else {
        // Registration Validations
        if (!NAME_REGEX.test(name)) {
          throw new Error('El nombre solo debe contener letras y tener al menos 2 caracteres.');
        }
        if (!email.includes('@')) {
          throw { code: 'auth/invalid-email' };
        }
        if (!PASSWORD_REGEX.test(password)) {
          throw { code: 'auth/weak-password' };
        }
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden.');
        }
        const success = await register(email, password, name);
        if (success) {
          setSuccessModalConfig({
            visible: true,
            title: '¡Cuenta Creada!',
            message: 'Te hemos enviado un correo de verificación. Revisa tu bandeja de entrada o spam y haz clic en el enlace para activar tu cuenta.'
          });
        }
      }
    } catch (error: any) {
      console.error("AuthScreen Error:", error);
      const mappedMsg = error.code ? mapAuthError(error.code) : (error.message || 'Ocurrió un error inesperado');
      setErrorMessage(mappedMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogin = async () => {
    setShowSessionModal(false);
    setLoading(true);
    try {
      await login(email, password, true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al forzar el inicio de sesión');
    } finally {
      setLoading(false);
    }
  };



  return (
    <ImageBackground 
      source={require('../assets/auth-bg.png')} 
      style={[
        styles.container, 
        { 
          flexDirection: isMobile ? 'column' : 'row',
          opacity: isReady ? 1 : 0 // Hide initial calculation frame
        }
      ]}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.7)' }]} />
      
      <TouchableOpacity 
        onPress={toggleTheme}
        style={[
          styles.themeToggle, 
          { 
            backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
            borderColor: COLORS.border,
            top: isMobile ? 15 : 40,
            right: isMobile ? 15 : 40,
          }
        ]}
      >
        {isDarkMode ? <Sun size={20} color={COLORS.primary} /> : <Moon size={20} color={COLORS.text} />}
      </TouchableOpacity>

      {/* Session Conflict Modal */}
      <Modal
        visible={showSessionModal}
        transparent
        animationType="fade"
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
          <View style={[styles.modalCard, { 
            backgroundColor: '#0A0A0A', 
            borderColor: COLORS.primary,
            borderWidth: 1.5,
            shadowColor: COLORS.primary,
            shadowOpacity: 0.3
          }]}>
            <View style={[styles.glow, { backgroundColor: COLORS.primary, top: -50, right: -50, opacity: 0.05 }]} />
            
            <TouchableOpacity 
              style={[styles.modalCloseBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]} 
              onPress={() => setShowSessionModal(false)}
            >
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.modalIconWrapper, { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '30' }]}>
              <Lock size={40} color={COLORS.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: COLORS.text }]}>SESIÓN ACTIVA</Text>
            
            <View style={[styles.divider, { backgroundColor: COLORS.primary, width: 40, height: 3, marginBottom: 20, alignSelf: 'center' }]} />

            <Text style={[styles.modalMessage, { color: COLORS.textSecondary }]}>
              Detectamos que esta cuenta tiene una sesión abierta en otro dispositivo. ¿Deseas cerrarla e iniciar aquí?
            </Text>

            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: COLORS.primary }]} 
                onPress={handleForceLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#000" /> : (
                  <Text style={styles.modalBtnText}>CERRAR OTRAS SESIONES</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} 
                onPress={() => setShowSessionModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: COLORS.text }]}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        visible={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onSubmit={resetPassword}
        COLORS={COLORS}
      />

      {/* Success Modal */}
      <Modal
        visible={successModalConfig.visible}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: COLORS.surface, borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            <TouchableOpacity 
              style={[styles.modalCloseBtn, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]} 
              onPress={handleSuccessModalClose}
            >
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.modalIconWrapper, { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '30' }]}>
              <CheckCircle size={48} color={COLORS.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: COLORS.text }]}>{successModalConfig.title}</Text>
            <Text style={[styles.modalMessage, { color: COLORS.textSecondary }]}>
              {successModalConfig.message}
            </Text>

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.primary }]} onPress={handleSuccessModalClose}>
              <Text style={styles.modalBtnText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Desktop Perspective Branding */}
      {!isMobile && (
        <View style={styles.brandSide} data-brand-side="true">
          <View style={styles.brandContent} data-brand-content="true">
            <View style={[styles.logoWrapper, { backgroundColor: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.3)' }]}>
               <Scissors size={48} color={COLORS.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: COLORS.primary }]} data-brand-title="true">EL CORONEL BARBÓN</Text>
            <Text style={[styles.brandSubtitle, { color: 'rgba(212, 175, 55, 0.8)' }]}>Peluquería y Barbería de alto nivel</Text>
            <View style={[styles.divider, { backgroundColor: COLORS.primary }]} />
            <Text style={[styles.quote, { color: 'rgba(255,255,255,0.7)' }]}>Donde la tradición se encuentra con la distinción.</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formSide}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { 
              paddingHorizontal: isMobile ? 8 : 40,
              paddingVertical: isMobile ? 32 : 40,
              minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
              width: '100%'
            }
          ]} 
          showsVerticalScrollIndicator={false}
        >

          {/* Mobile Branding Header */}
          {isMobile && (
            <View style={styles.mobileHeader}>
              <View style={[styles.mobileLogo, { borderColor: COLORS.primary + '40', width: width < 360 ? 50 : 70, height: width < 360 ? 50 : 70 }]}>
                <Scissors size={width < 360 ? 20 : 28} color={COLORS.primary} />
              </View>
              <Text style={[styles.mobileTitle, { color: COLORS.primary, fontSize: width < 360 ? 22 : 28 }]} numberOfLines={2}>
                EL CORONEL{'\n'}BARBÓN
              </Text>
              <Text 
                style={[
                  styles.mobileSubtitle, 
                  { 
                    color: COLORS.primary + 'CC', 
                    fontSize: width < 360 ? 7 : 8,
                    letterSpacing: width < 360 ? 1 : 2
                  }
                ]}
              >
                Peluquería y Barbería de alto nivel
              </Text>
            </View>
          )}

            <Animated.View 
              style={[
                styles.formCard, 
                { 
                  opacity: fadeAnim, 
                  padding: isMobile ? (width < 400 ? 16 : 24) : 40,
                  width: isMobile ? '100%' : '100%',
                  maxWidth: isMobile ? undefined : 440,
                  backgroundColor: COLORS.mode === 'dark' ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                  borderColor: COLORS.mode === 'dark' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(15, 23, 42, 0.1)' 
                }
              ]} 
              data-form-card="true"
            >
            <View style={[styles.formHeader, isMobile && width < 400 && { marginBottom: 20 }]}>
              <Text style={[styles.formTitle, { color: COLORS.text, fontSize: isMobile && width < 400 ? 24 : 32 }]}>
                {isLogin ? 'Bienvenido' : 'Crea tu Cuenta'}
              </Text>
              <Text style={[styles.formSubtitle, { color: COLORS.textSecondary, fontSize: isMobile && width < 400 ? 13 : 15 }]}>
                {isLogin ? 'Ingresa tus credenciales para continuar' : 'Únete a la membresía exclusiva de EL CORONEL BARBÓN'}
              </Text>
            </View>

            <View style={styles.inputsContainer}>
              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: COLORS.textSecondary }]}>Nombre Completo</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} data-input-wrapper="true">
                    <UserIcon size={18} color={COLORS.textMuted} />
                    <TextInput
                      ref={nameRef}
                      style={[styles.input, { color: COLORS.text }]}
                      placeholder="Tu nombre"
                      placeholderTextColor={COLORS.textMuted}
                      value={name}
                      onChangeText={setName}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      autoFocus={!isLogin}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>Email</Text>
                <View style={[styles.inputWrapper, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} data-input-wrapper="true">
                  <Mail size={18} color={COLORS.textMuted} />
                  <TextInput
                    ref={emailRef}
                    style={[styles.input, { color: COLORS.text }]}
                    placeholder="email@ejemplo.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    autoFocus={isLogin && Platform.OS === 'web'}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>Contraseña</Text>
                <View style={[styles.inputWrapper, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} data-input-wrapper="true">
                  <Lock size={18} color={COLORS.textMuted} />
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, { color: COLORS.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType={isLogin ? 'done' : 'next'}
                    onSubmitEditing={() => isLogin ? handleAuth() : confirmPasswordRef.current?.focus()}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    {showPassword ? <EyeOff size={18} color={COLORS.textMuted} /> : <Eye size={18} color={COLORS.textMuted} />}
                  </TouchableOpacity>
                </View>
              </View>

              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: COLORS.textSecondary }]}>Confirmar Contraseña</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: COLORS.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} data-input-wrapper="true">
                    <Lock size={18} color={COLORS.textMuted} />
                    <TextInput
                      ref={confirmPasswordRef}
                      style={[styles.input, { color: COLORS.text }]}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleAuth}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                      {showConfirmPassword ? <EyeOff size={18} color={COLORS.textMuted} /> : <Eye size={18} color={COLORS.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {isLogin && (
              <TouchableOpacity 
                onPress={() => setShowForgotModal(true)} 
                style={styles.forgotPass}
              >
                <Text style={[styles.forgotText, { color: COLORS.primary }]}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            )}

            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: COLORS.primary, shadowColor: COLORS.primary }]} 
              onPress={handleAuth} 
              disabled={loading}
              data-primary-btn="true"
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'PROCESANDO...' : isLogin ? 'INICIAR SESIÓN' : 'REGISTRARME'}
              </Text>
              {!loading && <ArrowRight size={18} color="#000" />}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: COLORS.textMuted }]}>
                {isLogin ? '¿Aún no eres miembro?' : '¿Ya tienes una cuenta?'}
              </Text>
              <TouchableOpacity onPress={toggleSwitch}>
                <Text style={[styles.linkText, { color: COLORS.primary }]}>
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    width: Platform.OS === 'web' ? ('100vw' as any) : '100%',
  },
  brandSide: {
    flexGrow: 1.2,
    flexBasis: 400,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    minHeight: '100%',
  },
  brandContent: {
    alignItems: 'center',
    gap: 20,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
  },
  divider: {
    width: 60,
    height: 3,
    marginVertical: 10,
  },
  quote: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 300,
  },
  formSide: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  themeToggle: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    padding: 40,
    borderRadius: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
  },
  mobileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  mobileLogo: {
    width: 70,
    height: 70,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    marginBottom: 8,
  },
  mobileTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  mobileSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  formHeader: {
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputsContainer: {
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 8,
    marginRight: -4,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    filter: 'blur(50px)',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  modalBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  modalBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
