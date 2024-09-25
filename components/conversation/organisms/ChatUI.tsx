// components/conversation/ChatUI.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MessageList from '../molecules/MessageList';
import InputArea from '../atoms/InputArea';

interface ConversationUIProps {
  title: string;
  subtitle: string;
  messages: any[]; // Replace 'any' with your message type
  draftMessage?: string;
  onSendMessage: (message: string) => void;
  onDraftMessageChange?: (draft: string) => void;
}

const ConversationUI: React.FC<ConversationUIProps> = ({
  title,
  subtitle,
  messages,
  draftMessage,
  onSendMessage,
  onDraftMessageChange,
}) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
    <View style={styles.messageListContainer}>
      <MessageList messages={messages} />
    </View>
    <InputArea
      onSendMessage={onSendMessage}
      draftMessage={draftMessage}
      onDraftMessageChange={onDraftMessageChange}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#8cd884',
  },
  subtitle: {
    fontSize: 16,
    color: '#8cd884',
  },
  messageListContainer: {
    flex: 1,
  },
});

export default ConversationUI;