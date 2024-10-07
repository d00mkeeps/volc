
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CalendarButton: React.FC = () => (
  <TouchableOpacity style={styles.button}>
    <Text style={styles.buttonText}>Calendar</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default CalendarButton;