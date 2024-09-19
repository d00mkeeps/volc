// MessageList.tsx
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import MessageItem from './MessageItem';
import { mockMessages } from './mockData';

const MessageList: React.FC = () => (
  <FlatList
    data={mockMessages}
    renderItem={({ item }) => <MessageItem message={item} />}
    keyExtractor={item => item.id.toString()}
    contentContainerStyle={styles.listContent}
    style={styles.list}
  />
);

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
});

export default MessageList;