import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import config from '../config/config';
import AuthService from '../services/AuthService';
import { useData } from '../context/DataContext';
import {
  scale,
  verticalScale,
  getResponsivePadding,
  getResponsiveFontSize,
  getResponsiveButtonSize,
  responsiveWidth,
  responsiveHeight,
  spacing,
  borderRadius,
  getScreenDimensions
} from '../utils/responsiveUtils';

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
  
  // Add timeout refs to prevent hanging
  const timeoutRefs = useRef([]);
  const animationRefs = useRef([]);

  useEffect(() => {
    startLoadingSequence();
    
    // Add a global timeout to prevent the loading screen from getting stuck
    const globalTimeout = setTimeout(() => {
      console.log('Global timeout reached, forcing navigation to login');
      onNavigateToLogin();
    }, 30000); // 30 second global timeout
    
    // Cleanup function to clear timeouts and stop animations
    return () => {
      clearTimeout(globalTimeout);
      timeoutRefs.current.forEach(ref => clearTimeout(ref));
      animationRefs.current.forEach(ref => {
        if (ref && ref.stop) ref.stop();
      });
    };
  }, []);

  const startLoadingSequence = async () => {
    try {
      await animateBoxes();
      await performLoadingSteps();
    } catch (error) {
      console.error('Loading sequence error:', error);
      // Fallback: complete loading after delay
      setTimeout(() => {
        onNavigateToLogin();
      }, 1000);
    }
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
      let animationCount = 0;
      const maxAnimations = 20; // Limit animations to prevent infinite loops

      const animateCycle = () => {
        if (!isRunning || animationCount >= maxAnimations) {
          isRunning = false;
          return;
        }

        animationCount++;
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
          if (isRunning && animationCount < maxAnimations) {
            const timeoutRef = setTimeout(animateCycle, 50);
            timeoutRefs.current.push(timeoutRef);
          }
        });
      };

      animateCycle();
      
      const animationRef = { 
        isRunning, 
        stop: () => { 
          isRunning = false; 
        } 
      };
      
      animationRefs.current.push(animationRef);
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
      console.log('Step 1: Checking Authentication...');
      const isAuthenticated = await AuthService.initialize();
      await updateStep(0, true, runningAnimations[0]);

      if (isAuthenticated) {
        // Step 2: Load User Data
        console.log('Step 2: Loading User Data...');
        const currentUser = AuthService.getCurrentUser();
        setUserData(currentUser);
        await updateStep(1, true, runningAnimations[1]);

        // Step 3: Load Shop Items
        console.log('Step 3: Loading Shop Items...');
        const shopItems = await fetchShopItems();
        setShopData(shopItems);
        await updateStep(2, true, runningAnimations[2]);

        // Extract theme skins from shop items
        const themeSkins = extractThemeSkins(shopItems);
        const skinNames = Object.values(themeSkins).map(skin => skin.name);
        console.log('Extracted theme skin names:', skinNames);

        // Step 4: Load User Skins
        console.log('Step 4: Loading User Skins...');
        const skins = await fetchUserSkins();
        setUserSkins(skins);
        await updateStep(3, true, runningAnimations[3]);

        // Step 5: Initialize Game
        console.log('Step 5: Initializing Game...');
        await updateStep(4, true, runningAnimations[4]);

        // Store data and complete
        setAppData({ user: currentUser, shop: shopItems, skins: skins, themeSkins: themeSkins });
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Loading complete, calling onLoadingComplete');
        onLoadingComplete({ user: currentUser, shop: shopItems, skins: skins, themeSkins: themeSkins });
      } else {
        console.log('User not authenticated, navigating to login');
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
    console.log(`Updating step ${stepIndex}, completed: ${completed}`);
    
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
      
      return themeSkins;
    } catch (error) {
      console.error('Error extracting theme skins:', error);
      return { default: { name: 'Default Theme', imageData: null, imageAsset: null, imageUrl: null, description: 'Default input box style', category: 'Theme' } };
    }
  };

  const fetchShopItems = async () => {
    try {
      const token = AuthService.getToken();
      if (!token) {
        console.log('No token available, returning empty shop data');
        return {};
      }

      console.log('Fetching shop items...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${config.API_BASE_URL}/shop/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('Shop items fetched successfully');
        return data.categories || {};
      }
      console.log('Shop fetch response not ok:', response.status);
      return {};
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Shop fetch timeout after 10 seconds');
      } else {
        console.error('Error fetching shop items:', error);
      }
      return {};
    }
  };

  const fetchUserSkins = async () => {
    try {
      const token = AuthService.getToken();
      if (!token) {
        console.log('No token available, returning default skins');
        return ['default'];
      }

      console.log('Fetching user skins...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${config.API_BASE_URL}/shop/my-skins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('User skins fetched successfully');
        return data.availableSkins || ['default'];
      }
      console.log('User skins fetch response not ok:', response.status);
      return ['default'];
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('User skins fetch timeout after 10 seconds');
      } else {
        console.error('Error fetching user skins:', error);
      }
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
    paddingHorizontal: getResponsivePadding(20),
    width: '100%',
  },
  title: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: verticalScale(30),
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(25),
    paddingHorizontal: getResponsivePadding(8),
  },
  inputBoxContainer: {
    alignItems: 'center',
    marginHorizontal: scale(2),
  },
  inputBox: {
    width: scale(28),
    height: scale(28),
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  inputBoxNumber: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    fontSize: getResponsiveFontSize(14),
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    minHeight: verticalScale(20),
    paddingHorizontal: getResponsivePadding(12),
  },
});
