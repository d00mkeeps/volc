import { HeaderProps } from '@/types/chat';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => (
  <View style={styles.container}>
    {title && <Text style={styles.title}>{title}</Text>}
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1f281f', 
    borderBottomWidth: 1,
    borderBottomColor: '#2a332a',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0aba0',
    fontWeight: '400',
  },
});

export default Header;