import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  useWindowDimensions, 
  Platform,
  Alert,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function AuthScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  
  const { login, register, resetPassword } = useAuth();
  const { COLORS, toggleTheme, isDarkMode } = useTheme();
  
  const [isLogin, setIsLogin] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Register States
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerEmailError, setRegisterEmailError] = useState('');
  const [registerPasswordError, setRegisterPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const splitStyles = getSplitStyles(COLORS, isMobile);

  const toggleSwitch = () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    setRegisterEmailError('');
    setRegisterPasswordError('');
    setConfirmPasswordError('');

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }), // Fade out
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })  // Fade in
    ]).start();

    // Toggle state in the middle (conceptually, though here we rely on React re-render, 
    // strictly speaking we should set state after fade out, but for simple crossfade this works ok)
    setTimeout(() => setIsLogin(!isLogin), 200);
  };

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    
    if (!email) {
      setEmailError('El correo es requerido');
      return;
    }
    if (!password) {
      setPasswordError('La contraseña es requerida');
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Error', error.message);
      if (error.message.includes('password')) setPasswordError(error.message);
      else setEmailError(error.message);
    }
  };

  const handleRegister = async () => {
    setRegisterEmailError('');
    setRegisterPasswordError('');
    setConfirmPasswordError('');

    if (!name) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    if (!registerEmail) {
      setRegisterEmailError('El correo es requerido');
      return;
    }
    if (!registerPassword) {
      setRegisterPasswordError('La contraseña es requerida');
      return;
    }
    if (registerPassword !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      return;
    }

    try {
      await register(registerEmail, registerPassword, name);
    } catch (error) {
      Alert.alert('Error', error.message);
      setRegisterEmailError(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setEmailError('Ingresa tu correo para restablecer');
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert('Correo enviado', 'Revisa tu bandeja de entrada para restablecer tu contraseña.');
    } catch (error) {
      setEmailError('Error al enviar correo: ' + error.message);
    }
  };

  return (
    <View style={splitStyles.container}>
      {/* Theme Toggle */}
      <TouchableOpacity style={splitStyles.themeToggle} onPress={toggleTheme}>
        <MaterialCommunityIcons 
          name={isDarkMode ? "weather-sunny" : "weather-night"} 
          size={24} 
          color={isDarkMode ? "#FFD700" : "#333"} 
        />
      </TouchableOpacity>

      {/* LEFT SIDE: Brand/Image */}
      {!isMobile && (
        <View style={splitStyles.brandSide}>
          {/* Background Image Placeholder or Decoration */}
          <View style={splitStyles.brandOverlay} />
          
          <View style={[splitStyles.decoCircle, { borderColor: COLORS.primary }]} />
          <View style={[splitStyles.decoCircleSmall, { backgroundColor: COLORS.primary }]} />

          <View style={splitStyles.brandContent}>
            <MaterialCommunityIcons name="content-cut" size={80} color={COLORS.primary} style={{marginBottom: 20}} />
            <Text style={splitStyles.brandTitle}>BARBERÍA</Text>
            <Text style={splitStyles.brandSubtitle}>Estilo & Elegancia</Text>
            <View style={splitStyles.divider} />
            <Text style={splitStyles.quote}>"Tu estilo es nuestra prioridad. Agenda tu cita y vive la experiencia."</Text>
          </View>
        </View>
      )}

      {/* RIGHT SIDE: Form */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={splitStyles.formSide}
      >
        <ScrollView contentContainerStyle={splitStyles.scrollContent}>
          
          {isMobile && (
            <View style={splitStyles.mobileHeader}>
               <MaterialCommunityIcons name="content-cut" size={50} color={COLORS.primary} />
               <Text style={splitStyles.mobileTitle}>BARBERÍA</Text>
            </View>
          )}

          <Animated.View style={{ opacity: fadeAnim, width: '100%', maxWidth: 400 }}>
            {isLogin ? (
              // === LOGIN FORM ===
              <View style={splitStyles.formCard}>
                <Text style={splitStyles.formTitle}>Bienvenido</Text>
                <Text style={splitStyles.formSubtitle}>Ingresa a tu cuenta</Text>
                
                {/* Email Input */}
                <View style={splitStyles.inputGroup}>
                   <Text style={splitStyles.label}>Email</Text>
                   <View style={[splitStyles.inputWrapper, emailError ? {borderColor: COLORS.error} : {}]}>
                      <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={splitStyles.input}
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor={COLORS.disabled}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        selectionColor={COLORS.primary}
                      />
                   </View>
                   {emailError ? <Text style={splitStyles.errorText}>{emailError}</Text> : null}
                </View>

                {/* Password Input */}
                <View style={splitStyles.inputGroup}>
                   <Text style={splitStyles.label}>Contraseña</Text>
                   <View style={[splitStyles.inputWrapper, passwordError ? {borderColor: COLORS.error} : {}]}>
                      <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={splitStyles.input}
                        placeholder="••••••••"
                        placeholderTextColor={COLORS.disabled}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        selectionColor={COLORS.primary}
                      />
                   </View>
                   {passwordError ? <Text style={splitStyles.errorText}>{passwordError}</Text> : null}
                </View>

                <TouchableOpacity onPress={handleForgotPassword} style={{alignSelf: 'flex-end', marginBottom: 20}}>
                   <Text style={splitStyles.linkText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={splitStyles.primaryBtn} onPress={handleLogin}>
                   <Text style={splitStyles.primaryBtnText}>INICIAR SESIÓN</Text>
                </TouchableOpacity>

                <View style={splitStyles.footerRow}>
                   <Text style={{color: COLORS.textSecondary}}>¿No tienes cuenta? </Text>
                   <TouchableOpacity onPress={toggleSwitch}>
                      <Text style={[splitStyles.linkText, {fontWeight: 'bold'}]}>Regístrate</Text>
                   </TouchableOpacity>
                </View>
              </View>
            ) : (
              // === REGISTER FORM ===
              <View style={splitStyles.formCard}>
                <Text style={splitStyles.formTitle}>Crear Cuenta</Text>
                <Text style={splitStyles.formSubtitle}>Únete a la experiencia premium</Text>

                {/* Name Input */}
                <View style={splitStyles.inputGroup}>
                   <Text style={splitStyles.label}>Nombre Completo</Text>
                   <View style={splitStyles.inputWrapper}>
                      <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={splitStyles.input}
                        placeholder="Tu nombre"
                        placeholderTextColor={COLORS.disabled}
                        value={name}
                        onChangeText={setName}
                      />
                   </View>
                </View>

                {/* Email Input */}
                <View style={splitStyles.inputGroup}>
                   <Text style={splitStyles.label}>Email</Text>
                   <View style={[splitStyles.inputWrapper, registerEmailError ? {borderColor: COLORS.error} : {}]}>
                      <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={splitStyles.input}
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor={COLORS.disabled}
                        value={registerEmail}
                        onChangeText={setRegisterEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                   </View>
                   {registerEmailError ? <Text style={splitStyles.errorText}>{registerEmailError}</Text> : null}
                </View>

                {/* Password Input */}
                <View style={splitStyles.inputGroup}>
                   <Text style={splitStyles.label}>Contraseña</Text>
                   <View style={[splitStyles.inputWrapper, registerPasswordError ? {borderColor: COLORS.error} : {}]}>
                      <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={splitStyles.input}
                        placeholder="8+ caracteres"
                        placeholderTextColor={COLORS.disabled}
                        secureTextEntry
                        value={registerPassword}
                        onChangeText={setRegisterPassword}
                      />
                   </View>
                   {registerPasswordError ? <Text style={splitStyles.errorText}>{registerPasswordError}</Text> : null}
                </View>

                {/* Confirm Password Input */}
                <View style={splitStyles.inputGroup}>
                   <Text style={splitStyles.label}>Confirmar Contraseña</Text>
                   <View style={[splitStyles.inputWrapper, confirmPasswordError ? {borderColor: COLORS.error} : {}]}>
                      <MaterialCommunityIcons name="lock-check-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={splitStyles.input}
                        placeholder="Repite la contraseña"
                        placeholderTextColor={COLORS.disabled}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                   </View>
                   {confirmPasswordError ? <Text style={splitStyles.errorText}>{confirmPasswordError}</Text> : null}
                </View>

                <TouchableOpacity style={splitStyles.primaryBtn} onPress={handleRegister}>
                   <Text style={splitStyles.primaryBtnText}>REGISTRARSE</Text>
                </TouchableOpacity>

                <View style={splitStyles.footerRow}>
                   <Text style={{color: COLORS.textSecondary}}>¿Ya tienes cuenta? </Text>
                   <TouchableOpacity onPress={toggleSwitch}>
                      <Text style={[splitStyles.linkText, {fontWeight: 'bold'}]}>Inicia Sesión</Text>
                   </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getSplitStyles = (COLORS, isMobile) => StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 50,
    padding: 10,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: COLORS.surface,
  },
  
  // LEFT SIDE
  brandSide: {
    flex: 1,
    backgroundColor: '#0F0F0F', // Always dark for brand side
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  brandOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  decoCircle: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    borderWidth: 2,
    top: -100,
    left: -100,
  },
  decoCircleSmall: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -50,
    right: -50,
  },
  brandContent: {
    zIndex: 10,
    alignItems: 'center',
    padding: 40,
  },
  brandTitle: {
    color: COLORS.primary, // Gold
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 8,
  },
  brandSubtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  divider: {
    width: 80,
    height: 4,
    backgroundColor: COLORS.primary,
    marginVertical: 24,
  },
  quote: {
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 16,
    maxWidth: 300,
  },

  // RIGHT SIDE
  formSide: {
    flex: isMobile ? 1 : 1, // If mobile, full width. If desktop, half width (but container is flex row, so flex 1 = 50%)
    maxWidth: isMobile ? '100%' : 600, // Limit width on large screens
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mobileHeader: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  mobileTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 10,
  },

  // FORMS
  formCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    padding: 32,
    borderRadius: 24,
    shadowColor: COLORS.mode === 'dark' ? '#000' : '#888',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: COLORS.text,
    fontSize: 16,
    height: '100%',
    backgroundColor: 'transparent', // Fix for white box issue
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
