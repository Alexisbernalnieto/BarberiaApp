import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, getDocFromCache, setDoc, DocumentReference } from 'firebase/firestore';
import { auth, db } from '../firebaseClient';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  offlineError: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineError, setOfflineError] = useState(false);

  // Helper to map numeric roles to strings
  const mapRole = (r: number): UserRole => {
    if (r === 0) return 'admin';
    if (r === 2) return 'reception';
    if (r === 3) return 'barber';
    return 'client';
  };

  // Fetch user document with retry and cache fallback
  const fetchUserDoc = async (userDocRef: DocumentReference) => {
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const userDoc = await getDoc(userDocRef);
        setOfflineError(false);
        return userDoc;
      } catch (error: any) {
        console.warn(`[Auth] Server fetch attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

        if (attempt === 1) {
          try {
            const cachedDoc = await getDocFromCache(userDocRef);
            if (cachedDoc.exists()) {
              console.log('[Auth] Using cached user data');
              setOfflineError(true);
              return cachedDoc;
            }
          } catch (cacheError: any) {
            console.warn('[Auth] Cache also empty:', cacheError.message);
          }
        }

        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    setOfflineError(true);
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await fetchUserDoc(userDocRef);

        if (userDoc && userDoc.exists()) {
          const data = userDoc.data();
          const finalRole = typeof data.role === 'number' ? mapRole(data.role) : (data.role as UserRole || 'client');

          setCurrentUser({
            ...data,
            uid: user.uid,
            email: user.email || '',
            role: finalRole as UserRole,
          } as User);
        } else if (userDoc && !userDoc.exists()) {
          setCurrentUser({
            email: user.email || '',
            uid: user.uid,
            role: 'client',
          } as User);
        } else {
          console.error('[Auth] Could not load user data after retries.');
          setCurrentUser({
            email: user.email || '',
            uid: user.uid,
            role: 'client',
          } as User);
        }
      } else {
        setCurrentUser(null);
        setOfflineError(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
