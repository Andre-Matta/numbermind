import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';

export default function NumberInput({ value, onChangeText, placeholder, maxLength, style }) {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6c757d"
        maxLength={maxLength}
        keyboardType="numeric"
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {maxLength && (
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600',
  },
  counter: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
    color: '#6c757d',
    fontSize: 12,
    fontWeight: '500',
  },
}); 