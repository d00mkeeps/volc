import React, { useEffect, useMemo, useRef } from 'react';
import { useMessage } from '@/context/MessageContext';
import { Message } from '@/types';
import { ListRenderItemInfo, View, FlatList, StyleSheet } from 'react-native';
import InputArea from '../atoms/InputArea';
import MessageItem from '../atoms/MessageItem';

const ChatUI: React.FC = () => {
  const { messages, isStreaming, streamingMessage } = useMessage();
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    console.log('Messages array:', messages.map(msg => ({
      id: msg?.id || 'null',
      role: msg?.role || 'null',
      content: msg?.content ? msg.content.substring(0, 20) + '...' : 'null'
    })));
  }, [messages]);

  const renderItem = ({ item }: ListRenderItemInfo<Message>) => {
    if (!item) {
      console.error('Attempting to render null item');
      return null;
    }
    return (
      <MessageItem
        message={item}
        isStreaming={item.id === 'streaming'}
      />
    );
  };
  
  const allMessages = useMemo(() => {
    const validMessages = messages.filter(msg => msg && msg.id);
    if (isStreaming && streamingMessage && streamingMessage.content) {
      return [...validMessages, { ...streamingMessage, id: 'streaming' }];
    }
    return validMessages;
  }, [messages, isStreaming, streamingMessage]);
  
  useEffect(() => {
    console.log('All messages:', allMessages.map(msg => ({
      id: msg?.id || 'null',
      role: msg?.role || 'null',
      content: msg?.content ? msg.content.substring(0, 20) + '...' : 'null'
    })));
  }, [allMessages]);

  useEffect(() => {
    if (flatListRef.current && allMessages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [allMessages]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={allMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || 'fallback-key'}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
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