import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MessageList from './MessageList';
import InputArea from './InputArea';

interface ConversationUIProps {
  title?: string;
  subtitle?: string;
}

const ConversationUI: React.FC<ConversationUIProps> = ({ title, subtitle }) => (
  <View style={styles.container}>
    {title && <Text style={styles.title}>{title}</Text>}
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    <View style={styles.messageListContainer}>
      <MessageList />
    </View>
    <InputArea />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 20,
    color: '#8cd884',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 10,
    color: '#8cd884',
  },
  messageListContainer: {
    flex: 1,
  },
});

export default ConversationUI;