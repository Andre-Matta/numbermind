import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  getResponsivePadding,
  getResponsiveContainerWidth,
  spacing
} from '../utils/responsiveUtils';

export const ResponsiveWrapper = ({ 
  children, 
  scrollable = false, 
  centered = false,
  fullWidth = false,
  padding = 20,
  style,
  contentContainerStyle,
  ...props 
}) => {
  const insets = useSafeAreaInsets();
  
  const containerStyle = [
    styles.container,
    {
      paddingTop: insets.top + getResponsivePadding(padding),
      paddingBottom: insets.bottom + getResponsivePadding(padding),
      paddingHorizontal: fullWidth ? 0 : getResponsivePadding(padding),
    },
    centered && styles.centered,
    style,
  ];

  const scrollContentStyle = [
    styles.scrollContent,
    {
      paddingHorizontal: fullWidth ? 0 : getResponsivePadding(padding),
    },
    centered && styles.centered,
    contentContainerStyle,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
};

export const ResponsiveContainer = ({ 
  children, 
  maxWidth = 90,
  centered = true,
  style,
  ...props 
}) => {
  return (
    <View
      style={[
        styles.responsiveContainer,
        {
          maxWidth: getResponsiveContainerWidth(maxWidth),
        },
        centered && styles.centered,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export const ResponsiveCard = ({ 
  children, 
  padding = 20,
  margin = 10,
  style,
  ...props 
}) => {
  return (
    <View
      style={[
        styles.card,
        {
          padding: getResponsivePadding(padding),
          margin: getResponsivePadding(margin),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
