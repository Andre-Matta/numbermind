# Responsive Styling System

This document explains how to use the responsive styling system implemented in the NumberMind app to ensure consistent layouts across different screen sizes and orientations.

## Overview

The responsive styling system provides utilities and components that automatically adapt to different screen sizes, from small phones to large tablets, and handles both portrait and landscape orientations.

## Key Features

- **Automatic scaling**: Fonts, buttons, and spacing automatically scale based on screen size
- **Safe area handling**: Proper handling of notches, status bars, and home indicators
- **Orientation awareness**: Layouts adapt to portrait and landscape modes
- **Consistent spacing**: Standardized spacing system using responsive values
- **Flexible containers**: Responsive containers that work on all screen sizes

## Responsive Utilities

### Import
```javascript
import { 
  scale, 
  verticalScale, 
  moderateScale,
  responsiveWidth, 
  responsiveHeight,
  getResponsivePadding,
  getResponsiveFontSize,
  getResponsiveButtonSize,
  getResponsiveContainerWidth,
  spacing,
  borderRadius,
  isSmallDevice,
  isTablet
} from '../utils/responsiveUtils';
```

### Core Functions

#### `scale(size)`
Scales a size value based on screen width. Use for widths, heights, and horizontal measurements.

#### `verticalScale(size)`
Scales a size value based on screen height. Use for vertical measurements.

#### `getResponsiveFontSize(baseSize)`
Returns a responsive font size that scales appropriately for the device.

#### `getResponsivePadding(basePadding)`
Returns responsive padding that adapts to screen size.

#### `getResponsiveButtonSize(baseSize)`
Returns responsive button dimensions.

#### `responsiveWidth(percentage)`
Returns a width value as a percentage of screen width.

#### `responsiveHeight(percentage)`
Returns a height value as a percentage of screen height.

### Spacing System
```javascript
import { spacing } from '../utils/responsiveUtils';

// Available spacing values:
spacing.xs   // 4px (scaled)
spacing.sm   // 8px (scaled)
spacing.md   // 16px (scaled)
spacing.lg   // 24px (scaled)
spacing.xl   // 32px (scaled)
spacing.xxl  // 48px (scaled)
```

### Border Radius System
```javascript
import { borderRadius } from '../utils/responsiveUtils';

// Available border radius values:
borderRadius.sm    // 4px (scaled)
borderRadius.md    // 8px (scaled)
borderRadius.lg    // 16px (scaled)
borderRadius.xl    // 24px (scaled)
borderRadius.xxl   // 32px (scaled)
borderRadius.round // 50px (scaled)
```

## Responsive Components

### ResponsiveWrapper
A container component that handles safe areas and responsive padding.

```javascript
import { ResponsiveWrapper } from '../components/ResponsiveWrapper';

<ResponsiveWrapper 
  scrollable={true} 
  centered={true}
  padding={20}
>
  {/* Your content */}
</ResponsiveWrapper>
```

**Props:**
- `scrollable`: Whether to make the container scrollable
- `centered`: Center content horizontally and vertically
- `fullWidth`: Remove horizontal padding
- `padding`: Base padding value (will be scaled responsively)

### ResponsiveContainer
A container that limits maximum width and centers content.

```javascript
import { ResponsiveContainer } from '../components/ResponsiveWrapper';

<ResponsiveContainer maxWidth={90}>
  {/* Your content */}
</ResponsiveContainer>
```

**Props:**
- `maxWidth`: Maximum width as percentage of screen (default: 90)
- `centered`: Center content (default: true)

### ResponsiveButton
A button component with consistent responsive styling.

```javascript
import { ResponsiveButton } from '../components/ResponsiveButton';

<ResponsiveButton
  title="Press Me"
  onPress={() => {}}
  variant="primary" // primary, secondary, danger, success
  size="medium"     // small, medium, large
  fullWidth={false}
/>
```

**Props:**
- `title`: Button text
- `variant`: Button style variant
- `size`: Button size
- `fullWidth`: Whether button should take full width
- `disabled`: Disable button
- `loading`: Show loading state

### ResponsiveText
Text components with responsive font sizes.

```javascript
import { 
  Heading1, 
  Heading2, 
  BodyText, 
  CaptionText 
} from '../components/ResponsiveText';

<Heading1>Main Title</Heading1>
<Heading2>Subtitle</Heading2>
<BodyText>Regular text content</BodyText>
<CaptionText>Small caption text</CaptionText>
```

## Best Practices

### 1. Use Responsive Utilities Instead of Fixed Values
```javascript
// ❌ Don't do this
const styles = StyleSheet.create({
  button: {
    width: 100,
    height: 50,
    padding: 20,
    fontSize: 16,
  }
});

// ✅ Do this instead
const styles = StyleSheet.create({
  button: {
    width: getResponsiveButtonSize(100),
    height: getResponsiveButtonSize(50),
    padding: getResponsivePadding(20),
    fontSize: getResponsiveFontSize(16),
  }
});
```

### 2. Use the Spacing System
```javascript
// ❌ Don't use magic numbers
marginBottom: 20,
padding: 15,

// ✅ Use spacing constants
marginBottom: spacing.lg,
padding: spacing.md,
```

### 3. Handle Different Screen Sizes
```javascript
import { isSmallDevice, isTablet } from '../utils/responsiveUtils';

const styles = StyleSheet.create({
  container: {
    padding: isSmallDevice ? 10 : 20,
    maxWidth: isTablet ? '80%' : '95%',
  }
});
```

### 4. Use Flexbox for Layouts
```javascript
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Important for small screens
    justifyContent: 'space-around',
  },
  item: {
    minWidth: responsiveWidth(25), // Ensure minimum width
    marginBottom: spacing.sm,
  }
});
```

### 5. Test on Different Devices
- Test on small phones (320px width)
- Test on medium phones (375px width)
- Test on large phones (414px width)
- Test on tablets (768px+ width)
- Test in both portrait and landscape

## Example Implementation

Here's a complete example of a responsive component:

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ResponsiveWrapper, ResponsiveButton, Heading2 } from '../components';
import { 
  getResponsivePadding, 
  spacing, 
  borderRadius 
} from '../utils/responsiveUtils';

export const ExampleScreen = () => {
  return (
    <ResponsiveWrapper scrollable centered>
      <View style={styles.container}>
        <Heading2>Welcome to NumberMind</Heading2>
        
        <View style={styles.buttonContainer}>
          <ResponsiveButton
            title="Start Game"
            onPress={() => {}}
            variant="primary"
            size="large"
            fullWidth
          />
          
          <ResponsiveButton
            title="Settings"
            onPress={() => {}}
            variant="secondary"
            size="medium"
            fullWidth
          />
        </View>
      </View>
    </ResponsiveWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '90%',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
```

## Migration Guide

To update existing components to use the responsive system:

1. **Import responsive utilities**
2. **Replace fixed dimensions** with responsive functions
3. **Use spacing constants** instead of magic numbers
4. **Add flexWrap** to row layouts for small screens
5. **Test on different screen sizes**

## Troubleshooting

### Common Issues

1. **Text too small on large screens**: Use `getResponsiveFontSize()` instead of fixed font sizes
2. **Buttons too large on small screens**: Use `getResponsiveButtonSize()` and set appropriate max widths
3. **Layout breaks on small screens**: Add `flexWrap: 'wrap'` to row containers
4. **Content goes off screen**: Use `getResponsiveContainerWidth()` to limit container widths

### Performance Notes

- Responsive calculations are done once at component mount
- No performance impact during rendering
- All utilities are memoized for efficiency

## Support

For questions or issues with the responsive styling system, refer to this documentation or check the component implementations in the `src/components/` directory.
