import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, getDocFromCache, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offlineError, setOfflineError] = useState(false);

  // Helper to map numeric roles to strings
  const mapRole = (r) => {
    if (r === 0) return 'admin';
    if (r === 2) return 'reception';
    if (r === 3) return 'barber';
    return 'user';
  };

  // Fetch user document with retry and cache fallback
  const fetchUserDoc = async (userDocRef) => {
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Try server first
        const userDoc = await getDoc(userDocRef);
        setOfflineError(false);
        return userDoc;
      } catch (error) {
        console.warn(`[Auth] Server fetch attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

        // On first failure, try cache immediately
        if (attempt === 1) {
          try {
            const cachedDoc = await getDocFromCache(userDocRef);
            if (cachedDoc.exists()) {
              console.log('[Auth] Using cached user data');
              setOfflineError(true);
              return cachedDoc;
            }
          } catch (cacheError) {
            console.warn('[Auth] Cache also empty:', cacheError.message);
          }
        }

        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    // All retries exhausted
    setOfflineError(true);
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await fetchUserDoc(userDocRef);

        if (userDoc && userDoc.exists()) {
          const data = userDoc.data();
          const finalRole = typeof data.role === 'number' ? mapRole(data.role) : (data.role || 'user');

          setCurrentUser({
            ...data,
            uid: user.uid,
            role: finalRole,
            emailVerified: user.emailVerified
          });
        } else if (userDoc && !userDoc.exists()) {
          // User authenticated but no Firestore doc yet (edge case)
          setCurrentUser({
            email: user.email,
            uid: user.uid,
            name: user.displayName || 'Usuario',
            role: 'user',
            emailVerified: user.emailVerified
          });
        } else {
          // Could not fetch user data at all (offline + no cache)
          // Still set user so they're not stuck on login, but mark offline
          console.error('[Auth] Could not load user data after retries. User may see limited functionality.');
          setCurrentUser({
            email: user.email,
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Usuario',
            role: 'user',
            emailVerified: user.emailVerified,
            _offlineMode: true
          });
        }
      } else {
        setCurrentUser(null);
        setOfflineError(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
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
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Credenciales incorrectas');
      } else {
        throw new Error(error.message);
      }
    }
  };

  const register = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Default role = 1 (Client)
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        name: name,
        role: 1,
        createdAt: new Date().toISOString()
      });

      try {
        await sendEmailVerification(user);
      } catch (e) { console.error(e); }

      Alert.alert('Revisa tu correo', 'Cuenta creada. Verifica tu email.');
      await signOut(auth);
      return true;
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Correo ya registrado');
      } else {
        throw new Error(error.message);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout, resetPassword, offlineError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
