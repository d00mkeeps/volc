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
    <Text style={[styles.text, message.role === 'user' ? styles.userText : styles.assistantText]}>
      {message.content}
    </Text>
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
    backgroundColor: '#b2f7aa',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#041402',
  },
  text: {
    // Common text styles can be added here
  },
  userText: {
    color: '#041402'
  },
  assistantText: {
    color: '#def7dc',
  },
});

export default MessageItem;