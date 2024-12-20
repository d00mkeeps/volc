import { ProfileItemProps } from '@/types/profileComponents';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


const ProfileItem: React.FC<ProfileItemProps> = ({ label, value, isLastItem = false }) => (
  <View style={[styles.container, isLastItem && styles.lastItem]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    paddingHorizontal: 16
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  label: {
    color: '#8cd884',
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    color: '#eee',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileItem;