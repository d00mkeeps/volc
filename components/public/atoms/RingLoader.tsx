import React from "react";
import { Animated, Modal, View, StyleSheet } from "react-native";

interface LoaderProps {
  visible?: boolean;
  color?: string;
  size?: number;
}

const RingLoader = ({ visible = false, color = '#559e55', size = 60 }: LoaderProps) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [visible, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderColor: color,
              borderWidth: size / 10,
              borderRadius: size / 2,
              transform: [{ rotate: spin }],
            },
          ]}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default RingLoader