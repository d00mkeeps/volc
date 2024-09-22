// components/conversation/ConversationItem.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Conversation } from '../mockData';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(conversation.id)} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{conversation.title}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {conversation.lastMessage}
        </Text>
      </View>
      <Text style={styles.timestamp}>{new Date(conversation.timestamp).toLocaleString()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
});

export default ConversationItem;