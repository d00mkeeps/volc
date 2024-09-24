import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import ConversationItem from '../molecules/ConversationItem';
import { Conversation, mockConversations } from '../mockData';

const ConversationList: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState(mockConversations);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setConversations(mockConversations);
      setRefreshing(false);
    }, 1000);
  }, []);


  const renderItem = ({ item }: { item: Conversation }) => (
    <ConversationItem conversation={item} onPress={() => null} />
  );

  return (
    <FlatList
      data={conversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default ConversationList;