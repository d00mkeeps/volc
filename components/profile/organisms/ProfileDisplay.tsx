import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProfileHeader from '../atoms/ProfileHeader';
import ProfileGroup from '../molecules/ProfileGroup';
import { ProfileGroupProps } from '@/types';

const ProfileDisplay: React.FC<ProfileGroupProps> = ({ profile }) => (
  <View style={styles.container}>
    <ProfileHeader displayName={profile.display_name} />
    <ProfileGroup profile={profile} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    flex: 1,
    padding: 12,
  },
});

export default ProfileDisplay;