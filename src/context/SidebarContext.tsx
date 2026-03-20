import React, { createContext, useContext, useState } from 'react';
import { useWindowDimensions } from 'react-native';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile, isTablet, isDesktop }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};
