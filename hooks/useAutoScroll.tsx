import { useRef, useEffect, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { debounce } from 'lodash';
import { Message } from '@/types';

export const useAutoScroll = (streamingMessage: Message | null) => {
  const listRef = useRef<FlatList | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = (animated = true) => {
    // Add a small delay to ensure content is rendered
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  // Handle new messages and streaming updates
  useEffect(() => {
    if (streamingMessage && autoScrollEnabled) {
      scrollToBottom();
    }
  }, [streamingMessage, autoScrollEnabled]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nativeEvent = event.nativeEvent;
    if (!nativeEvent) return;

    const metrics = {
      layoutHeight: nativeEvent.layoutMeasurement?.height || 0,
      offsetY: nativeEvent.contentOffset?.y || 0,
      contentHeight: nativeEvent.contentSize?.height || 0
    };

    debouncedScrollCalc(metrics);
  };

  const debouncedScrollCalc = debounce((metrics: {
    layoutHeight: number;
    offsetY: number;
    contentHeight: number;
  }) => {
    const paddingToBottom = 50; // Increased padding
    const isCloseToBottom = 
      metrics.layoutHeight + metrics.offsetY >= 
      metrics.contentHeight - paddingToBottom;
    
    setAutoScrollEnabled(isCloseToBottom);
    setShowScrollButton(!isCloseToBottom && streamingMessage !== null);
  }, 200);

  return {
    listRef,
    autoScrollEnabled,
    showScrollButton,
    handleScroll,
    scrollToBottom
  };
};