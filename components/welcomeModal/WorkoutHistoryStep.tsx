import React from 'react';
import { View, StyleSheet } from 'react-native';
import ChatUI from '../conversation/organisms/ChatUI';

export const WorkoutHistoryStep: React.FC = () => {
  return (
    <View style={styles.container}>
      <ChatUI 
        title="Workout History"
        subtitle="Let's chat about your workout history. This will help us tailor your experience." messages={[]} draftMessage={''} onSendMessage={function (message: string): void {
          throw new Error('Function not implemented.');
        } } onDraftMessageChange={function (draft: string): void {
          throw new Error('Function not implemented.');
        } }      />
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