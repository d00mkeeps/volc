import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMessage } from '@/context/MessageContext';
import { Message } from '@/types';
import { ListRenderItemInfo, View, FlatList, StyleSheet, Text } from 'react-native';
import InputArea from '../atoms/InputArea';
import MessageItem from '../atoms/MessageItem';

interface ChatUIProps {
  configName: string;
  title?: string;
  subtitle?: string;
}

const ChatUI: React.FC<ChatUIProps> = ({ configName, title, subtitle }) => {
  const { messages, isStreaming, streamingMessage, connectWebSocket } = useMessage();
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    connectWebSocket(configName);
  }, [configName, connectWebSocket]);

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
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        }
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
    width: '100%',
  },
  headerContainer: {
    padding: 10,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
  },
  listContent: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: 20,
  },
});

export default ChatUI