import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import { useTheme } from './ThemeContext';
import SessionExpiredModal from '@/components/Common/SessionExpiredModal';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  getIdToken,
  getIdTokenResult,
  reload,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, getDocFromCache, setDoc, DocumentReference, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebaseClient';
import { AppUser, UserRole } from '@/types';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  offlineError: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineError, setOfflineError] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const { COLORS } = useTheme();

  const mapRole = (role: number | string): UserRole => {
    if (typeof role !== 'number') return role as UserRole;
    switch (role) {
      case 0: return 'admin';
      case 2: return 'reception';
      case 3: return 'barber';
      case 1: return 'client';
      default: return 'client';
    }
  };

  // Inactivity Timer (30 minutes)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (currentUser) {
        timeoutId = setTimeout(() => {
          console.log("Inactivity timeout reached. Logging out...");
          logout();
          setShowExpiredModal(true);
        }, INACTIVITY_TIMEOUT);
      }
    };

    // Set persistence for web to session only (clears on tab close)
    if (Platform.OS === 'web') {
      setPersistence(auth, browserLocalPersistence).catch(err => {
        console.error("Error setting session persistence:", err);
      });
      
      // Activity listeners for web
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('scroll', resetTimer);
      window.addEventListener('touchstart', resetTimer);
    }

    if (currentUser) {
      resetTimer();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (Platform.OS === 'web') {
        window.removeEventListener('mousemove', resetTimer);
        window.removeEventListener('keydown', resetTimer);
        window.removeEventListener('scroll', resetTimer);
        window.removeEventListener('touchstart', resetTimer);
      }
    };
  }, [currentUser]);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          try {
            await getIdToken(user, true);
            await reload(user);
          } catch (e) {
             console.log("Could not reload user (might be offline)");
          }
          
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          let isStaffAccount = false;
          let userData = null;

          if (userDoc.exists()) {
            userData = userDoc.data();
            const role = userData.role;
            // Check for staff roles (0=admin, 2=reception, 3=barber, or strings)
            isStaffAccount = role === 0 || role === 2 || role === 3 || 
                             role === 'admin' || role === 'barber' || role === 'reception';
            
            console.log(`AuthContext: Persistent session check for ${user.email}. isStaff: ${isStaffAccount}, role: ${role}`);
          }
          
          const freshUser = auth.currentUser || user;
          const tokenResult = await getIdTokenResult(freshUser, true).catch(() => null);
          const isVerified = tokenResult ? !!tokenResult.claims.email_verified : freshUser.emailVerified;
          
          const isSystemAccount = freshUser.email?.endsWith('@barberia.com');
          
          // Block unverified users from entering the app, EXCEPT for staff or @barberia.com accounts
          if (!isVerified && !isSystemAccount && !isStaffAccount) {
             console.log("AuthContext: Blocking unverified client session.");
             setCurrentUser(null);
             setLoading(false);
             return;
          }

          if (userData) {
            // Check for suspension
            if (userData.status === 'suspended' || userData.status === 'deleted') {
              const msg = userData.statusMessage || 'Tu cuenta ha sido restringida por la administración.';
              if (Platform.OS === 'web') window.alert(`Acceso Denegado\n\n${msg}`);
              else Alert.alert('Acceso Denegado', msg);
              
              await signOut(auth);
              return;
            }
            
            const role = mapRole(userData.role);
            setCurrentUser({ ...userData, uid: user.uid, email: user.email, role } as AppUser);

            // Real-time listener for status/role changes
            unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                const newData = docSnap.data();
                if (newData.status === 'suspended' || newData.status === 'deleted') {
                  const msg = newData.statusMessage || 'Tu cuenta ha sido restringida por la administración.';
                  if (Platform.OS === 'web') window.alert(`Acceso Denegado\n\n${msg}`);
                  else Alert.alert('Acceso Denegado', msg);
                  signOut(auth);
                } else {
                  const newRole = mapRole(newData.role);
                  setCurrentUser((prev) => prev ? { ...prev, ...newData, role: newRole } : null);
                }
              }
            });

          } else {
            // New user or missing profile — still block if unverified
            if (user.emailVerified || isSystemAccount) {
              setCurrentUser({ uid: user.uid, email: user.email || '', role: 'client' } as AppUser);
            } else {
              setCurrentUser(null);
            }
          }
        } else {
          setCurrentUser(null);
          if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
          }
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setOfflineError(true);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        await getIdToken(user, true);
        await reload(user);
      } catch (e) {
        console.log("Could not reload user during login");
      }

      const freshUser = auth.currentUser || user;
      const tokenResult = await getIdTokenResult(freshUser, true).catch(() => null);
      const isVerified = tokenResult ? !!tokenResult.claims.email_verified : freshUser.emailVerified;

      const isSystemAccount = freshUser.email?.endsWith('@barberia.com');
      
      // Fetch user data to check role for verification bypass
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef).catch((err) => {
        console.error("AuthContext: Error fetching user doc for bypass check:", err);
        return null;
      });

      let isStaffAccount = false;
      if (userDoc && userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;
        // Check for all staff roles (0=admin, 2=reception, 3=barber, or strings)
        isStaffAccount = role === 0 || role === 2 || role === 3 || 
                         role === 'admin' || role === 'barber' || role === 'reception';
        
        console.log(`AuthContext: Login attempt for ${freshUser.email}. isStaff: ${isStaffAccount}, role: ${role}`);
      } else {
        console.warn(`AuthContext: User document not found for UID: ${user.uid} during login. Verification bypass may fail.`);
      }

      // BYPASS: If they are staff or have a system email, skip verification check
      if (!isVerified && !isSystemAccount && !isStaffAccount) {
        console.log(`AuthContext: Blocking unverified client account (${freshUser.email}).`);
        if (Platform.OS === 'web') {
          const resend = window.confirm("Tu cuenta aún no está verificada. Revisa tu bandeja de entrada o spam para encontrar el enlace de activación enviado al registrarte.\n\n¿Deseas reenviar el correo de verificación?");
          if (resend) {
            try {
              await sendEmailVerification(freshUser);
              window.alert("Correo de verificación reenviado a " + freshUser.email);
            } catch (e) {
              console.error(e);
            }
          }
        } else {
          Alert.alert(
            'Verifica tu correo',
            'Tu cuenta aún no está verificada. Revisa tu bandeja de entrada o spam para encontrar el enlace de activación enviado al registrarte.',
            [
              { text: 'Esperar', style: 'cancel' },
              { text: 'Reenviar confirmación', onPress: () => {
                  sendEmailVerification(freshUser).catch(e => console.error(e));
              }}
            ]
          );
        }
        await signOut(auth);
        return false;
      }
      return true;
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Credenciales incorrectas');
      } else {
        throw new Error(error.message);
      }
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        name: name,
        role: 1, // Default Client
        createdAt: new Date().toISOString()
      });

      try {
        await sendEmailVerification(user, {
          url: 'http://localhost:8081',
          handleCodeInApp: false,
        });
      } catch (e) { console.error('Error sending verification email:', e); }

      // Sign out after email is sent (emailVerified gate prevents race condition)
      await signOut(auth);

      // Notificación se manejará en la vista
      return true;
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Correo ya registrado');
      } else {
        throw new Error(error.message);
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerificationEmail = async (): Promise<void> => {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
      Alert.alert('Correo enviado', 'Se ha enviado un nuevo enlace de verificación.');
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout, resetPassword, resendVerificationEmail, offlineError }}>
      {children}
      <SessionExpiredModal 
        visible={showExpiredModal} 
        onClose={() => setShowExpiredModal(false)} 
        COLORS={COLORS} 
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
