import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HeaderProps } from '@/types'; 

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#559e55',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ddd',
    textAlign: 'center',
  },
});