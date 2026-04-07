import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { useFonts } from 'expo-font';
import { 
  Ionicons, 
  MaterialIcons, 
  FontAwesome, 
  AntDesign,
  MaterialCommunityIcons 
} from '@expo/vector-icons';

import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/components/Common/LoadingScreen';
import { configureSpanishCalendar } from './src/utils/calendarConfig';

// Initialize Spanish Calendar Localization
configureSpanishCalendar();

// CSS Design System (only loaded in web, ignored in native)
import './src/styles/coronel.css';

// Load Stripe Web (public key from environment variable)
const stripePromise = loadStripe(
  process.env.EXPO_PUBLIC_STRIPE_PK || ''
);

export default function App() {
  // Fix for Vector Icons in Web Production
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...FontAwesome.font,
    ...AntDesign.font,
    ...MaterialCommunityIcons.font,
  });

  // Safety: If fonts fail or take too long, proceed anyway to avoid stuck screen
  const [fontTimeout, setFontTimeout] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn("App: Font loading timeout. Proceeding with fallback fonts.");
        setFontTimeout(true);
      }
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  return (
    <Elements stripe={stripePromise}>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            {(!fontsLoaded && !fontError && !fontTimeout) ? (
              <LoadingScreen />
            ) : (
              <AppNavigator />
            )}
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </Elements>
  );
}
