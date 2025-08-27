import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { 
  getResponsivePadding,
  getResponsiveFontSize,
  getResponsiveButtonSize,
  spacing,
  borderRadius
} from '../utils/responsiveUtils';

export const ResponsiveButton = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, danger, success
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  children,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    if (variant === 'primary') baseStyle.push(styles.primary);
    else if (variant === 'secondary') baseStyle.push(styles.secondary);
    else if (variant === 'danger') baseStyle.push(styles.danger);
    else if (variant === 'success') baseStyle.push(styles.success);
    
    if (fullWidth) baseStyle.push(styles.fullWidth);
    if (disabled) baseStyle.push(styles.disabled);
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.text, styles[`${size}Text`]];
    
    if (variant === 'secondary') baseTextStyle.push(styles.secondaryText);
    if (disabled) baseTextStyle.push(styles.disabledText);
    
    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'secondary' ? '#4a90e2' : '#fff'} 
          size="small" 
        />
      ) : (
        <>
          {children}
          {title && (
            <Text style={[getTextStyle(), textStyle]}>
              {title}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minWidth: getResponsiveButtonSize(120),
  },
  
  // Size variants
  small: {
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(8),
    minHeight: getResponsiveButtonSize(36),
  },
  medium: {
    paddingHorizontal: getResponsivePadding(24),
    paddingVertical: getResponsivePadding(12),
    minHeight: getResponsiveButtonSize(48),
  },
  large: {
    paddingHorizontal: getResponsivePadding(32),
    paddingVertical: getResponsivePadding(16),
    minHeight: getResponsiveButtonSize(56),
  },
  
  // Color variants
  primary: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  danger: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  success: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  
  // Text styles
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallText: {
    fontSize: getResponsiveFontSize(14),
  },
  mediumText: {
    fontSize: getResponsiveFontSize(16),
  },
  largeText: {
    fontSize: getResponsiveFontSize(18),
  },
  
  // State variants
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  
  // Text color variants
  secondaryText: {
    color: '#4a90e2',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

// Default text colors for non-secondary variants
styles.primaryText = { color: '#fff' };
styles.dangerText = { color: '#fff' };
styles.successText = { color: '#fff' };
