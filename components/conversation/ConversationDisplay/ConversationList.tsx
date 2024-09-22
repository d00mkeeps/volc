// components/conversation/ConversationList.tsx

import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import ConversationItem from './ConversationItem';
import { Conversation, mockConversations } from '../mockData';

interface ConversationListProps {
  onConversationPress: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ onConversationPress }) => {
  const renderItem = ({ item }: { item: Conversation }) => (
    <ConversationItem conversation={item} onPress={onConversationPress} />
  );

  return (
    <FlatList
      data={mockConversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});

export default ConversationList;