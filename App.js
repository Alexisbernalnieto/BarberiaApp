import React, { useRef, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { auth, db } from './src/firebaseClient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification, reload } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';

import UserDashboard from './src/components/UserDashboard';
import AdminDashboard from './src/components/AdminDashboard';
import VerificationModal from './src/components/VerificationModal';

const { width, height } = Dimensions.get('window');

// Colores del tema Barbería
const COLORS = {
  primary: '#d4af37', // Dorado
  background: '#1a1a1a', // Negro oscuro
  surface: '#222222', // Gris oscuro para inputs/tarjetas
  text: '#ffffff',
  textSecondary: '#888888',
  error: '#ff4444'
};

export default function App() {
  // Estados de Auth
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Estados de Sesión y Datos
  const [currentUser, setCurrentUser] = useState(null); // Datos completos del usuario (incluyendo rol)
  const [appointments, setAppointments] = useState([]);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

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
        if (!user.emailVerified) {
          setCurrentUser(null);
          setVerificationEmail(user.email || '');
          setShowVerificationModal(true);
          setLoading(false);
          return;
        }

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setCurrentUser({ ...userDoc.data(), uid: user.uid });
          } else {
            setCurrentUser({ 
              email: user.email, 
              uid: user.uid, 
              name: user.displayName || 'Usuario', 
              role: 'user' 
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setCurrentUser(null);
        setShowVerificationModal(false);
        setVerificationEmail('');
        setEmail('');
        setPassword('');
        setRegisterEmail('');
        setRegisterPassword('');
        setConfirmPassword('');
        setEmailError('');
        setPasswordError('');
        setRegisterEmailError('');
        setRegisterPasswordError('');
        setConfirmPasswordError('');
        setIsLoginView(true);
        slideAnim.setValue(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        try {
          await sendEmailVerification(user);
          Alert.alert('Verificación enviada', 'Hemos enviado un enlace de verificación a ' + user.email);
        } catch (err) {
          Alert.alert('Error', 'No se pudo enviar el correo de verificación: ' + err.message);
        }
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Credenciales incorrectas');
      } else {
        Alert.alert('Error', 'Hubo un problema al iniciar sesión: ' + error.message);
      }
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

      const role = registerEmail.toLowerCase() === 'admin@barberia.com' ? 'admin' : 'user';

      await setDoc(doc(db, 'users', user.uid), {
        email: registerEmail,
        name: name,
        role: role, 
        createdAt: new Date().toISOString()
      });

      try {
        await sendEmailVerification(user);
        Alert.alert('Verificación requerida', 'Te hemos enviado un enlace de verificación a ' + registerEmail + '. Revisa tu correo para activar tu cuenta.');
      } catch (err) {
        Alert.alert('Error', 'No se pudo enviar el correo de verificación: ' + err.message);
      }

      Alert.alert('Éxito', 'Cuenta creada correctamente');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setRegisterEmailError('Este correo ya está registrado');
      } else {
        Alert.alert('Error', 'No se pudo registrar: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setEmail('');
      setPassword('');
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmPassword('');
      setRegisterEmailError('');
      setRegisterPasswordError('');
      setConfirmPasswordError('');
      setIsLoginView(true);
      slideAnim.setValue(0);
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const handleAddAppointment = async (appointmentData) => {
    try {
      // Guardar en Firestore
      await addDoc(collection(db, 'appointments'), appointmentData);
      Alert.alert('Reserva Exitosa', 'Tu cita ha sido agendada correctamente.');
    } catch (error) {
      console.error("Error adding appointment: ", error);
      Alert.alert('Error', 'No se pudo guardar la cita.');
    }
  };

  const handleVerificationCheck = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No hay sesión activa.');
        return;
      }

      await reload(user);

      if (!user.emailVerified) {
        Alert.alert('Correo no verificado', 'Aún no has confirmado el enlace en tu correo.');
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setCurrentUser({ ...userDoc.data(), uid: user.uid });
      } else {
        setCurrentUser({
          email: user.email,
          uid: user.uid,
          name: user.displayName || 'Usuario',
          role: 'user'
        });
      }

      setShowVerificationModal(false);
    } catch (error) {
      console.error('Error checking verification:', error);
      Alert.alert('Error', 'No se pudo comprobar la verificación: ' + error.message);
    }
  };

  const handleVerificationResend = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No hay sesión activa.');
        return;
      }

      await sendEmailVerification(user);
      Alert.alert('Verificación enviada', 'Hemos reenviado el enlace a ' + user.email);
    } catch (error) {
      console.error('Error resending verification:', error);
      Alert.alert('Error', 'No se pudo reenviar el correo de verificación: ' + error.message);
    }
  };

  const handleVerificationCancel = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error cancelling verification:', error);
    }
    setShowVerificationModal(false);
    setVerificationEmail('');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // --- Renderizado Condicional ---

  if (currentUser) {
    if (currentUser.role === 'admin') {
      return (
        <AdminDashboard 
          appointments={appointments} 
          onLogout={handleLogout} 
        />
      );
    } else {
      return (
        <UserDashboard 
          user={currentUser} 
          appointments={appointments}
          onLogout={handleLogout} 
          onAddAppointment={handleAddAppointment} 
        />
      );
    }
  }

  // --- Vista de Auth (Login/Register) ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fondo decorativo */}
      <View style={styles.backgroundDecoration}>
        <View style={styles.stripe} />
        <View style={[styles.stripe, { left: 40 }]} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>BARBERÍA</Text>
        <Text style={styles.subtitle}>ESTILO & CLASE</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* Formulario Login */}
        {isLoginView && (
        <Animated.View style={[styles.formWrapper, { transform: [{ translateX: loginTranslateX }] }]}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bienvenido</Text>
            <Text style={styles.cardSubtitle}>Inicia sesión para reservar tu corte</Text>
            
            <View>
              <TextInput 
                style={[styles.input, emailError ? styles.inputError : null]} 
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
                style={[styles.input, passwordError ? styles.inputError : null]} 
                placeholder="Contraseña" 
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>
            
            <TouchableOpacity style={styles.forgotPass}>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>INGRESAR</Text>
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={toggleSwitch}>
                <Text style={styles.switchLink}>REGÍSTRATE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
        )}

        {/* Formulario Registro */}
        {!isLoginView && (
        <Animated.View style={[styles.formWrapper, { transform: [{ translateX: registerTranslateX }], position: 'absolute' }]}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crear Cuenta</Text>
            <Text style={styles.cardSubtitle}>Únete a nuestra comunidad exclusiva</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Nombre Completo" 
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <View>
              <TextInput 
                style={[styles.input, registerEmailError ? styles.inputError : null]} 
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
                style={[styles.input, registerPasswordError ? styles.inputError : null]} 
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
                style={[styles.input, confirmPasswordError ? styles.inputError : null]} 
                placeholder="Confirmar Contraseña" 
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>REGISTRARSE</Text>
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={toggleSwitch}>
                <Text style={styles.switchLink}>INICIA SESIÓN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
        )}
      </View>

      <VerificationModal
        visible={showVerificationModal}
        email={verificationEmail}
        onVerify={handleVerificationCheck}
        onCancel={handleVerificationCancel}
        onResend={handleVerificationResend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
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
    height: height * 1.5,
    backgroundColor: COLORS.primary,
    transform: [{ rotate: '25deg' }],
  },
  header: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.text,
    letterSpacing: 3,
    marginTop: 5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  formWrapper: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#333',
    color: COLORS.text,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10, // Reducido para dar espacio al error
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    marginBottom: 10,
    marginTop: -5,
    marginLeft: 5,
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 5,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 12,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  switchText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  switchLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
  },
});
