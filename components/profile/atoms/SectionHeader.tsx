import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  title: {
    color: '#eee',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SectionHeader;