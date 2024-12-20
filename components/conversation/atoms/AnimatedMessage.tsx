import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import MessageItem from './MessageItem';
import { Message } from '@/types';

interface AnimatedMessageProps {
  message: Message;
}

const AnimatedMessage: React.FC<AnimatedMessageProps> = ({ message }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <MessageItem message={message} />
    </Animated.View>
  );
};

export default AnimatedMessage;