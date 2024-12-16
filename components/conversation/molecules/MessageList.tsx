import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Message } from '@/types';
import MessageItem from '../atoms/MessageItem';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { ScrollToBottomButton } from '../atoms/ScrollToBottom';

interface MessageListProps {
  messages: Message[];
  streamingMessage: Message | null;
  style?: any
}

const MessageList: React.FC<MessageListProps> = ({ messages, streamingMessage }) => {
  const { 
    listRef, 
    handleScroll, 
    showScrollButton,
    scrollToBottom 
  } = useAutoScroll(streamingMessage);

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MessageItem message={item} />
  ), []);

  // Include streaming message in data if present
  const allMessages = streamingMessage 
    ? [...messages, streamingMessage]
    : messages;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={allMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={() => scrollToBottom(false)}
        onLayout={() => scrollToBottom(false)}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />
      {showScrollButton && (
        <ScrollToBottomButton onPress={() => scrollToBottom(true)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  }, 
});

export default MessageList