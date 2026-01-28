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
  ScrollView
} from 'react-native';
import { auth, db } from './src/firebaseClient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';

import UserDashboard from './src/components/UserDashboard';
import AdminDashboard from './src/components/AdminDashboard';
import VerificationModal from './src/components/VerificationModal';

// --- Definición de Temas ---

// Tema Claro (Light Mode) - Muted White & Strong Gold
const LIGHT_THEME = {
  primary: '#E1AD01', // Strong Gold (Solid)
  accent: '#121212', // Black for contrast
  background: '#F0F0F0', // Muted White / Light Gray
  surface: '#FFFFFF', // Pure White surface
  text: '#121212', // Black text
  textSecondary: '#555555', // Dark Gray text
  error: '#B00020', // Error Red
  inputBg: '#E8E8E8', // Light input background
  border: '#E1AD01', // Strong Gold border
  // Common Colors
  white: '#FFFFFF',
  black: '#000000',
  success: '#28a745',
  disabled: '#A0A0A0',
  surfaceHighlight: '#E0E0E0'
};

// Tema Oscuro (Dark Mode) - Elegant Gold & Dark (Black & Gold)
const DARK_THEME = {
  primary: '#E1AD01', // Strong Gold (Matching Light Mode Brand)
  accent: '#FFFFFF', // White accent for contrast on dark
  background: '#121212', // Dark background
  surface: '#1E1E1E', // Dark surface
  text: '#E0E0E0', // Light text
  textSecondary: '#A0A0A0', // Gray text
  error: '#CF6679', // Error Red
  inputBg: '#2C2C2C', // Dark input background
  border: '#E1AD01', // Gold border
  // Common Colors
  white: '#FFFFFF',
  black: '#000000',
  success: '#28a745',
  disabled: '#757575',
  surfaceHighlight: '#333333'
};

export default function App() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;

  // --- Theme State Management ---
  const [theme, setTheme] = useState('light');
  const COLORS = theme === 'dark' ? DARK_THEME : LIGHT_THEME;

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Configurar StatusBar para tema oscuro
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, []);

  // Estados de Auth
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Estados de Sesión y Datos
  const [currentUser, setCurrentUser] = useState(null); // Datos completos del usuario (incluyendo rol)
  const [appointments, setAppointments] = useState([]);

  // Estados de Formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);

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

    // Si es admin ve todas, si es user ve las suyas (o todas para calcular disponibilidad)
    // Para simplificar disponibilidad, traemos todas (en app real filtraríamos por fecha/rango)
    const q = query(collection(db, 'appointments'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(apps);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- Lógica de Animación ---
  const toggleSwitch = () => {
    // Limpiar errores al cambiar de vista
    setEmailError('');
    setPasswordError('');
    setRegisterEmailError('');
    setRegisterPasswordError('');
    setConfirmPasswordError('');

    Animated.timing(slideAnim, {
      toValue: isLoginView ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
    setIsLoginView(!isLoginView);
  };

  const loginTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width]
  });

  const registerTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [width, 0]
  });

  // --- Validaciones ---
  const validateEmail = (emailToValidate) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToValidate);
  };

  const validatePassword = (passwordToValidate) => {
    // Mínimo 8 caracteres, al menos una mayúscula, un número y un caracter especial
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(passwordToValidate);
  };

  // --- Manejadores de Acción ---

  const handleLogin = async () => {
    // Reset errores
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

      // Bypass verification for special domains/emails
      const isSystemAccount = user.email.endsWith('@barberia.com');

      if (!user.emailVerified && !isSystemAccount) {
        try {
          await sendEmailVerification(user);
        } catch (e) {
          console.error('Error re-sending verification email:', e);
        }

        Alert.alert(
          'Verifica tu correo',
          'Tu cuenta aún no está verificada. Te enviamos un enlace de verificación a tu correo. Revísalo, verifica tu cuenta e inicia sesión de nuevo.'
        );
        await signOut(auth);
        return;
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        Alert.alert('Configuración requerida', 'Habilita el método Email/Password en Firebase Authentication.');
        return;
      }
      if (error.code === 'auth/network-request-failed') {
        Alert.alert('Sin conexión', 'Verifica tu conexión a internet e intenta nuevamente.');
        return;
      }
      if (error.code === 'auth/invalid-api-key') {
        Alert.alert('Configuración inválida', 'La clave de API de Firebase es inválida.');
        return;
      }
      if (error.code === 'auth/too-many-requests') {
        const emailLower = email.toLowerCase();
        const DEV_AUTH_BYPASS = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === '1';
        if (DEV_AUTH_BYPASS && (emailLower === 'admin@barberia.com' || emailLower === 'recepcion@barberia.com' || emailLower === 'cliente@barberia.com')) {
          let role = 'user';
          let name = 'Cliente de Prueba';
          if (emailLower === 'admin@barberia.com') {
            role = 'admin'; name = 'Administrador';
          } else if (emailLower === 'recepcion@barberia.com') {
            role = 'reception'; name = 'Recepción';
          }
          setCurrentUser({
            email,
            uid: 'DEV_BYPASS_' + emailLower,
            name,
            role,
          });
          return;
        }
        Alert.alert('Demasiados intentos', 'Se han bloqueado temporalmente las solicitudes por actividad inusual. Espera unos minutos o usa “Olvidaste tu contraseña” para restablecer.');
        return;
      }
      
      // Auto-create Admin/Reception/Client accounts if they don't exist
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        const emailLower = email.toLowerCase();
        if (emailLower === 'admin@barberia.com' || emailLower === 'recepcion@barberia.com' || emailLower === 'cliente@barberia.com') {
            try {
                // Try to create the user automatically
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                let role = 'user';
                let name = 'Cliente de Prueba';

                if (emailLower === 'admin@barberia.com') {
                    role = 'admin';
                    name = 'Administrador';
                } else if (emailLower === 'recepcion@barberia.com') {
                    role = 'reception';
                    name = 'Recepción';
                }
                
                await setDoc(doc(db, 'users', user.uid), {
                    email: email,
                    name: name,
                    role: role, 
                    createdAt: new Date().toISOString()
                });
                
                // Login successful after creation
                return;
            } catch (createError) {
                console.error("Auto-creation failed:", createError);
                // If creation fails (maybe password wrong for existing user), show original error
            }
        }
      }

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Credenciales incorrectas');
      } else {
        Alert.alert('Error', 'Hubo un problema al iniciar sesión: ' + error.message);
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
      if (err.code === 'auth/user-not-found') {
        Alert.alert('Usuario no encontrado', 'No existe una cuenta con ese correo.');
      } else if (err.code === 'auth/too-many-requests') {
        Alert.alert('Demasiados intentos', 'Espera unos minutos y vuelve a intentar el restablecimiento.');
      } else {
        Alert.alert('Error', 'No se pudo enviar el correo: ' + err.message);
      }
    }
  };

  const handleRegister = async () => {
    // Reset errores
    setRegisterEmailError('');
    setRegisterPasswordError('');
    setConfirmPasswordError('');

    let isValid = true;

    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }

    if (!validateEmail(registerEmail)) {
      setRegisterEmailError('Correo inválido (ej: usuario@email.com)');
      isValid = false;
    }

    if (!validatePassword(registerPassword)) {
      setRegisterPasswordError('Debe tener 8+ caracteres, Mayúscula, número y símbolo (@$!%*?&)');
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
      if (emailLower === 'admin@barberia.com') {
        role = 'admin';
      } else if (emailLower === 'recepcion@barberia.com') {
        role = 'reception';
      }

      await setDoc(doc(db, 'users', user.uid), {
        email: registerEmail,
        name: name,
        role: role, 
        createdAt: new Date().toISOString()
      });

      try {
        await sendEmailVerification(user);
      } catch (e) {
        console.error('Error sending verification email:', e);
      }

      Alert.alert('Revisa tu correo', 'Hemos creado tu cuenta y te enviamos un enlace de verificación.');

      await signOut(auth);
      setEmail(registerEmail);
      setPassword('');
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmPassword('');
      setName('');
      setPendingVerificationEmail(registerEmail);
      if (!isLoginView) {
        toggleSwitch();
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setRegisterEmailError('Este correo ya está registrado');
        Alert.alert('Error', 'Este correo ya está registrado. Intenta iniciar sesión.');
      } else {
        Alert.alert('Error', 'No se pudo registrar: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Forzar limpieza local por si el listener tarda
      setCurrentUser(null);
      
      setEmail('');
      setPassword('');
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmPassword('');
      setName('');
      setPendingVerificationEmail(null);
      setEmailError('');
      setPasswordError('');
      setRegisterEmailError('');
      setRegisterPasswordError('');
      setConfirmPasswordError('');
      slideAnim.setValue(0);
      setIsLoginView(true);
    } catch (error) {
      console.error("Error logging out: ", error);
      // Aun si falla el signOut de firebase, limpiamos localmente
      setCurrentUser(null);
      setIsLoginView(true);
    }
  };

  const handleAddAppointment = async (appointmentData) => {
    try {
      // Ensure userId is set correctly based on current session
      let dataToSave = { ...appointmentData };
      
      // For clients, force the userId to match their logged-in email
      // This ensures default/test accounts work correctly and data ownership is secure
      if (currentUser?.role === 'user') {
          dataToSave.userId = currentUser.email;
          dataToSave.userName = currentUser.name;
      }

      // Guardar en Firestore
            await addDoc(collection(db, 'appointments'), dataToSave);
            
            // Crear notificación para Admin y Recepción
            try {
                // Formatear fecha para la notificación (ej: "Lunes 9")
                const dateObj = new Date(dataToSave.date + 'T00:00:00');
                const options = { weekday: 'long', day: 'numeric', month: 'long' };
                const dateFormatted = dateObj.toLocaleDateString('es-ES', options);
                const dateFinal = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

                await addDoc(collection(db, 'notifications'), {
                    // Datos estructurados para la UI
                    clientName: dataToSave.userName || 'Cliente',
                    service: dataToSave.service || 'Servicio',
                    dateDisplay: dateFinal,
                    time: dataToSave.time,
                    branch: dataToSave.branch || 'Centro',
                    barber: dataToSave.barberName || 'Barbero Asignado',
                    
                    // Metadata standard
                    message: `Nueva cita: ${dataToSave.userName || 'Cliente'}`, // Fallback
                    createdAt: new Date().toISOString(),
                    readBy: [], 
                    targetRoles: ['admin', 'reception'],
                    type: 'new_appointment_v2' // Versionado para manejar nuevo diseño
                });
            } catch (notifError) {
                console.log("Error creating notification:", notifError);
            }

            // Logic for Notifications/Alerts
      // Client: No alert (silent success, redirect handled by Dashboard)
      // Admin/Reception: Show success alert
      if (currentUser?.role === 'admin' || currentUser?.role === 'reception') {
          Alert.alert('Reserva Exitosa', 'La cita ha sido registrada correctamente.');
      }
      
    } catch (error) {
      console.error("Error adding appointment: ", error);
      // Mostrar el mensaje real del error para facilitar depuración (ej. permisos denegados)
      Alert.alert('Error', 'No se pudo guardar la cita. ' + error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 20, color: COLORS.text }}>Cargando...</Text>
      </View>
    );
  }

  if (currentUser) {
    if (currentUser.role === 'admin' || currentUser.role === 'reception') {
      return (
        <AdminDashboard 
          role={currentUser.role}
          appointments={appointments} 
          onLogout={handleLogout} 
          onAddAppointment={handleAddAppointment}
          COLORS={COLORS}
          toggleTheme={toggleTheme}
          isDarkMode={theme === 'dark'}
        />
      );
    } else {
      return (
        <UserDashboard 
          user={currentUser} 
          appointments={appointments}
          onLogout={handleLogout} 
          onAddAppointment={handleAddAppointment} 
          COLORS={COLORS}
          toggleTheme={toggleTheme}
          isDarkMode={theme === 'dark'}
        />
      );
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      <TouchableOpacity 
        style={{ 
          position: 'absolute', 
          top: Platform.OS === 'ios' ? 60 : 40, 
          right: 20, 
          zIndex: 100, 
          padding: 10, 
          backgroundColor: COLORS.surfaceHighlight, 
          borderRadius: 25,
          elevation: 5
        }} 
        onPress={toggleTheme}
      >
        <Text style={{ fontSize: 24 }}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
      
      {/* Fondo decorativo */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.stripe, { backgroundColor: COLORS.primary }]} />
        <View style={[styles.stripe, { left: 40, backgroundColor: COLORS.accent, opacity: 0.5 }]} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} style={{ flex: 1 }}>
      <View style={[styles.header, { marginTop: isMobile ? 40 : 60 }]}>
        <Text style={[styles.title, { fontSize: isMobile ? 32 : 48, color: COLORS.primary }]}>EL CORONEL BARBÓN</Text>
        <Text style={[styles.subtitle, { fontSize: isMobile ? 12 : 16, color: COLORS.textSecondary }]}>ESTILO & ELEGANCIA</Text>
      </View>

      <View style={[styles.contentContainer, { paddingHorizontal: isMobile ? 20 : 0 }]}>
        {/* Formulario Login */}
        <Animated.View style={[styles.formWrapper, { transform: [{ translateX: loginTranslateX }], width: isMobile ? '100%' : 400 }]}>
          <View style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
            <Text style={[styles.cardTitle, { color: COLORS.text }]}>Bienvenido</Text>
            <Text style={[styles.cardSubtitle, { color: COLORS.textSecondary }]}>Inicia sesión para reservar tu corte</Text>
            
            <View>
              <TextInput 
                style={[styles.input, emailError ? styles.inputError : null, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]} 
                placeholder="Email" 
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View>
              <TextInput 
                style={[styles.input, passwordError ? styles.inputError : null, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]} 
                placeholder="Contraseña" 
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>
            
            <TouchableOpacity style={styles.forgotPass} onPress={handleForgotPassword}>
              <Text style={[styles.linkText, { color: COLORS.accent }]}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.primary }]} onPress={handleLogin}>
              <Text style={[styles.buttonText, { color: '#FFF' }]}>INGRESAR</Text>
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={[styles.switchText, { color: COLORS.textSecondary }]}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={toggleSwitch}>
                <Text style={[styles.switchLink, { color: COLORS.accent }]}>REGÍSTRATE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Formulario Registro */}
        <Animated.View style={[styles.formWrapper, { transform: [{ translateX: registerTranslateX }], position: 'absolute', width: isMobile ? '100%' : 400 }]}>
          <View style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
            <Text style={[styles.cardTitle, { color: COLORS.text }]}>Crear Cuenta</Text>
            <Text style={[styles.cardSubtitle, { color: COLORS.textSecondary }]}>Únete a nuestra comunidad exclusiva</Text>
            
            <TextInput 
              style={[styles.input, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]} 
              placeholder="Nombre Completo" 
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <View>
              <TextInput 
                style={[styles.input, registerEmailError ? styles.inputError : null, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]} 
                placeholder="Email" 
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={registerEmail}
                onChangeText={setRegisterEmail}
              />
              {registerEmailError ? <Text style={styles.errorText}>{registerEmailError}</Text> : null}
            </View>

            <View>
              <TextInput 
                style={[styles.input, registerPasswordError ? styles.inputError : null, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]} 
                placeholder="Contraseña" 
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                value={registerPassword}
                onChangeText={setRegisterPassword}
              />
              {registerPasswordError ? <Text style={styles.errorText}>{registerPasswordError}</Text> : null}
            </View>

            <View>
              <TextInput 
                style={[styles.input, confirmPasswordError ? styles.inputError : null, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]} 
                placeholder="Confirmar Contraseña" 
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
            </View>

            <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.primary }]} onPress={handleRegister}>
              <Text style={[styles.buttonText, { color: '#FFF' }]}>REGISTRARSE</Text>
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={[styles.switchText, { color: COLORS.textSecondary }]}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={toggleSwitch}>
                <Text style={[styles.switchLink, { color: COLORS.accent }]}>INICIA SESIÓN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {pendingVerificationEmail && (
          <View style={styles.verificationOverlay}>
            <View style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.accent }]}>
              <Text style={[styles.cardTitle, { color: COLORS.text }]}>Verifica tu correo</Text>
              <Text style={[styles.cardSubtitle, { color: COLORS.textSecondary }]}>Te enviamos un enlace de verificación a:</Text>
              <Text style={[styles.verificationEmail, { color: COLORS.accent }]}>{pendingVerificationEmail}</Text>
              <Text style={[styles.verificationHint, { color: COLORS.text }]}>
                Abre tu correo, haz clic en el enlace y luego inicia sesión con tus datos.
              </Text>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: COLORS.primary }]}
                onPress={() => setPendingVerificationEmail(null)}
              >
                <Text style={styles.buttonText}>IR A INICIAR SESIÓN</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      </ScrollView>
    </View>
  );
}

const platformCardShadow = Platform.select({
  web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.3)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

const platformButtonShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.25)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100%', // Fix for web white background
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  stripe: {
    position: 'absolute',
    top: -100,
    left: 0,
    width: 20,
    height: '200%', // Ensure it covers scroll
    transform: [{ rotate: '25deg' }],
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    textAlign: 'center',
  },
  subtitle: {
    letterSpacing: 3,
    marginTop: 5,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  formWrapper: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 12,
    padding: 30,
    ...platformCardShadow,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  inputError: {
    borderColor: '#cf6679',
    borderWidth: 1,
  },
  errorText: {
    color: '#cf6679',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  linkText: {
    fontSize: 14,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...platformButtonShadow,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  switchText: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  verificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 100,
    padding: 20,
  },
  verificationEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  verificationHint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
});
