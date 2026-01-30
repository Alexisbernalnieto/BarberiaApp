import React from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView, Platform } from 'react-native';

export default function ResponsiveContainer({ children, maxWidth = 1200, style, scrollable = false, contentContainerStyle }) {
  const { width } = useWindowDimensions();
  
  // Calculate padding based on screen width
  const horizontalPadding = width < 768 ? 20 : 40;
  
  const containerStyles = [
    styles.container,
    { paddingHorizontal: horizontalPadding },
    style
  ];

  const contentStyles = [
    styles.content,
    { maxWidth, alignSelf: 'center', width: '100%' },
    contentContainerStyle
  ];

  if (scrollable) {
    return (
      <View style={containerStyles}>
        <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={contentStyles}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={containerStyles}>
      <View style={contentStyles}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
  }
});
