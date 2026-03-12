import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// CSS Design System (only loaded in web, ignored in native)
import './src/styles/coronel.css';

// Load Stripe Web (public key from environment variable)
const stripePromise = loadStripe(
  process.env.EXPO_PUBLIC_STRIPE_PK || ''
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
