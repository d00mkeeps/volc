// src/components/ChatUI.tsx

import React, { useMemo } from 'react';
import { useMessage } from '@/context/MessageContext';
import { Message } from '@/types';
import { ListRenderItemInfo, View, FlatList, StyleSheet } from 'react-native';
import InputArea from '../atoms/InputArea';
import MessageItem from '../atoms/MessageItem';

const ChatUI: React.FC = () => {
  const { messages, isStreaming, streamingMessage } = useMessage();

  const renderItem = ({ item }: ListRenderItemInfo<Message>) => (
    <MessageItem
      message={item}
      isStreaming={item.id === 'streaming'}
    />
  );
  
  const allMessages = useMemo(() => {
    const validMessages = messages.filter(msg => msg && msg.id);
    if (isStreaming && streamingMessage && streamingMessage.content) {
      return [...validMessages, { ...streamingMessage, id: 'streaming' }];
    }
    return validMessages;
  }, [messages, isStreaming, streamingMessage]);

  return (
    <View style={styles.container}>
      <FlatList
        data={allMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || 'fallback-key'}
        contentContainerStyle={styles.listContent}
      />
      <InputArea />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
});

export default ChatUI;