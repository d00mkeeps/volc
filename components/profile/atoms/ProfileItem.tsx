import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

 interface ProfileItemProps {
  label: string;
  value: string | number | null;
}

const ProfileItem: React.FC<ProfileItemProps> = ({ label, value }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
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