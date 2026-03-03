import React, { useState, useRef } from 'react';
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
  KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getSplitStyles } from './AuthScreenStyles';

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
      <TouchableOpacity style={splitStyles.themeToggle} onPress={toggleTheme}>
        <MaterialCommunityIcons
          name={isDarkMode ? "weather-sunny" : "weather-night"}
          size={24}
          color={isDarkMode ? "#FFD700" : "#333"}
        />
      </TouchableOpacity>

      {!isMobile && (
        <View style={splitStyles.brandSide}>
          {/* Background Image Placeholder or Decoration */}
          <View style={splitStyles.brandOverlay} />

          <View style={[splitStyles.decoCircle, { borderColor: COLORS.primary }]} />
          <View style={[splitStyles.decoCircleSmall, { backgroundColor: COLORS.primary }]} />

          <View style={splitStyles.brandContent}>
            <MaterialCommunityIcons name="content-cut" size={70} color={COLORS.primary} style={{ marginBottom: 24, opacity: 0.9 }} />
            <Text style={splitStyles.brandTitle}>EL CORONEL</Text>
            <Text style={[splitStyles.brandSubtitle, { marginBottom: 4 }]}>BARBÓN</Text>
            <View style={splitStyles.divider} />
            <Text style={splitStyles.quote}>Peluquería y Barbería de Alto Nivel{"\n"}San Juan del Río, Querétaro</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={splitStyles.formSide}
      >
        <ScrollView contentContainerStyle={splitStyles.scrollContent}>

          {isMobile && (
            <View style={splitStyles.mobileHeader}>
              <MaterialCommunityIcons name="content-cut" size={44} color={COLORS.primary} />
              <Text style={splitStyles.mobileTitle}>EL CORONEL BARBÓN</Text>
            </View>
          )}

          <Animated.View style={{ opacity: fadeAnim, width: '100%', maxWidth: 400 }}>
            {isLogin ? (
              // === LOGIN FORM ===
              <View style={splitStyles.formCard}>
                <Text style={splitStyles.formTitle}>Bienvenido</Text>
                <Text style={splitStyles.formSubtitle}>Inicia sesión en tu cuenta</Text>

                {/* Email Input */}
                <View style={splitStyles.inputGroup}>
                  <Text style={splitStyles.label}>Email</Text>
                  <View style={[splitStyles.inputWrapper, emailError ? { borderColor: COLORS.error } : {}]}>
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
                  <View style={[splitStyles.inputWrapper, passwordError ? { borderColor: COLORS.error } : {}]}>
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

                <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
                  <Text style={splitStyles.linkText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={splitStyles.primaryBtn} onPress={handleLogin}>
                  <Text style={splitStyles.primaryBtnText}>INICIAR SESIÓN</Text>
                </TouchableOpacity>

                <View style={splitStyles.footerRow}>
                  <Text style={{ color: COLORS.textSecondary }}>¿No tienes cuenta? </Text>
                  <TouchableOpacity onPress={toggleSwitch}>
                    <Text style={[splitStyles.linkText, { fontWeight: 'bold' }]}>Regístrate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // === REGISTER FORM ===
              <View style={splitStyles.formCard}>
                <Text style={splitStyles.formTitle}>Crear Cuenta</Text>
                <Text style={splitStyles.formSubtitle}>Únete a la experiencia El Coronel</Text>

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
                  <View style={[splitStyles.inputWrapper, registerEmailError ? { borderColor: COLORS.error } : {}]}>
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
                  <View style={[splitStyles.inputWrapper, registerPasswordError ? { borderColor: COLORS.error } : {}]}>
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
                  <View style={[splitStyles.inputWrapper, confirmPasswordError ? { borderColor: COLORS.error } : {}]}>
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
                  <Text style={{ color: COLORS.textSecondary }}>¿Ya tienes cuenta? </Text>
                  <TouchableOpacity onPress={toggleSwitch}>
                    <Text style={[splitStyles.linkText, { fontWeight: 'bold' }]}>Inicia Sesión</Text>
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
