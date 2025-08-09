import { View } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface PulsingLoaderProps {
  size?: number;
}

export default function PulsingLoader({ size = 50 }: PulsingLoaderProps) {
  // Shared values and animations remain the same
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const backScale = useSharedValue(1.5);
  const backOpacity = useSharedValue(0.3);
  const thirdScale = useSharedValue(1.2);
  const thirdOpacity = useSharedValue(0.5);
  const rotations = {
    outer: useSharedValue(0),
    middle: useSharedValue(0),
    inner: useSharedValue(0)
  };
  const durations = {
    rotations: [1200, 1700, 2300],
    pulses: [950, 1050, 1000]
  };

  // Original useEffect remains the same
  useEffect(() => {
    rotations.outer.value = withRepeat(withTiming(360, {duration: durations.rotations[0]}), -1);
    rotations.middle.value = withRepeat(withTiming(-360, {duration: durations.rotations[1]}), -1);
    rotations.inner.value = withRepeat(withTiming(360, {duration: durations.rotations[2]}), -1);
    
    scale.value = withRepeat(withTiming(1.5, {duration: durations.pulses[0]}), -1, true);
    opacity.value = withRepeat(withTiming(0.25, {duration: durations.pulses[0]}), -1, true);
    
    backScale.value = withRepeat(withTiming(1, {duration: durations.pulses[1]}), -1, true);
    backOpacity.value = withRepeat(withTiming(0.5, {duration: durations.pulses[1]}), -1, true);
    
    thirdScale.value = withRepeat(withTiming(1.7, {duration: durations.pulses[2]}), -1, true);
    thirdOpacity.value = withRepeat(withTiming(0.15, {duration: durations.pulses[2]}), -1, true);
  }, []);

  // Styles remain the same
  const styles = {
    front: useAnimatedStyle(() => ({
      transform: [{scale: scale.value}],
      opacity: opacity.value
    })),
    back: useAnimatedStyle(() => ({
      transform: [{scale: backScale.value}],
      opacity: backOpacity.value
    })),
    third: useAnimatedStyle(() => ({
      transform: [{scale: thirdScale.value}],
      opacity: thirdOpacity.value
    })),
    outerRing: useAnimatedStyle(() => ({
      transform: [{rotate: `${rotations.outer.value}deg`}]
    })),
    middleRing: useAnimatedStyle(() => ({
      transform: [{rotate: `${rotations.middle.value}deg`}]
    })),
    innerRing: useAnimatedStyle(() => ({
      transform: [{rotate: `${rotations.inner.value}deg`}]
    }))
  };

  // Calculate sizes for the pulsing circles and rings
  const minPulseSize = size; // Base size
  const effectiveSize = size * 0.9; // Area where rings will be placed (90% of total size)
  
  // Ring sizes - distributed within the effectiveSize
  const innerRingSize = size * 0.36;  // Keeping the inner ring the same size
  const middleRingSize = effectiveSize * 0.6; // Larger than inner ring
  const outerRingSize = effectiveSize * 0.8; // Largest ring

  return (
    <View style={{
      position: 'absolute',
      zIndex: 999,
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    }}>
      <Animated.View style={[{
        width: minPulseSize,
        height: minPulseSize,
        borderRadius: minPulseSize / 2,
        backgroundColor: '#2d522d',
        position: 'absolute'
      }, styles.third]} />
      <Animated.View style={[{
        width: minPulseSize,
        height: minPulseSize,
        borderRadius: minPulseSize / 2,
        backgroundColor: '#3d6e3d',
        position: 'absolute'
      }, styles.back]} />
      <Animated.View style={[{
        width: minPulseSize,
        height: minPulseSize,
        borderRadius: minPulseSize / 2,
        backgroundColor: '#559e55',
      }, styles.front]} />
      <Animated.View style={[{
        width: outerRingSize,
        height: outerRingSize,
        borderRadius: outerRingSize / 2,
        borderWidth: 3,
        borderColor: '#222',
        borderTopColor: 'transparent',
        position: 'absolute'
      }, styles.outerRing]} />
      <Animated.View style={[{
        width: middleRingSize,
        height: middleRingSize,
        borderRadius: middleRingSize / 2,
        borderWidth: 2,
        borderColor: '#222',
        borderTopColor: 'transparent',
        position: 'absolute'
      }, styles.middleRing]} />
      <Animated.View style={[{
        width: innerRingSize,
        height: innerRingSize,
        borderRadius: innerRingSize / 2,
        borderWidth: 2,
        borderColor: '#222',
        borderTopColor: 'transparent',
        position: 'absolute'
      }, styles.innerRing]} />
    </View>
  );
}