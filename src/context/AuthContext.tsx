import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
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
import { mapAuthError } from '@/utils/authUtils';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  initTimeout: boolean;
  initStage: string;
  currentError: string | null;
  retryInit: () => void;
  login: (email: string, password: string, force?: boolean) => Promise<{ success: boolean; sessionActive?: boolean }>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  offlineError: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initTimeout, setInitTimeout] = useState(false);
  const [initStage, setInitStage] = useState('starting');
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [offlineError, setOfflineError] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiredReason, setExpiredReason] = useState<'inactivity' | 'duplicate' | null>(null);
  const SESSION_KEY = 'barberia_session_id';
  const isAuthenticating = useRef(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(SESSION_KEY);
      } catch (e) { return null; }
    }
    return null;
  });
  const { COLORS } = useTheme();

  // Safety timer for initialization
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        console.warn("AuthContext: Initialization taking longer than expected (10s)...");
        setInitTimeout(true);
      }, 10000); // 10 seconds
    } else {
      setInitTimeout(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const retryInit = () => {
    setLoading(true);
    setInitTimeout(false);
    // Reloading page is the most robust way to reset Firebase state on web
    if (Platform.OS === 'web') window.location.reload();
  };

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

  // Inactivity Timer (15 minutes)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (currentUser) {
        timeoutId = setTimeout(() => {
          console.log("Inactivity timeout reached. Logging out...");
          logout(false); // Manual/Inactivity logout
          setExpiredReason('inactivity');
          setShowExpiredModal(true);
        }, INACTIVITY_TIMEOUT);
      }
    };

    // Set persistence for web to session only (clears on tab close)
    if (Platform.OS === 'web') {
      setPersistence(auth, browserSessionPersistence).catch(err => {
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
        setInitStage('checking-auth');
        if (user) {
          setInitStage('refreshing-user');
          // Parallelize non-critical checks
          Promise.all([
            getIdToken(user, true).catch(() => null),
            reload(user).catch(() => null)
          ]).catch(e => console.log("AuthContext: user refresh error", e));
          
          setInitStage('fetching-profile');
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          let isStaffAccount = false;
          let userData = null;

          if (userDoc.exists()) {
            userData = userDoc.data();
            const role = userData.role;
            isStaffAccount = role === 0 || role === 2 || role === 3 || 
                             role === 'admin' || role === 'barber' || role === 'reception';
          }
          
          setInitStage('verifying-account');
          const freshUser = auth.currentUser || user;
          const isVerified = freshUser.emailVerified;
          const isSystemAccount = freshUser.email?.endsWith('@barberia.com');
          
          if (!isVerified && !isSystemAccount && !isStaffAccount) {
             setInitStage('verification-required');
             console.log("AuthContext: Blocking unverified client session.");
             setCurrentUser(null);
             setLoading(false);
             return;
          }

          if (userData) {
            setInitStage('verifying-session');
            // SESSION LOCK LOGIC: Robust check
            const firestoreSessionId = userData.sessionId;
            
            // If we have a local ID and it doesn't match Firestore -> LOGOUT (other device took over)
            if (!isAuthenticating.current && firestoreSessionId && currentSessionId && firestoreSessionId !== currentSessionId) {
              console.log("AuthContext: Session ID mismatch on load. Logging out...");
              setExpiredReason('duplicate');
              setShowExpiredModal(true);
              await logout(true); // Is a conflict, don't clear Firestore session ID (it was taken)
              return;
            }

            if (!firestoreSessionId || (Platform.OS === 'web' && !localStorage.getItem(SESSION_KEY))) {
              const newId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
              console.log("AuthContext: Regenerating session ID for stability:", newId);
              setCurrentSessionId(newId);
              if (Platform.OS === 'web') {
                localStorage.setItem(SESSION_KEY, newId);
                // Also update Firestore to sync immediately
                setDoc(userDocRef, { sessionId: newId }, { merge: true }).catch(e => console.error(e));
              }
            }

            if (userData.status === 'suspended' || userData.status === 'deleted') {
              const msg = userData.statusMessage || 'Tu cuenta ha sido restringida por la administración.';
              if (Platform.OS === 'web') window.alert(`Acceso Denegado\n\n${msg}`);
              else Alert.alert('Acceso Denegado', msg);
              await signOut(auth);
              return;
            }
            
            const role = mapRole(userData.role);
            setCurrentUser({ ...userData, uid: user.uid, email: user.email, role } as AppUser);

            unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                const newData = docSnap.data();
                
                // Real-time mismatch check
                // We use the LOCAL storage value as the source of truth for THIS tab/instance
                const myId = Platform.OS === 'web' ? localStorage.getItem(SESSION_KEY) : currentSessionId;
                
                if (!isAuthenticating.current && newData.sessionId && myId && newData.sessionId !== myId) {
                  console.log("AuthContext: Real-time session mismatch. Logging out...");
                  setExpiredReason('duplicate');
                  setShowExpiredModal(true);
                  logout(true); // Is a conflict
                  return;
                }

                if (newData.status === 'suspended' || newData.status === 'deleted') {
                  signOut(auth);
                } else {
                  const newRole = mapRole(newData.role);
                  setCurrentUser((prev) => prev ? { ...prev, ...newData, role: newRole } : null);
                }
              }
            });

          } else {
            if (user.emailVerified || isSystemAccount) {
              setCurrentUser({ uid: user.uid, email: user.email || '', role: 'client' } as AppUser);
            } else {
              setCurrentUser(null);
            }
          }
        } else {
          setInitStage('ready');
          setCurrentUser(null);
          if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
          }
        }
      } catch (error: any) {
        console.error("Auth state change error:", error);
        if (error.code?.includes('network-request-failed')) {
          setCurrentError('network-error');
        } else {
          setCurrentError(mapAuthError(error.code) || 'unknown-error');
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const login = async (email: string, password: string, force: boolean = false): Promise<{ success: boolean; sessionActive?: boolean }> => {
    isAuthenticating.current = true;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // --- SESSION PROTECTION FLOW ---
        // If there is an active session ID in Firestore and it's NOT this one
        if (!force && userData.sessionId) {
            // But check if it's the SAME browser session (persisted locally)
            const localId = Platform.OS === 'web' ? localStorage.getItem(SESSION_KEY) : currentSessionId;
            if (userData.sessionId !== localId) {
                console.warn("AuthContext: Active session detected. Requesting user confirmation.");
                await signOut(auth); // Sign out back to clear the auth state
                return { success: false, sessionActive: true };
            }
        }
      }

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
      
      // Fetch user data again for roles
      let isStaffAccount = false;
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;
        isStaffAccount = role === 0 || role === 2 || role === 3 || 
                         role === 'admin' || role === 'barber' || role === 'reception';
      }

      if (!isVerified && !isSystemAccount && !isStaffAccount) {
        console.log(`AuthContext: Blocking unverified client account (${freshUser.email}).`);
        await signOut(auth);
        return { success: false };
      }

      const newSessionId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      setCurrentSessionId(newSessionId);
      if (Platform.OS === 'web') localStorage.setItem(SESSION_KEY, newSessionId);

      // Save sessionId to user document
      try {
        await setDoc(userDocRef, { 
          sessionId: newSessionId,
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
        console.log(`AuthContext: Session locked for ${freshUser.email}`);
      } catch (e) {
        console.error("AuthContext: Could not update sessionId in Firestore:", e);
      }

      return { success: true };
    } catch (error: any) {
      console.error("AuthContext Login Error:", error);
      throw new Error(mapAuthError(error.code));
    } finally {
      isAuthenticating.current = false;
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
        const productionUrl = 'https://barberia-app-c4c2b.web.app';
        await sendEmailVerification(user, {
          url: productionUrl,
          handleCodeInApp: false,
        });
      } catch (e) { console.error('Error sending verification email:', e); }

      // Sign out after email is sent (emailVerified gate prevents race condition)
      await signOut(auth);

      return true;
    } catch (error: any) {
      console.error(error);
      throw new Error(mapAuthError(error.code));
    }
  };

  const logout = async (isConflict: boolean = false): Promise<void> => {
    console.log(`AuthContext: Executing logout (isConflict: ${isConflict})...`);
    
    // 1. If not a conflict, clear Firestore session ID while still authenticated
    if (!isConflict && currentUser?.uid) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { 
          sessionId: null,
          lastLogoutAt: new Date().toISOString()
        }, { merge: true });
        console.log("AuthContext: Successfully cleared sessionId in Firestore.");
      } catch (e) {
        console.error("AuthContext: Failed to clear sessionId in Firestore:", e);
      }
    }

    // 2. Clear UI state immediately for responsiveness
    setCurrentUser(null);
    setCurrentSessionId(null);
    
    try {
      // 3. Clear persistence
      if (Platform.OS === 'web') {
        localStorage.removeItem(SESSION_KEY);
      }
      
      // 4. Inform Firebase (optional await, we don't want to block the UI)
      await signOut(auth);
      console.log("AuthContext: Firebase signOut complete.");
    } catch (error) {
      console.error("AuthContext: Error during signOut:", error);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!email) {
      if (Platform.OS === 'web') window.alert('Por favor, ingresa tu correo electrónico primero.');
      else Alert.alert('Email Requerido', 'Por favor, ingresa tu correo electrónico primero.');
      return;
    }

    try {
      // Configuration to ensure the reset link redirects back to the app
      const productionUrl = 'https://barberia-app-c4c2b.web.app';
      const actionCodeSettings = {
        url: `${productionUrl}/login`,
        handleCodeInApp: false, // Changed to false to avoid double-handling issues
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (error: any) {
      throw new Error(mapAuthError(error.code));
    }
  };

  const resendVerificationEmail = async (): Promise<void> => {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
      Alert.alert('Correo enviado', 'Se ha enviado un nuevo enlace de verificación.');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      initTimeout,
      initStage,
      currentError,
      retryInit,
      login, 
      register, 
      logout, 
      resetPassword, 
      resendVerificationEmail, 
      offlineError 
    }}>
      {children}
      <SessionExpiredModal 
        visible={showExpiredModal} 
        reason={expiredReason}
        onClose={() => {
          setShowExpiredModal(false);
          setExpiredReason(null);
          if (Platform.OS === 'web') {
            setTimeout(() => {
              if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                window.location.reload();
              }
            }, 100);
          }
        }} 
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
