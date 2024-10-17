import React from 'react';
import { useMessage } from '@/context/MessageContext';
import { Message } from '@/types';
import { ListRenderItemInfo, View, FlatList, StyleSheet } from 'react-native';
import InputArea from '../atoms/InputArea';
import MessageItem from '../atoms/MessageItem';

const ChatUI: React.FC = () => {
  const { messages, isLoading, isStreaming } = useMessage();

  const renderItem = ({ item, index }: ListRenderItemInfo<Message>) => (
    <MessageItem
      message={item}
      isStreaming={isStreaming && index === messages.length - 1}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList<Message>
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
      <InputArea />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default ChatUI;