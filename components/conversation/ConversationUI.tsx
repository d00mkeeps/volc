import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from './Header';
import MessageList from './MessageList';
import InputArea from './InputArea';

const ConversationUI: React.FC = () => (
  <View style={styles.container}>
    <Header title="Chat" subtitle="AI Assistant" />
    <MessageList />
    <InputArea />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default ConversationUI;