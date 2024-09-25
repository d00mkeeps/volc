// components/conversation/organisms/ConversationList.tsx

import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import ConversationItem from '../atoms/ConversationItem';
import { Conversation, mockConversations } from '../../../assets/mockData';

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
  const ItemSeparator = () => <View style={styles.separator} />;
  
  return (
    <FlatList
      data={mockConversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.contentContainer}
      ItemSeparatorComponent={ItemSeparator}
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
  separator: {
    height: 12 , // This creates an 8px gap between items
  },
});

export default ConversationList;