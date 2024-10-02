import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HeaderProps } from '@/types';

export const Header: React.FC<HeaderProps> = ({ title, onClose }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#1f281f',
    paddingTop: 8,
    paddingBottom: 12,
  },
  modalView: {
    backgroundColor: '#559e55',
    borderRadius: 20,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    }},
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ddd',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: '#ddd',
    fontWeight: 'bold',
    fontSize: 16,
  },
});