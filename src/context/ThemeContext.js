import React, { createContext, useState, useContext, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { LIGHT_THEME, DARK_THEME } from '../styles/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const COLORS = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  const isDarkMode = theme === 'dark';

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    StatusBar.setBarStyle(theme === 'dark' ? 'light-content' : 'dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, COLORS, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
