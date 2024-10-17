import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Message } from '@/types';
import MessageItem from '../atoms/MessageItem';

interface MessageListProps {
  messages: Message[];
  streamingMessage: Message | null;
}

const MessageList: React.FC<MessageListProps> = ({ messages, streamingMessage }) => {
  const renderItem = ({ item }: { item: Message }) => (
    <MessageItem message={item} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
      {streamingMessage && (
        <MessageItem message={streamingMessage} isStreaming={true} />
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

export default MessageList;