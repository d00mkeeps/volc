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
  />
);

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 10,
  },
});

export default MessageList;