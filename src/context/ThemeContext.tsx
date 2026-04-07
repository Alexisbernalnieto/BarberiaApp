import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME } from '../styles/theme';

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
  COLORS: any;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState('dark');
  const COLORS = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  const isDarkMode = theme === 'dark';

  // Load theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme');
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (e) {
        console.error('Error loading theme:', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await AsyncStorage.getItem('app_theme');
      await AsyncStorage.setItem('app_theme', newTheme);
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  };

  useEffect(() => {
    StatusBar.setBarStyle(theme === 'dark' ? 'light-content' : 'dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
    
    // Apply class for CSS variables on Web
    if (Platform.OS === 'web') {
      if (theme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, COLORS, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
