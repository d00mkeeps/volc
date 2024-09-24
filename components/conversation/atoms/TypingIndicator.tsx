import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TypingIndicator: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>AI is typing...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    alignSelf: 'flex-start',
    margin: 5,
  },
  text: {
    color: '#8E8E93',
    fontStyle: 'italic',
  },
});

export default TypingIndicator;