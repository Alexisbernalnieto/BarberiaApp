import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// Cargar Stripe Web (clave pública)
const stripePromise = loadStripe(
  "pk_test_51T21qHIRGD2V3YWwe2nfDLXSm3xaWpsxqS2ClDMzGmIvnsQhFYT20dVQuKyWOeM538lN34EA0zhOFbzLo2HJxmxa00wFtSw9Rb"
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
