import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '@/types';

const MessageItem: React.FC<{ message: Message }> = ({ message }) => (
  <View style={styles.messageWrapper}>
    <View style={[
      styles.container, 
      message.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <Text style={[
        styles.text, 
        message.role === 'user' ? styles.userText : styles.assistantText
      ]}>
        {message.content}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  messageWrapper: {
    paddingHorizontal: 16, // Add horizontal padding to the message wrapper
    paddingVertical: 4,    // Add vertical padding to create space between messages
  },
  container: {
    maxWidth: '80%',
    padding: 12,           // Increase padding inside the message bubble
    borderRadius: 12,      // Slightly increase border radius for a softer look
    marginVertical: 2,     // Reduce vertical margin as we've added padding to the wrapper
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
    fontSize: 16,          // Add a default font size
    lineHeight: 22,        // Add line height for better readability
  },
  userText: {
    color: '#041402'
  },
  assistantText: {
    color: '#def7dc',
  },
});

export default MessageItem;