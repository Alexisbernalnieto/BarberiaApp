import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

/**
 * Responsive Grid Component
 * 
 * @param {React.ReactNode} children - Grid items
 * @param {number} columns - Number of columns (default: auto-calculated)
 * @param {number} spacing - Gap between items (default: 20)
 * @param {Object} breakpoints - Custom column counts for different widths { sm: 1, md: 2, lg: 3, xl: 4 }
 */
export default function Grid({ 
  children, 
  columns, 
  spacing = 20, 
  breakpoints = { sm: 1, md: 2, lg: 3, xl: 4 },
  style 
}) {
  const { width } = useWindowDimensions();
  
  // Calculate columns if not explicitly provided
  let numColumns = columns;
  if (!numColumns) {
    if (width < 768) numColumns = breakpoints.sm;
    else if (width < 1024) numColumns = breakpoints.md;
    else if (width < 1280) numColumns = breakpoints.lg;
    else numColumns = breakpoints.xl;
  }

  // Convert children to array and filter nulls
  const items = React.Children.toArray(children).filter(Boolean);
  
  // Strategy: Use negative margin on container and padding on items to create gaps
  
  return (
    <View style={[styles.container, { margin: -spacing / 2 }, style]}>
      {items.map((child, index) => (
        <View 
          key={index} 
          style={{ 
            width: `${100 / numColumns}%`, 
            padding: spacing / 2 
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
});
