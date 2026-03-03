import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// CSS Design System (solo se carga en web, ignorado en nativo)
import './src/styles/coronel.css';

// Cargar Stripe Web (clave pública desde variable de entorno)
const stripePromise = loadStripe(
  process.env.EXPO_PUBLIC_STRIPE_PK
);

export default function App() {
  return (
    <Elements stripe={stripePromise}>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <AppNavigator />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </Elements>
  );
}
