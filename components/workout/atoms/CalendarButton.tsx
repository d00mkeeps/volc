import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Make sure you have @expo/vector-icons installed

const CalendarButton: React.FC = () => (
  <TouchableOpacity style={styles.button}>
    <Ionicons name="calendar-outline" size={24} color="#fff" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
  },
});

export default CalendarButton;