import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProfileHeader from '../atoms/ProfileHeader';
import ProfileGroup from '../molecules/ProfileGroup';
import { UserProfile } from '@/types';

interface ProfileDisplayProps {
  profile: UserProfile;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ profile }) => (
  <View style={styles.container}>
    <View style={styles.content}>
      <ProfileHeader displayName={profile.display_name} />
      <ProfileGroup profile={profile} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    flex: 1,
    padding: 16,
  },
  content: {
    backgroundColor: '#111',
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default ProfileDisplay;