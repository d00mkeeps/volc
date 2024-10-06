import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProfileItem from '../atoms/ProfileItem';
import { ProfileGroupProps } from '@/types';

const ProfileGroup: React.FC<ProfileGroupProps> = ({ profile }) => (
  <View style={styles.container}>
    <ProfileItem label="First Name" value={profile.first_name} />
    <ProfileItem label="Last Name" value={profile.last_name} />
    <ProfileItem label="Display Name" value={profile.display_name} />
    <ProfileItem label="Goals" value={profile.goals} />
    <ProfileItem label="Experience" value={`${profile.training_history.years_of_experience} years`} />
    <ProfileItem label="Preferred Activities" value={profile.training_history.preferred_activities.join(', ')} />
    <ProfileItem label="Measurement System" value={profile.is_imperial ? 'Imperial' : 'Metric'} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default ProfileGroup;