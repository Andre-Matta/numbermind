import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { 
  getResponsiveFontSize,
  spacing
} from '../utils/responsiveUtils';

export const ResponsiveText = ({
  children,
  variant = 'body', // heading1, heading2, heading3, body, caption, small
  color = '#fff',
  align = 'left',
  weight = 'normal',
  style,
  ...props
}) => {
  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[variant]];
    
    return [
      baseStyle,
      {
        color,
        textAlign: align,
        fontWeight: weight,
      },
      style,
    ];
  };

  return (
    <Text style={getTextStyle()} {...props}>
      {children}
    </Text>
  );
};

export const Heading1 = ({ children, style, ...props }) => (
  <ResponsiveText variant="heading1" style={style} {...props}>
    {children}
  </ResponsiveText>
);

export const Heading2 = ({ children, style, ...props }) => (
  <ResponsiveText variant="heading2" style={style} {...props}>
    {children}
  </ResponsiveText>
);

export const Heading3 = ({ children, style, ...props }) => (
  <ResponsiveText variant="heading3" style={style} {...props}>
    {children}
  </ResponsiveText>
);

export const BodyText = ({ children, style, ...props }) => (
  <ResponsiveText variant="body" style={style} {...props}>
    {children}
  </ResponsiveText>
);

export const CaptionText = ({ children, style, ...props }) => (
  <ResponsiveText variant="caption" style={style} {...props}>
    {children}
  </ResponsiveText>
);

export const SmallText = ({ children, style, ...props }) => (
  <ResponsiveText variant="small" style={style} {...props}>
    {children}
  </ResponsiveText>
);

const styles = StyleSheet.create({
  text: {
    color: '#fff',
  },
  
  // Heading variants
  heading1: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: 'bold',
    marginBottom: spacing.md,
    lineHeight: getResponsiveFontSize(40),
  },
  heading2: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    lineHeight: getResponsiveFontSize(32),
  },
  heading3: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: '600',
    marginBottom: spacing.sm,
    lineHeight: getResponsiveFontSize(28),
  },
  
  // Body variants
  body: {
    fontSize: getResponsiveFontSize(16),
    lineHeight: getResponsiveFontSize(24),
    marginBottom: spacing.xs,
  },
  caption: {
    fontSize: getResponsiveFontSize(14),
    lineHeight: getResponsiveFontSize(20),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  small: {
    fontSize: getResponsiveFontSize(12),
    lineHeight: getResponsiveFontSize(16),
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
