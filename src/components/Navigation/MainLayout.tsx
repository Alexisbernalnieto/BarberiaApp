import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView, Platform, SafeAreaView } from 'react-native';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  COLORS: any;
  user: any;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  COLORS 
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'var(--bg-dark)' }]}>
      <View style={styles.layout}>
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          COLORS={COLORS}
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <View style={[
          styles.content, 
          !isMobile && styles.desktopPadding
        ]}>
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { 
                setSidebarOpen: setIsSidebarOpen,
                isMobile 
              });
            }
            return child;
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    height: '100%',
  },
  desktopPadding: {
    marginLeft: 280, // Matches Sidebar width
  },
});

export default MainLayout;
