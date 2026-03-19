import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import Sidebar from './Sidebar';
import { useSidebar } from '../../context/SidebarContext';

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
  const { isOpen, setIsOpen, isMobile } = useSidebar();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#080808' }]}>
      <View style={styles.layout}>
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          COLORS={COLORS}
          isMobile={isMobile}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />

        <View style={[
          styles.content, 
          !isMobile && styles.desktopPadding
        ]}>
          {children}
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
