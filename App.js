import React, { useRef, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  useWindowDimensions, 
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BARBERS as INITIAL_BARBERS } from './src/data/mockData';
import { auth, db } from './src/firebaseClient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query, addDoc } from 'firebase/firestore';

import UserDashboard from './src/components/UserDashboard';
import AdminDashboard from './src/components/AdminDashboard';

import { LIGHT_THEME, DARK_THEME } from './src/styles/theme';

export default function App() {
  const { width } = useWindowDimensions();
  const isMobile = width < 900; // Increased breakpoint for tablet/desktop split

  // --- Theme State Management ---
  const [theme, setTheme] = useState('dark'); // Default to dark for "Premium" feel
  const COLORS = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  const styles = getStyles(COLORS);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Configurar StatusBar
  useEffect(() => {
    StatusBar.setBarStyle(theme === 'dark' ? 'light-content' : 'dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, [theme]);

  // Estados de Auth
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current; 
  
  // Estados de Sesión y Datos
  const [currentUser, setCurrentUser] = useState(null); 
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState(INITIAL_BARBERS);

  // Estados de Formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de Error Visual
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [registerEmailError, setRegisterEmailError] = useState('');
  const [registerPasswordError, setRegisterPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // --- Efecto: Escuchar cambios de sesión ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const emailLower = (user.email || '').toLowerCase();
        let baseRole = 'user';
        if (emailLower === 'admin@barberia.com') {
          baseRole = 'admin';
        } else if (emailLower === 'recepcion@barberia.com') {
          baseRole = 'reception';
        }

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            const finalRole = (baseRole !== 'user') ? baseRole : (data.role || 'user');
            
            setCurrentUser({ 
              ...data, 
              uid: user.uid,
              role: finalRole 
            });
          } else {
            setCurrentUser({ 
              email: user.email, 
              uid: user.uid, 
              name: user.displayName || 'Usuario', 
              role: baseRole 
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser({
            email: user.email,
            uid: user.uid,
            name: user.displayName || 'Usuario',
            role: baseRole,
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --- Efecto: Escuchar citas en tiempo real ---
  useEffect(() => {
    if (!currentUser) {
      setAppointments([]);
      return;
    }

    const q = query(collection(db, 'appointments'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(apps);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- Lógica de Animación ---
  const toggleSwitch = () => {
    // Limpiar errores
    setEmailError('');
    setPasswordError('');
    setRegisterEmailError('');
    setRegisterPasswordError('');
    setConfirmPasswordError('');

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();

    setTimeout(() => {
        setIsLoginView(!isLoginView);
    }, 200);
  };

  // --- Validaciones ---
  const validateEmail = (emailToValidate) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToValidate);
  };

  const validatePassword = (passwordToValidate) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(passwordToValidate);
  };

  // --- Manejadores de Acción ---

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    let isValid = true;

    if (!validateEmail(email)) {
      setEmailError('Formato de correo inválido');
      isValid = false;
    }
    if (!password) {
      setPasswordError('Ingresa tu contraseña');
      isValid = false;
    }

    if (!isValid) return;

    const emailLowerPre = email.toLowerCase();
    const isDefaultAdmin = emailLowerPre === 'admin@barberia.com' && password === 'Admin123!';
    const isDefaultReception = emailLowerPre === 'recepcion@barberia.com' && password === 'Recepcion123!';
    const isDefaultClient = password === 'Cliente123!';
    
    if (isDefaultAdmin || isDefaultReception || isDefaultClient) {
      let role = 'user';
      let name = 'Cliente';
      if (isDefaultAdmin) { role = 'admin'; name = 'Administrador'; }
      else if (isDefaultReception) { role = 'reception'; name = 'Recepción'; }
      setCurrentUser({
        email,
        uid: 'DEFAULT_' + role.toUpperCase(),
        name,
        role,
      });
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const isSystemAccount = user.email.endsWith('@barberia.com');

      if (!user.emailVerified && !isSystemAccount) {
        try {
          await sendEmailVerification(user);
        } catch (e) {
          console.error('Error re-sending verification email:', e);
        }

        Alert.alert(
          'Verifica tu correo',
          'Tu cuenta aún no está verificada. Te enviamos un enlace de verificación a tu correo.'
        );
        await signOut(auth);
        return;
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Credenciales incorrectas');
      } else {
        Alert.alert('Error', 'Problema al iniciar sesión: ' + error.message);
      }
    }
  };

  const handleForgotPassword = async () => {
    setEmailError('');
    if (!validateEmail(email)) {
      setEmailError('Formato de correo inválido');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Correo enviado', 'Revisa tu bandeja para restablecer la contraseña.');
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar el correo: ' + err.message);
    }
  };

  const handleRegister = async () => {
    setRegisterEmailError('');
    setRegisterPasswordError('');
    setConfirmPasswordError('');

    let isValid = true;

    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }

    if (!validateEmail(registerEmail)) {
      setRegisterEmailError('Correo inválido');
      isValid = false;
    }

    if (!validatePassword(registerPassword)) {
      setRegisterPasswordError('8+ chars, Mayúscula, número y símbolo');
      isValid = false;
    }

    if (registerPassword !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      isValid = false;
    }

    if (!isValid) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      const user = userCredential.user;

      const emailLower = registerEmail.toLowerCase();
      let role = 'user';
      if (emailLower === 'admin@barberia.com') role = 'admin';
      else if (emailLower === 'recepcion@barberia.com') role = 'reception';

      await setDoc(doc(db, 'users', user.uid), {
        email: registerEmail,
        name: name,
        role: role, 
        createdAt: new Date().toISOString()
      });

      try {
        await sendEmailVerification(user);
      } catch (e) { console.error(e); }

      Alert.alert('Revisa tu correo', 'Cuenta creada. Verifica tu email.');
      
      await signOut(auth);
      setIsLoginView(true);
      
      // Clear forms
      setEmail(registerEmail);
      setPassword('');
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmPassword('');
      setName('');
      
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setRegisterEmailError('Correo ya registrado');
      } else {
        Alert.alert('Error', 'No se pudo registrar: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsLoginView(true);
    } catch (error) {
      setCurrentUser(null);
      setIsLoginView(true);
    }
  };

  const handleAddAppointment = async (appointmentData) => {
    try {
      let dataToSave = { ...appointmentData };
      if (currentUser?.role === 'user') {
          dataToSave.userId = currentUser.email;
          dataToSave.userName = currentUser.name;
      }

      await addDoc(collection(db, 'appointments'), dataToSave);
      
      // Notificación simple
      try {
          const dateObj = new Date(dataToSave.date + 'T00:00:00');
          const options = { weekday: 'long', day: 'numeric', month: 'long' };
          const dateFormatted = dateObj.toLocaleDateString('es-ES', options);
          const dateFinal = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

          await addDoc(collection(db, 'notifications'), {
              clientName: dataToSave.userName || 'Cliente',
              service: dataToSave.service || 'Servicio',
              dateDisplay: dateFinal,
              time: dataToSave.time,
              branch: dataToSave.branch || 'Centro',
              barber: dataToSave.barberName || 'Barbero Asignado',
              message: `Nueva cita: ${dataToSave.userName || 'Cliente'}`,
              createdAt: new Date().toISOString(),
              readBy: [], 
              targetRoles: ['admin', 'reception'],
              type: 'new_appointment_v2'
          });
      } catch (e) { console.log(e); }

      if (currentUser?.role === 'admin' || currentUser?.role === 'reception') {
          Alert.alert('Reserva Exitosa', 'Cita registrada.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la cita.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (currentUser) {
    const DashboardComponent = (currentUser.role === 'admin' || currentUser.role === 'reception') 
      ? AdminDashboard 
      : UserDashboard;

    return (
      <DashboardComponent 
        role={currentUser.role}
        user={currentUser}
        appointments={appointments} 
        onLogout={handleLogout} 
        onAddAppointment={handleAddAppointment}
        COLORS={COLORS}
        toggleTheme={toggleTheme}
        isDarkMode={theme === 'dark'}
        barbers={barbers}
        setBarbers={setBarbers}
      />
    );
  }

  // --- LOGIN UI ---
  const splitStyles = getSplitStyles(COLORS, isMobile);

  return (
    <View style={[splitStyles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* Theme Toggle Absolute */}
      <TouchableOpacity 
        style={[splitStyles.themeToggle, { backgroundColor: COLORS.surfaceHighlight }]} 
        onPress={toggleTheme}
      >
        <MaterialCommunityIcons name={theme === 'dark' ? "white-balance-sunny" : "moon-waning-crescent"} size={24} color={COLORS.text} />
      </TouchableOpacity>

      {/* LEFT SIDE: BRANDING (Hidden on Mobile if needed, or displayed as header) */}
      {!isMobile && (
        <View style={splitStyles.brandSide}>
          <View style={splitStyles.brandOverlay} />
           {/* Decorative Elements */}
           <View style={[splitStyles.decoCircle, { borderColor: COLORS.primary, opacity: 0.1 }]} />
           <View style={[splitStyles.decoCircleSmall, { backgroundColor: COLORS.primary, opacity: 0.2 }]} />
           
          <View style={splitStyles.brandContent}>
             <MaterialCommunityIcons name="mustache" size={100} color={COLORS.primary} style={{marginBottom: 20}} />
             <Text style={splitStyles.brandTitle}>BARBERIA</Text>
             <Text style={splitStyles.brandSubtitle}>EL CORONEL BARBÓN</Text>
             <View style={splitStyles.divider} />
             <Text style={splitStyles.quote}>"Peluquería y Barberia de alto nivel"</Text>
          </View>
        </View>
      )}

      {/* RIGHT SIDE: FORM */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={splitStyles.formSide}
      >
        <ScrollView contentContainerStyle={splitStyles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {isMobile && (
             <View style={splitStyles.mobileHeader}>
                 <MaterialCommunityIcons name="mustache" size={60} color={COLORS.primary} />
                 <Text style={splitStyles.mobileTitle}>EL CORONEL</Text>
             </View>
          )}

          <Animated.View style={{ opacity: fadeAnim, width: '100%', maxWidth: 420 }}>
            {isLoginView ? (
              // === LOGIN FORM ===
              <View style={splitStyles.formCard}>
                <Text style={splitStyles.formTitle}>Bienvenido</Text>
                <Text style={splitStyles.formSubtitle}>Inicia sesión para continuar</Text>

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

// ================= STYLES =================
const getStyles = (COLORS) => StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const getSplitStyles = (COLORS, isMobile) => StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
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
