import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import config from '../config/config';
import AuthService from '../services/AuthService';
import { useData } from '../context/DataContext';

export default function LoadingScreen({ onLoadingComplete, onNavigateToLogin }) {
  const { setAppData } = useData();
  const [loadingSteps, setLoadingSteps] = useState([
    { name: 'Checking Authentication', completed: false },
    { name: 'Loading User Data', completed: false },
    { name: 'Loading Shop Items', completed: false },
    { name: 'Loading User Skins', completed: false },
    { name: 'Initializing Game', completed: false }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setUserData] = useState(null);
  const [, setShopData] = useState(null);
  const [, setUserSkins] = useState(['default']);

  // Animation values
  const boxAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  const numberAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  const greenAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  const textAnimation = useRef(new Animated.Value(0)).current;
  const [displayNumbers, setDisplayNumbers] = useState([1, 2, 3, 4, 5]);

  useEffect(() => {
    startLoadingSequence();
  }, []);

  const startLoadingSequence = async () => {
    await animateBoxes();
    await performLoadingSteps();
  };

  const animateBoxes = async () => {
    const animations = boxAnimations.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: 0,
        useNativeDriver: true,
      })
    );

    await Promise.all(animations.map(anim => new Promise(resolve => anim.start(resolve))));
  };

  const createSlotMachineAnimation = (boxIndex) => {
    return new Promise(resolve => {
      let isRunning = true;

      const animateCycle = () => {
        if (!isRunning) return;

        const randomNum = Math.floor(Math.random() * 9) + 1;
        
        setDisplayNumbers(prev => {
          const newNumbers = [...prev];
          newNumbers[boxIndex] = randomNum;
          return newNumbers;
        });

        Animated.timing(numberAnimations[boxIndex], {
          toValue: 2,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          numberAnimations[boxIndex].setValue(0);
          if (isRunning) {
            setTimeout(animateCycle, 5);
          }
        });
      };

      animateCycle();
      
      const animationRef = { 
        isRunning, 
        stop: () => { isRunning = false; } 
      };
      
      resolve(animationRef);
    });
  };

  const animateSlotMachineNumbers = async () => {
    const promises = boxAnimations.map((_, index) => createSlotMachineAnimation(index));
    return await Promise.all(promises);
  };

  const performLoadingSteps = async () => {
    try {
      const runningAnimations = await animateSlotMachineNumbers();
      
      // Step 1: Check Authentication
      const isAuthenticated = await AuthService.initialize();
      await updateStep(0, true, runningAnimations[0]);

      if (isAuthenticated) {
        // Step 2: Load User Data
        const currentUser = AuthService.getCurrentUser();
        setUserData(currentUser);
        await updateStep(1, true, runningAnimations[1]);

        // Step 3: Load Shop Items
        const shopItems = await fetchShopItems();
        setShopData(shopItems);
        await updateStep(2, true, runningAnimations[2]);

        // Extract theme skins from shop items
        const themeSkins = extractThemeSkins(shopItems);
        console.log('Extracted theme skins:', themeSkins);

        // Step 4: Load User Skins
        const skins = await fetchUserSkins();
        setUserSkins(skins);
        await updateStep(3, true, runningAnimations[3]);

        // Step 5: Initialize Game
        await updateStep(4, true, runningAnimations[4]);

        // Store data and complete
        setAppData({ user: currentUser, shop: shopItems, skins: skins, themeSkins: themeSkins });
        await new Promise(resolve => setTimeout(resolve, 500));
        onLoadingComplete({ user: currentUser, shop: shopItems, skins: skins, themeSkins: themeSkins });
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        await updateStep(4, true, runningAnimations[4]);
        onNavigateToLogin();
      }
    } catch (error) {
      console.error('Loading error:', error);
      await new Promise(resolve => setTimeout(resolve, 500));
      await updateStep(4, true, null);
      onNavigateToLogin();
    }
  };

  const updateStep = async (stepIndex, completed, runningAnimation) => {
    setLoadingSteps(prev =>
      prev.map((step, index) =>
        index === stepIndex ? { ...step, completed } : step
      )
    );

    if (completed && runningAnimation) {
      runningAnimation.stop();
      
      setDisplayNumbers(prev => {
        const newNumbers = [...prev];
        newNumbers[stepIndex] = Math.floor(Math.random() * 9) + 1;
        return newNumbers;
      });
      
      await Promise.all([
        // Number settling animation
        new Promise(resolve => {
          numberAnimations[stepIndex].setValue(0);
          Animated.timing(numberAnimations[stepIndex], {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start(resolve);
        }),
        // Green box animation
        new Promise(resolve => {
          Animated.timing(greenAnimations[stepIndex], {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start(resolve);
        }),
        // Text transition animation
        new Promise(resolve => {
          Animated.timing(textAnimation, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setCurrentStep(stepIndex + 1);
            Animated.timing(textAnimation, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }).start(resolve);
          });
        })
      ]);
    }
  };

  const extractThemeSkins = (shopItems) => {
    const themeSkins = {};
    
    try {
      // Look for Theme category in shop items
      if (shopItems['Theme'] && Array.isArray(shopItems['Theme'])) {
        shopItems['Theme'].forEach(item => {
          // Extract the theme name and create a normalized key
          const themeName = item.name;
          const normalizedKey = themeName.toLowerCase().replace(/[^a-z]/g, '');
          
          // Store the theme with its original name and image data (Base64 or asset reference)
          themeSkins[normalizedKey] = {
            name: themeName,
            imageData: item.imageData || null,        // Base64 encoded image
            imageAsset: item.imageAsset || null,      // Local asset reference
            imageUrl: item.imageUrl || null,          // Fallback to URL if needed
            description: item.description || '',
            category: item.category || 'Theme'
          };
        });
      }
      
      // Always include default theme
      themeSkins['default'] = {
        name: 'Default Theme',
        imageData: null,
        imageAsset: null,
        imageUrl: null,
        description: 'Default input box style',
        category: 'Theme'
      };
      
      console.log('Extracted theme skins:', themeSkins);
      return themeSkins;
    } catch (error) {
      console.error('Error extracting theme skins:', error);
      return { default: { name: 'Default Theme', imageData: null, imageAsset: null, imageUrl: null, description: 'Default input box style', category: 'Theme' } };
    }
  };

  const fetchShopItems = async () => {
    try {
      const token = AuthService.getToken();
      if (!token) return {};

      const response = await fetch(`${config.API_BASE_URL}/shop/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.categories || {};
      }
      return {};
    } catch (error) {
      console.error('Error fetching shop items:', error);
      return {};
    }
  };

  const fetchUserSkins = async () => {
    try {
      const token = AuthService.getToken();
      if (!token) return ['default'];

      const response = await fetch(`${config.API_BASE_URL}/shop/my-skins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.availableSkins || ['default'];
      }
      return ['default'];
    } catch (error) {
      console.error('Error fetching user skins:', error);
      return ['default'];
    }
  };

  const renderInputBox = (index) => {
    return (
      <View key={index} style={styles.inputBoxContainer}>
        <Animated.View
          style={[
            styles.inputBox,
            {
              opacity: boxAnimations[index],
              transform: [{
                scale: boxAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1]
                })
              }],
              backgroundColor: greenAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(76, 175, 80, 0.8)']
              }),
              borderColor: greenAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: ['#4a90e2', '#4caf50']
              })
            }
          ]}
        >
          <Animated.Text
            style={[
              styles.inputBoxNumber,
              {
                transform: [{
                  translateY: numberAnimations[index].interpolate({
                    inputRange: [0, 2],
                    outputRange: [-60, 60]
                  })
                }]
              }
            ]}
          >
            {displayNumbers[index]}
          </Animated.Text>
        </Animated.View>
      </View>
    );
  };

  const getCurrentStepText = () => {
    if (currentStep < loadingSteps.length) {
      return loadingSteps[currentStep]?.name || 'Loading...';
    }
    return 'Complete!';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={styles.gradientBackground}
      >
        <View style={styles.content}>
          <Text style={styles.title}>NumberMind</Text>

          <View style={styles.loadingContainer}>
            {renderInputBox(0)}
            {renderInputBox(1)}
            {renderInputBox(2)}
            {renderInputBox(3)}
            {renderInputBox(4)}
          </View>

          <Animated.Text
            style={[
              styles.stepText,
              {
                opacity: textAnimation,
                transform: [{
                  translateY: textAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0]
                  })
                }]
              }
            ]}
          >
            {getCurrentStepText()}
          </Animated.Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 60,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  inputBoxContainer: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  inputBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  inputBoxNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    minHeight: 30,
  },
});
