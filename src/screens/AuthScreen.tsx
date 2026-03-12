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
  StyleSheet
} from 'react-native';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Scissors, 
  Sun, 
  Moon, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function AuthScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

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

  const toggleSwitch = () => {
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

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden');
        await register(email, password, name);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Decor */}
      {!isMobile && (
        <View style={styles.brandSide} data-brand-side="true">
          <View style={styles.brandContent} data-brand-content="true">
            <View style={styles.logoWrapper}>
               <Scissors size={48} color="var(--gold)" />
            </View>
            <Text style={styles.brandTitle} data-brand-title="true">EL CORONEL</Text>
            <Text style={styles.brandSubtitle}>EXECUTIVE BARBER SHOP</Text>
            <View style={styles.divider} />
            <Text style={styles.quote}>Donde la tradición se encuentra con la distinción.</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formSide}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} data-theme-toggle="true">
            {isDarkMode ? <Sun size={20} color="var(--gold)" /> : <Moon size={20} color="#333" />}
          </TouchableOpacity>

          <Animated.View style={[styles.formCard, { opacity: fadeAnim }]} data-form-card="true">
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{isLogin ? 'Bienvenido' : 'Crea tu Cuenta'}</Text>
              <Text style={styles.formSubtitle}>
                {isLogin ? 'Ingresa tus credenciales para continuar' : 'Únete a la membresía exclusiva de El Coronel'}
              </Text>
            </View>

            <View style={styles.inputsContainer}>
              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre Completo</Text>
                  <View style={styles.inputWrapper} data-input-wrapper="true">
                    <UserIcon size={18} color="var(--text-muted)" />
                    <TextInput
                      style={styles.input}
                      placeholder="Tu nombre"
                      placeholderTextColor="var(--text-muted)"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper} data-input-wrapper="true">
                  <Mail size={18} color="var(--text-muted)" />
                  <TextInput
                    style={styles.input}
                    placeholder="email@ejemplo.com"
                    placeholderTextColor="var(--text-muted)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrapper} data-input-wrapper="true">
                  <Lock size={18} color="var(--text-muted)" />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="var(--text-muted)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar Contraseña</Text>
                  <View style={styles.inputWrapper} data-input-wrapper="true">
                    <Lock size={18} color="var(--text-muted)" />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="var(--text-muted)"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>
              )}
            </View>

            {isLogin && (
              <TouchableOpacity onPress={() => resetPassword(email)} style={styles.forgotPass}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.primaryBtn} 
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
              <Text style={styles.footerText}>
                {isLogin ? '¿Aún no eres miembro?' : '¿Ya tienes una cuenta?'}
              </Text>
              <TouchableOpacity onPress={toggleSwitch}>
                <Text style={styles.linkText}>
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'var(--bg-dark)',
  },
  brandSide: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  brandContent: {
    alignItems: 'center',
    gap: 20,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    color: '#FFF',
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
  },
  brandSubtitle: {
    color: 'var(--gold)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: 'var(--gold)',
    marginVertical: 10,
  },
  quote: {
    color: 'var(--text-muted)',
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
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: 40,
    right: 40,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'var(--glass-surface)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'var(--bg-card)',
    padding: 40,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
  },
  formHeader: {
    marginBottom: 32,
  },
  formTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  formSubtitle: {
    color: 'var(--text-secondary)',
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
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'var(--glass-border)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotText: {
    color: 'var(--gold)',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: 'var(--gold)',
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: 'var(--gold)',
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
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  linkText: {
    color: 'var(--gold)',
    fontSize: 14,
    fontWeight: '700',
  },
});
