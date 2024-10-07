import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileHeaderProps {
  displayName: string | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ displayName }) => (
  <View style={styles.container}>
    <Text style={styles.greeting}>Hi, {displayName}!</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  greeting: {
    color: '#eee',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default ProfileHeader;