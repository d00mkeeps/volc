import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Conversation } from '../../../assets/mockData';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.title}>{conversation.title}</Text>
      <Text style={styles.lastMessage}>{conversation.lastMessage}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
});

export default ConversationItem;