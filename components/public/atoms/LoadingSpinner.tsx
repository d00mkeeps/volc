import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export const LoadingSpinner = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.7,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();

    return () => {
      pulseAnim.setValue(1);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: pulseAnim,
            transform: [{
              scale: pulseAnim
            }]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          styles.dotMiddle,
          {
            opacity: pulseAnim,
            transform: [{
              scale: pulseAnim.interpolate({
                inputRange: [0.7, 1],
                outputRange: [1, 0.7]
              })
            }]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: pulseAnim,
            transform: [{
              scale: pulseAnim
            }]
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8cd884', // Matches your green accent color
    margin: 3,
  },
  dotMiddle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
