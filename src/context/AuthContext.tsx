import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, getDocFromCache, setDoc, DocumentReference, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseClient';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  offlineError: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineError, setOfflineError] = useState(false);

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

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Check for suspension
            if (data.status === 'suspended' || data.status === 'deleted') {
              const msg = data.statusMessage || 'Tu cuenta ha sido restringida por la administración.';
              if (Platform.OS === 'web') window.alert(`Acceso Denegado\n\n${msg}`);
              else Alert.alert('Acceso Denegado', msg);
              
              await signOut(auth);
              return;
            }
            
            const role = mapRole(data.role);
            setCurrentUser({ ...data, uid: user.uid, email: user.email, role } as AppUser);

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
            // New user or missing profile
            setCurrentUser({ uid: user.uid, email: user.email || '', role: 'client' } as AppUser);
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

      const isSystemAccount = user.email?.endsWith('@barberia.com');

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
        await sendEmailVerification(user);
      } catch (e) { console.error(e); }

      Alert.alert('Revisa tu correo', 'Cuenta creada. Verifica tu email.');
      await signOut(auth);
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

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout, resetPassword, offlineError }}>
      {children}
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
