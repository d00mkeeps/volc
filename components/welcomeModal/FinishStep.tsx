import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const FinishStep: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're All Set!</Text>
      <Text style={styles.description}>
        We're excited to help you reach your fitness goals! Why don't you start by logging a workout?
      </Text>
      <Text style={styles.instruction}>
        Tap 'Finish' to get started
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8cd884',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#8cd884',
  },
  instruction: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#8cd884',
  },
});