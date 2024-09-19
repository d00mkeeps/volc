import React from 'react';
import { View, StyleSheet } from 'react-native';
import ConversationUI from '../conversation/ConversationUI';

export const WorkoutHistoryStep: React.FC = () => {
  return (
    <View style={styles.container}>
      <ConversationUI 
        title="Workout History"
        subtitle="Let's chat about your workout history. This will help us tailor your experience."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  conversationContainer: {
    flex: 1,
  }
});