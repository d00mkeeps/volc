// components/conversation/MessageList.tsx

import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Message } from '../../../assets/mockData';
import MessageItem from '../atoms/MessageItem';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const renderItem = ({ item }: { item: Message }) => (
    <MessageItem message={item} />
  );

  return (
    <FlatList
      data={messages}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});

export default MessageList;