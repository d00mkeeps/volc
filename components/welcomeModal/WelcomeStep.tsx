import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../public/atoms';

type WelcomeStepProps = {
  onNext: () => void;
};

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => (
  <View>
    <Text style={styles.stepTitle}>Welcome to Our App!</Text>
    <Text style={styles.stepContent}>We're excited to have you on board. Let's get started by setting up your profile.</Text>
    <Button onPress={onNext}>Get started!</Button>
  </View>
);

const styles = StyleSheet.create({
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stepContent: {
    fontSize: 16,
    marginBottom: 20,
  },
});