import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type WelcomeStepProps = {
  onNext: () => void;
};

export const WelcomeStep: React.FC<WelcomeStepProps> = () => {

  return (
    <View>
      <Text style={styles.stepTitle}>Welcome to Our App!</Text>
      <Text style={styles.stepContent}>We're excited to have you on board. Let's get started by setting up your profile.</Text>
     
    </View>
  );
};

const styles = StyleSheet.create({
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#8cd884'
  },
  stepContent: {
    fontSize: 16,
    marginBottom: 20,
    color: '#8cd884'
  },
  button: {
    marginTop: 20,
  },
});