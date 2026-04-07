import React, { useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Scissors, RefreshCw } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const COLORS = {
  primary: '#D4AF37',
  bg: '#080808',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  error: '#FF5252'
};

export default function LoadingScreen() {
  const auth = useContext(AuthContext);
  
  // Robustness for early render (App.tsx fix)
  const initTimeout = auth?.initTimeout || false;
  const initStage = auth?.initStage || 'starting';
  const currentError = auth?.currentError || null;
  const retryInit = auth?.retryInit || (() => {
    if (Platform.OS === 'web') window.location.reload();
  });

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Map internal stages to user-friendly text
  const getStageText = () => {
    switch (initStage) {
      case 'starting': return 'Iniciando sistema...';
      case 'checking-auth': return 'Verificando seguridad...';
      case 'refreshing-user': return 'Sincronizando usuario...';
      case 'fetching-profile': return 'Cargando tu perfil...';
      case 'verifying-account': return 'Validando cuenta...';
      case 'verifying-session': return 'Verificando sesión única...';
      case 'verification-required': return 'Acceso restringido...';
      case 'ready': return 'Casi listo...';
      default: return 'Cargando excelencia...';
    }
  };

  useEffect(() => {
    // Rotation animation for the scissors
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: Platform.OS !== 'web',
      })
    ).start();

    // Fade in text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    // Secondary recovery timer (30s hard reload if still loading)
    let recoveryTimer: NodeJS.Timeout;
    if (Platform.OS === 'web' && !initTimeout) {
      recoveryTimer = setTimeout(() => {
        console.error("LoadingScreen: App stuck for 30s. Triggering emergency reload.");
        window.location.reload();
      }, 30000);
    }

    if (initTimeout || currentError) {
      // Shake effect when timeout or error occurs
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }

    return () => {
      if (recoveryTimer) clearTimeout(recoveryTimer);
    };
  }, [initTimeout, currentError]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isNetworkError = currentError === 'network-error';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { transform: [{ rotate: spin }] }]}>
          <Scissors size={40} color={COLORS.primary} />
        </Animated.View>
        
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.title}>EL CORONEL BARBÓN</Text>
          
          {(!initTimeout && !currentError) ? (
            <>
              <View style={styles.loaderBarContainer}>
                 <Animated.View style={[styles.loaderBar, { 
                   transform: [{ 
                     translateX: rotateAnim.interpolate({
                       inputRange: [0, 1],
                       outputRange: [-120, 120]
                     }) 
                   }] 
                 }]} />
              </View>
              <Text style={styles.subtitle}>{getStageText()}</Text>
            </>
          ) : (
            <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={styles.errorText}>
                {isNetworkError 
                  ? "Error de conexión detectado. Por favor, verifica tu internet o desactiva bloqueadores de anuncios."
                  : (initTimeout 
                    ? `La conexión está tardando más de lo habitual en: ${getStageText()}`
                    : `Error critico: ${currentError}`)}
              </Text>
              
              <View style={styles.retryButtonContainer}>
                <Text style={styles.retryButton} onPress={retryInit}>
                  REINTENTAR AHORA
                </Text>
                <RefreshCw size={14} color={COLORS.primary} style={{ marginLeft: 8 }} />
              </View>

              {isNetworkError && (
                <Text style={styles.diagnostics}>
                  Tip: Si usas PC, verifica que no estés bloqueando reCAPTCHA o Firebase.
                </Text>
              )}
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: 20,
    textTransform: 'uppercase',
  },
  loaderBarContainer: {
    width: 120,
    height: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    marginTop: 20,
    borderRadius: 1,
    overflow: 'hidden',
  },
  loaderBar: {
    width: '30%',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 20,
    maxWidth: 280,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    letterSpacing: 0.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 25,
    opacity: 0.9,
  },
  diagnostics: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  retryButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryButton: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  }
});
