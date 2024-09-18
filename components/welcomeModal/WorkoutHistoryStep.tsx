// WorkoutHistoryStep.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ConversationUI from '../conversation/ConversationUI';

export const WorkoutHistoryStep: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout History</Text>
      <Text style={styles.description}>
        Let's chat about your workout history. This will help us tailor your experience.
      </Text>
      <View style={styles.conversationContainer}>
        <ConversationUI />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  conversationContainer: {
    flex: 1,
    width: '100%',
  },
});