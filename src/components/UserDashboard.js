import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, useWindowDimensions, Animated, ScrollView } from 'react-native';
import BookingWizard from './Booking/BookingWizard';
import UserHeader from './User/UserHeader';
import UserSummary from './User/UserSummary';
import UserAppointments from './User/UserAppointments';

export default function UserDashboard({ user, appointments, onLogout, onAddAppointment, COLORS, toggleTheme, isDarkMode, barbers }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Fade In Animation for content
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Responsive Grid Config
  const containerPadding = isMobile ? 20 : 40; 
  const gap = 24;
  const numColumns = width > 1200 ? 3 : width > 800 ? 2 : 1; 
  const itemWidth = (width - containerPadding * 2 - ((numColumns - 1) * gap)) / numColumns;

  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'appointments'
  
  const styles = useMemo(() => getStyles(COLORS, isMobile), [COLORS, isMobile]);

  // Filter and sort appointments
  const myAppointments = useMemo(() => {
    return appointments
      .filter(app => app.userId === user.email)
      .sort((a, b) => {
         // Simple string comparison for date/time ISO strings or similar formats
         if (a.date !== b.date) return a.date > b.date ? 1 : -1;
         return a.time > b.time ? 1 : -1;
      });
  }, [appointments, user.email]);

  const nextAppointment = myAppointments.length > 0 ? myAppointments[0] : null; 

  const handleNewBooking = (data) => {
    onAddAppointment(data);
    setActiveTab('appointments'); // Go to appointments after booking
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <View style={styles.container}>
        
        {/* HEADER */}
        <UserHeader 
          user={user} 
          onLogout={onLogout} 
          toggleTheme={toggleTheme} 
          isDarkMode={isDarkMode} 
          COLORS={COLORS} 
          isMobile={isMobile}
        />

        {/* DASHBOARD SUMMARY & MAIN CONTENT */}
        <ScrollView style={styles.scrollView} contentContainerStyle={{flexGrow: 1}}>
            <UserSummary 
              nextAppointment={nextAppointment}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              COLORS={COLORS}
              isMobile={isMobile}
            />

            {/* MAIN CONTENT AREA */}
            <View style={styles.mainContent}>
                <View style={styles.contentHeader}>
                    <Text style={styles.contentTitle}>
                        {activeTab === 'book' ? 'Reservar Cita' : 'Historial de Citas'}
                    </Text>
                    <View style={styles.contentDivider} />
                </View>

                <View style={styles.contentContainer}>
                  {activeTab === 'book' ? (
                      <Animated.View style={[styles.bookingWrapper, { opacity: fadeAnim }]}>
                          <BookingWizard 
                              user={user} 
                              existingAppointments={appointments} 
                              onConfirm={handleNewBooking}
                              COLORS={COLORS}
                              barbers={barbers}
                          />
                      </Animated.View>
                  ) : (
                      <UserAppointments 
                        appointments={myAppointments}
                        COLORS={COLORS}
                        numColumns={numColumns}
                        gap={gap}
                        itemWidth={itemWidth}
                        fadeAnim={fadeAnim}
                        onBookNow={() => setActiveTab('book')}
                      />
                  )}
                </View>
            </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS, isMobile) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // MAIN CONTENT
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background, 
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  contentHeader: {
    paddingHorizontal: isMobile ? 20 : 40,
    paddingTop: 32,
    paddingBottom: 24,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  contentDivider: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingBottom: 40,
  },
  bookingWrapper: {
    // paddingHorizontal handled by contentContainer now for consistency
    paddingBottom: 40,
  },
});
