import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Conversation } from '@/types';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress }) => {
  const formattedDate = new Date(conversation.updated_at).toLocaleString();
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{conversation.title || 'Untitled Conversation'}</Text>
        <Text style={styles.lastMessageTime}>Last updated: {formattedDate}</Text>
      </View>
      <View style={styles.contentRow}>
        <View style={styles.bottomRightComponent}>
          <Text style={styles.bottomRightText}>
            Messages: {conversation.message_count}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#559e55',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ddd',
  },
  lastMessageTime: {
    fontSize: 13,
    color: '#222',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  lastMessage: {
    fontSize: 13,
    color: '#222',
    flex: 1,
    marginRight: 8,
  },
  bottomRightComponent: {
    // Adjust these styles as needed for your specific component
    backgroundColor: '#4a854a',
    borderRadius: 10,
    padding: 4,
  },
  bottomRightText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default ConversationItem;