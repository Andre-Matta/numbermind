import React from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { scale } from '../utils/responsiveUtils';

const { width, height } = Dimensions.get('window');
const EDGE_WIDTH = scale(30); // Width of edge zones to block

const EdgeGestureBlocker = ({ children }) => {
  // Create PanResponder for left edge
  const leftEdgePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      const { locationX } = evt.nativeEvent;
      return locationX <= EDGE_WIDTH; // Only respond if touch is in edge zone
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const { locationX } = evt.nativeEvent;
      return locationX <= EDGE_WIDTH && Math.abs(gestureState.dx) > 5;
    },
    onPanResponderGrant: (evt, gestureState) => {
      console.log('Blocking left edge gesture');
      // Block the gesture by claiming it
      return true;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Prevent the gesture from propagating
      return true;
    },
    onPanResponderRelease: () => {
      // Gesture completed, do nothing (blocked)
      return true;
    },
  });

  // Create PanResponder for right edge
  const rightEdgePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      const { locationX } = evt.nativeEvent;
      return locationX >= width - EDGE_WIDTH; // Only respond if touch is in edge zone
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const { locationX } = evt.nativeEvent;
      return locationX >= width - EDGE_WIDTH && Math.abs(gestureState.dx) > 5;
    },
    onPanResponderGrant: (evt, gestureState) => {
      console.log('Blocking right edge gesture');
      // Block the gesture by claiming it
      return true;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Prevent the gesture from propagating
      return true;
    },
    onPanResponderRelease: () => {
      // Gesture completed, do nothing (blocked)
      return true;
    },
  });

  return (
    <View style={styles.container}>
      {/* Left edge blocker */}
      <View 
        style={[styles.edgeZone, styles.leftEdge]} 
        {...leftEdgePanResponder.panHandlers}
      />

      {/* Right edge blocker */}
      <View 
        style={[styles.edgeZone, styles.rightEdge]} 
        {...rightEdgePanResponder.panHandlers}
      />

      {/* Main content */}
      <View style={styles.mainContent}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  edgeZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  leftEdge: {
    left: 0,
  },
  rightEdge: {
    right: 0,
  },
  mainContent: {
    flex: 1,
    zIndex: 1,
  },
});

export default EdgeGestureBlocker;
