import { Animated } from 'react-native';

// Common game utility functions

export const calculateFeedback = (guess, secretNumber, mode) => {
  let exact = 0;
  let misplaced = 0;
  let outOfPlace = 0;
  let totalCorrect = 0;

  // Count exact matches
  for (let i = 0; i < 5; i++) {
    if (guess[i] === secretNumber[i]) {
      exact++;
    }
  }

  // Count total correct digits
  const guessDigits = guess.split('');
  const secretDigits = secretNumber.split('');

  for (let digit of guessDigits) {
    if (secretDigits.includes(digit)) {
      totalCorrect++;
    }
  }

  // In hard mode, only show total correct to user, but keep exact for win checking
  if (mode === 'hard') {
    return { exact, misplaced: 0, outOfPlace: 0, totalCorrect };
  }

  // In standard mode, show exact, misplaced, and out of place
  misplaced = totalCorrect - exact;
  outOfPlace = 5 - totalCorrect;
  return { exact, misplaced, outOfPlace, totalCorrect };
};

export const getThemeStyle = (theme, availableThemes) => {
  if (!theme || !availableThemes[theme]) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: '#4a90e2',
      borderWidth: 2,
    };
  }

  // If theme has any type of image, return style for image background
  if (availableThemes[theme].imageData || availableThemes[theme].imageAsset || availableThemes[theme].imageUrl) {
    return {
      backgroundColor: 'transparent',
      borderColor: '#4a90e2',
      borderWidth: 2,
    };
  }

  // Fallback to default style if no image
  return {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#4a90e2',
    borderWidth: 2,
  };
};

export const getThemePreviewStyle = (theme, availableThemes) => {
  if (!theme || !availableThemes[theme]) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: '#4a90e2',
      borderWidth: 2,
    };
  }

  // If theme has any type of image, return style for image background
  if (availableThemes[theme].imageData || availableThemes[theme].imageAsset || availableThemes[theme].imageUrl) {
    return {
      backgroundColor: 'transparent',
      borderColor: '#4a90e2',
      borderWidth: 2,
    };
  }

  // Fallback to default style if no image
  return {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#4a90e2',
    borderWidth: 2,
  };
};

export const getThemeImageSource = (theme) => {
  if (theme?.imageData) {
    return { uri: theme.imageData }; // Base64 data URI
  } else if (theme?.imageAsset) {
    return theme.imageAsset; // Local asset reference
  } else if (theme?.imageUrl) {
    return { uri: theme.imageUrl }; // External URL
  }
  return null; // No image available
}

export const createBoxAnimations = () => [
  new Animated.Value(1),
  new Animated.Value(1),
  new Animated.Value(1),
  new Animated.Value(1),
  new Animated.Value(1),
];
