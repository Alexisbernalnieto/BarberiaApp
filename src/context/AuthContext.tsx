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
import { doc, getDoc, getDocFromCache, setDoc, DocumentReference, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseClient';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  currentUser: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            if (data.status === 'suspended' || data.status === 'deleted') {
              Alert.alert('Acceso Denegado', 'Tu cuenta ha sido restringida por la administración.');
              await signOut(auth);
              return;
            }
            
            setCurrentUser({ ...data, uid: user.uid, email: user.email });

            unsubscribeSnapshot = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
              if (docSnap.exists()) {
                const newData = docSnap.data();
                if (newData.status === 'suspended' || newData.status === 'deleted') {
                  Alert.alert('Acceso Denegado', 'Tu cuenta ha sido restringida por la administración.');
                  await signOut(auth);
                } else {
                  setCurrentUser((prev: any) => prev ? { ...prev, ...newData } : prev);
                }
              }
            });

          } else {
            setCurrentUser({ uid: user.uid, email: user.email, role: 'client' });
          }
        } else {
          setCurrentUser(null);
          if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => {
      unsubscribe();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', res.user.uid), { email, name, role: 'client', createdAt: new Date().toISOString() });
    return true;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
