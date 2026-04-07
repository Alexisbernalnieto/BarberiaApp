import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { Platform } from "react-native";

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// --- Modern Firestore Persistence (Replaces deprecated enableMultiTabIndexedDbPersistence) ---
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const functions = getFunctions(app);

// --- Resilient App Check Initialization ---
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  (window as any).FIREBASE_INIT_STATUS = "Initializing App Check...";
  
  const initAppCheck = async () => {
    try {
      const isLocal = 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('192.168.');

      if (isLocal) {
        console.log("Firebase: Enabling App Check Debug Mode.");
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }

      const siteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;
      
      if (!siteKey) {
        console.warn("Firebase: App Check Site Key is missing. Using testing fallback.");
        (window as any).FIREBASE_INIT_STATUS = "App Check (Testing Mode)...";
      }

      const provider = new ReCaptchaV3Provider(siteKey || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');

      // Async initialization that doesn't block Auth imports
      initializeAppCheck(app, {
        provider,
        isTokenAutoRefreshEnabled: true
      });
      
      console.log("Firebase: App Check initialized successfully.");
      (window as any).FIREBASE_INIT_STATUS = "App Check OK";
    } catch (error: any) {
      if (error.code?.includes('initial-throttle')) {
        console.warn("Firebase: App Check is throttled (403/429). The system might block some Firestore writes for 24h.");
        (window as any).FIREBASE_INIT_STATUS = "App Check Throttled (403)";
      } else {
        console.error("Firebase: App Check initialization failed:", error);
        (window as any).FIREBASE_INIT_STATUS = "App Check Error";
      }
    }
  };

  initAppCheck();
}
