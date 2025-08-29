import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (using iPhone 12 Pro as reference)
const baseWidth = 390;
const baseHeight = 844;

// Responsive scaling functions
export const scale = (size) => {
  const newSize = (screenWidth / baseWidth) * size;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

export const verticalScale = (size) => {
  const newSize = (screenHeight / baseHeight) * size;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Screen size breakpoints
export const isSmallDevice = screenWidth < 375;
export const isMediumDevice = screenWidth >= 375 && screenWidth < 414;
export const isLargeDevice = screenWidth >= 414 && screenWidth < 768;
export const isTablet = screenWidth >= 768;

// Responsive dimensions
export const responsiveWidth = (percentage) => {
  return (screenWidth * percentage) / 100;
};

export const responsiveHeight = (percentage) => {
  return (screenHeight * percentage) / 100;
};

// Dynamic padding and margins
export const getResponsivePadding = (basePadding) => {
  if (isSmallDevice) return basePadding * 0.8;
  if (isMediumDevice) return basePadding;
  if (isLargeDevice) return basePadding * 1.1;
  if (isTablet) return basePadding * 1.3;
  return basePadding;
};

export const getResponsiveMargin = (baseMargin) => {
  if (isSmallDevice) return baseMargin * 0.8;
  if (isMediumDevice) return baseMargin;
  if (isLargeDevice) return baseMargin * 1.1;
  if (isTablet) return baseMargin * 1.3;
  return baseMargin;
};

// Font size scaling
export const getResponsiveFontSize = (baseSize) => {
  if (isSmallDevice) return scale(baseSize * 0.9);
  if (isMediumDevice) return scale(baseSize);
  if (isLargeDevice) return scale(baseSize * 1.05);
  if (isTablet) return scale(baseSize * 1.1);
  return scale(baseSize);
};

// Button sizing
export const getResponsiveButtonSize = (baseSize) => {
  if (isSmallDevice) return baseSize * 0.9;
  if (isMediumDevice) return baseSize;
  if (isLargeDevice) return baseSize * 1.05;
  if (isTablet) return baseSize * 1.2;
  return baseSize;
};

// Container sizing
export const getResponsiveContainerWidth = (percentage) => {
  let containerPercentage = percentage;
  if (isSmallDevice) containerPercentage = Math.min(percentage + 5, 95);
  if (isTablet) containerPercentage = Math.min(percentage - 10, 80);
  return responsiveWidth(containerPercentage);
};

// Safe area handling
export const getSafeAreaPadding = (basePadding) => {
  const safePadding = Platform.OS === 'ios' ? 44 : 24;
  return basePadding + safePadding;
};

// Orientation-aware dimensions
export const isPortrait = () => screenHeight > screenWidth;
export const isLandscape = () => screenWidth > screenHeight;

// Get current screen dimensions
export const getScreenDimensions = () => ({
  width: screenWidth,
  height: screenHeight,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  isPortrait: isPortrait(),
  isLandscape: isLandscape(),
});

// Responsive spacing system
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

// Responsive border radius
export const borderRadius = {
  sm: scale(4),
  md: scale(8),
  lg: scale(16),
  xl: scale(24),
  xxl: scale(32),
  round: scale(50),
};

// Get device type based on screen width
export const getDeviceType = () => {
  if (screenWidth < 768) return 'mobile';
  if (screenWidth < 1024) return 'tablet';
  return 'desktop';
};

// Hook for responsive values based on device type
export const useResponsiveValue = (values) => {
  const deviceType = getDeviceType();
  
  if (typeof values === 'object' && values !== null) {
    // If it's an object with device-specific values
    if (values[deviceType] !== undefined) {
      return scale(values[deviceType]);
    }
    // Fallback to mobile if deviceType not found
    if (values.mobile !== undefined) {
      return scale(values.mobile);
    }
    // If it's just a number, scale it
    if (typeof values === 'number') {
      return scale(values);
    }
  }
  
  // If it's a direct number, scale it
  if (typeof values === 'number') {
    return scale(values);
  }
  
  // Default fallback
  return scale(16);
};