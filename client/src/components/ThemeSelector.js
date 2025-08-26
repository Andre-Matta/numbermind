import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ThemeSelector({
  visible,
  onClose,
  selectedTheme,
  onThemeSelect,
  availableThemes,
  getThemePreviewStyle,
  getThemeImageSource,
  title = 'Input Box Style',
}) {
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <TouchableOpacity
        style={styles.popup}
        activeOpacity={1}
        onPress={(e) => e.stopPropagation()}
      >
        <View style={styles.header}>
          <Text style={styles.popupTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.themeGrid}>
            {Object.keys(availableThemes).reduce((rows, themeKey, index) => {
              const rowIndex = Math.floor(index / 3);
              if (!rows[rowIndex]) {
                rows[rowIndex] = [];
              }
              rows[rowIndex].push(
                <TouchableOpacity
                  key={themeKey}
                  style={[
                    styles.themeOption,
                    selectedTheme === themeKey && styles.themeOptionSelected
                  ]}
                  onPress={() => {
                    onThemeSelect(themeKey);
                  }}
                >
                  <View style={[
                    styles.themeOptionPreview,
                    getThemePreviewStyle ? getThemePreviewStyle(themeKey) : styles.themePreviewDefault
                  ]}>
                    {getThemeImageSource && getThemeImageSource(availableThemes[themeKey]) && (
                      <Image
                        source={getThemeImageSource(availableThemes[themeKey])}
                        style={styles.themePreviewImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                  <Text style={styles.themeOptionText}>
                    {availableThemes[themeKey].name}
                  </Text>
                </TouchableOpacity>
              );
              return rows;
            }, []).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.themeRow}>
                {row}
              </View>
            ))}
          </View>
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxWidth: 350,
    maxHeight: height * 0.6,
    borderWidth: 2,
    borderColor: '#4a90e2',
    position: 'absolute',
    bottom: '40%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  themeOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: (width) / 8,
    maxWidth: 100,
  },
  themeOptionSelected: {
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  themeOptionPreview: {
    width: 40,
    height: 40,
    marginBottom: 5,
    borderRadius: 6,
    borderWidth: 2,
  },
  themePreviewDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#4a90e2',
  },
  themePreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  themeOptionText: {
    fontSize: 12,
    color: '#fff',
  },
  themeGrid: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
});
