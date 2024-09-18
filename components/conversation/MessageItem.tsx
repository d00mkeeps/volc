import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => (
  <View style={[styles.container, message.role === 'user' ? styles.userMessage : styles.assistantMessage]}>
    <Text style={styles.text}>{message.content}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  text: {
    color: '#000',
  },
});

export default MessageItem;