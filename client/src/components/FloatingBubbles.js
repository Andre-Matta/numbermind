import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Dimensions, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

const FloatingBubbles = () => {
  const [bubbles, setBubbles] = useState([]);
  const animationRef = useRef(null);
  const bubbleCounter = useRef(0);

  const createNewBubble = () => {
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y, direction;
    
    switch (side) {
      case 0: // top
        x = Math.random() * width;
        y = -50;
        direction = Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2; // Downward with some randomness
        break;
      case 1: // right
        x = width + 50;
        y = Math.random() * height;
        direction = Math.PI + (Math.random() - 0.5) * Math.PI / 2; // Leftward with some randomness
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + 50;
        direction = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2; // Upward with some randomness
        break;
      case 3: // left
        x = -50;
        y = Math.random() * height;
        direction = (Math.random() - 0.5) * Math.PI / 2; // Rightward with some randomness
        break;
    }
    
    return {
      id: bubbleCounter.current++,
      x: x,
      y: y,
      size: Math.random() * 40 + 30,
      speed: Math.random() * 0.8 + 0.3,
      direction: direction,
      content: Math.random() > 0.5 ? Math.floor(Math.random() * 10).toString() : '?',
    };
  };

  useEffect(() => {
    // Create initial bubbles
    const initialBubbles = [];
    for (let i = 0; i < 20; i++) {
      initialBubbles.push(createNewBubble());
    }
    setBubbles(initialBubbles);

    // Start animation
    const animate = () => {
      setBubbles(prevBubbles => {
        let newBubbles = prevBubbles.map(bubble => {
          const newX = bubble.x + Math.cos(bubble.direction) * bubble.speed;
          const newY = bubble.y + Math.sin(bubble.direction) * bubble.speed;
          
          return {
            ...bubble,
            x: newX,
            y: newY,
          };
        });
        
        // Remove bubbles that have exited the screen
        newBubbles = newBubbles.filter(bubble => 
          bubble.x > -100 && 
          bubble.x < width + 100 && 
          bubble.y > -100 && 
          bubble.y < height + 100
        );
        
        // Add new bubbles to maintain count
        while (newBubbles.length < 20) {
          newBubbles.push(createNewBubble());
        }
        
        return newBubbles;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (bubbles.length === 0) {
    return null;
  }

  return (
    <View style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      zIndex: -1,
    }}>
      {bubbles.map((bubble) => (
        <View
          key={`bubble-${bubble.id}`}
          style={{
            position: 'absolute',
            left: bubble.x,
            top: bubble.y,
            width: bubble.size,
            height: bubble.size,
            zIndex: -1,
          }}
        >
          {/* Custom Bubble.png Image */}
          <Image
            source={require('../../assets/Bubble.png')}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'contain',
            }}
            onError={() => {
              // If image fails, we'll keep the current fallback design
              console.log('Bubble image failed to load, using fallback design');
            }}
          />
          
          {/* Content (Number or Question Mark) Overlay */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: bubble.size * 0.4,
                fontWeight: 'bold',
                color: '#fff',
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
            }}
            >
              {bubble.content}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default FloatingBubbles;
