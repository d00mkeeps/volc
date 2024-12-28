// components/conversation/organisms/ConversationList.tsx
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import ConversationItem from '../atoms/ConversationItem';
import { Conversation, ConversationListProps } from '@/types';
import { useEffect, useState } from 'react';
import { ConversationService } from '@/services/supabase/conversation';

const ConversationList: React.FC<ConversationListProps> = ({ onConversationPress }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const conversationService = new ConversationService();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // You'll need to add this method to your ConversationService
        const userConversations = await conversationService.getUserConversations();
        setConversations(userConversations);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  const renderItem = ({ item }: { item: Conversation }) => (
    <ConversationItem 
      conversation={item} 
      onPress={() => onConversationPress(item.id)} 
    />
  );

  return (
    <FlatList
      data={conversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.contentContainer}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
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