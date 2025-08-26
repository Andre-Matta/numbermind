import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function GameInput({
  currentInput,
  onInputChange,
  onDelete,
  onClear,
  onSubmit,
  submitDisabled,
  submitText = 'Submit',
  submitLoading = false,
  boxAnimations,
  selectedTheme,
  availableThemes,
  getThemeStyle,
  getThemeImageSource,
  getThemePreviewStyle,
  isSecret = false,
}) {
  const handleNumberPress = (number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Find the first empty position
    const emptyIndex = currentInput.findIndex(digit => digit === '');
    if (emptyIndex !== -1) {
      const newInput = [...currentInput];
      newInput[emptyIndex] = number.toString();
      onInputChange(newInput);

      // Animate the box if animations are provided
      if (boxAnimations && boxAnimations[emptyIndex]) {
        Animated.sequence([
          Animated.timing(boxAnimations[emptyIndex], {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(boxAnimations[emptyIndex], {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Find the last filled position
    const lastFilledIndex = currentInput.findLastIndex(digit => digit !== '');
    if (lastFilledIndex !== -1) {
      const newInput = [...currentInput];
      newInput[lastFilledIndex] = '';
      onInputChange(newInput);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onInputChange(['', '', '', '', '']);
  };

  const renderInputBoxes = () => {
    console.log('GameInput renderInputBoxes - selectedTheme:', selectedTheme);
    console.log('GameInput renderInputBoxes - getThemeStyle:', getThemeStyle);
    console.log('GameInput renderInputBoxes - availableThemes:', availableThemes);
    
    return (
      <View style={styles.inputBoxesContainer}>
        {currentInput.map((digit, index) => (
          <View key={index} style={styles.inputBoxWrapper}>
            <Animated.View
              style={(() => {
                const baseStyle = styles.inputBoxImage;
                const themeStyle = getThemeStyle && selectedTheme ? getThemeStyle(selectedTheme) : styles.inputBoxDefault;
                const animationStyle = boxAnimations && boxAnimations[index] ? {
                  transform: [{ scale: boxAnimations[index] }]
                } : {};
                
                const finalStyle = [baseStyle, themeStyle, animationStyle];
                console.log('Final style for box', index, ':', finalStyle);
                
                return finalStyle;
              })()}
            >
            {getThemeImageSource && availableThemes && selectedTheme && getThemeImageSource(availableThemes[selectedTheme]) && (
              <Image
                source={getThemeImageSource(availableThemes[selectedTheme])}
                style={styles.themeImage}
                resizeMode="cover"
              />
            )}
            <Text style={styles.inputBoxDigit}>{digit}</Text>
          </Animated.View>
        </View>
      ))}
    </View>
  );
}

  const renderNumberButtons = () => (
    <View style={styles.numberButtonsContainer}>
      <View style={styles.numberRow}>
        {[1, 2, 3, 4, 5].map(number => (
          <TouchableOpacity
            key={number}
            style={styles.numberButton}
            onPress={() => handleNumberPress(number)}
          >
            <Text style={styles.numberButtonText}>{number}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.numberRow}>
        {[6, 7, 8, 9, 0].map(number => (
          <TouchableOpacity
            key={number}
            style={styles.numberButton}
            onPress={() => handleNumberPress(number)}
          >
            <Text style={styles.numberButtonText}>{number}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="backspace" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, submitDisabled && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={submitDisabled}
        >
          <Text style={styles.submitButtonText}>{submitText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderInputBoxes()}
      {renderNumberButtons()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      padding: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 15,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  inputBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    width: '100%',
  },
  inputBoxWrapper: {
    marginHorizontal: 5,
    alignItems: 'center',
  },
  inputBoxImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#4a90e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  inputBoxDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#4a90e2',
  },
  themeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  inputBoxDigit: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  numberButtonsContainer: {
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  numberButton: {
    width: (width - 60) / 5,
    height: 50,
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  numberButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 5,
  },
  deleteButton: {
    width: (width - 80) / 4,
    height: 50,
    backgroundColor: '#dc3545',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c82333',
  },
  clearButton: {
    width: (width - 80) / 4,
    height: 50,
    backgroundColor: '#ffc107',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0a800',
  },
  autoFillButton: {
    width: (width - 80) / 4,
    height: 50,
    backgroundColor: '#17a2b8',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#138496',
  },
  autoFillButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  submitButton: {
    width: (width - 80) / 4,
    height: 50,
    backgroundColor: '#28a745',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e7e34',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
});
