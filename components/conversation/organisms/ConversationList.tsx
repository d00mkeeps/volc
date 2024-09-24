// components/conversation/organisms/ConversationList.tsx

import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import ConversationItem from '../atoms/ConversationItem';
import { Conversation, mockConversations } from '../mockData';

interface ConversationListProps {
  onConversationPress: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ onConversationPress }) => {
  const renderItem = ({ item }: { item: Conversation }) => (
    <ConversationItem 
      conversation={item} 
      onPress={() => onConversationPress(item.id)} 
    />
  );

  return (
    <FlatList
      data={mockConversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 12,
  },
});

export default ConversationList;