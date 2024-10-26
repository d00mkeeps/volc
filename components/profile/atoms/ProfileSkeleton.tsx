import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

export function ProfileSkeleton() {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmer = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startShimmer();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.skeletonHeader,
          {
            opacity: shimmerValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.7],
            }),
          },
        ]} 
      />
      <View style={styles.skeletonContent}>
        {[1, 2, 3].map((item) => (
          <Animated.View
            key={item}
            style={[
              styles.skeletonItem,
              {
                opacity: shimmerValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.7],
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#222',
  },
  skeletonHeader: {
    height: 40,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonContent: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
  },
  skeletonItem: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 12,
  },
});