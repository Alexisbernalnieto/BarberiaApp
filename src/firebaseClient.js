import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAA5ZVahWoIDeVaKm1nfPFJLnJeEzae9vU",
  authDomain: "barberia-app-c4c2b.firebaseapp.com",
  projectId: "barberia-app-c4c2b",
  storageBucket: "barberia-app-c4c2b.firebasestorage.app",
  messagingSenderId: "398150919752",
  appId: "1:398150919752:web:f78319899b12cbc7a09a7d",
  measurementId: "G-Q4FD9EE2CP"
};

const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia por defecto (React Native la maneja mejor así)
export const auth = getAuth(app);
export const db = getFirestore(app);
