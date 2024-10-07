import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProfileItem from '../atoms/ProfileItem';
import { UserProfile } from '@/types';

interface ProfileGroupProps {
  profile: UserProfile;
}

const ProfileGroup: React.FC<ProfileGroupProps> = ({ profile }) => {
  const profileItems = [
    { label: "First Name", value: profile.first_name },
    { label: "Last Name", value: profile.last_name },
    { label: "Display Name", value: profile.display_name },
    { label: "Goals", value: profile.goals },
    { label: "Experience", value: `${profile.training_history.years_of_experience} years` },
    { label: "Preferred Activities", value: profile.training_history.preferred_activities.join(', ') },
    { label: "Measurement System", value: profile.is_imperial ? 'Imperial' : 'Metric' },
  ];

  return (
    <View style={styles.container}>
      {profileItems.map((item, index) => (
        <ProfileItem
          key={item.label}
          label={item.label}
          value={item.value}
          isLastItem={index === profileItems.length - 1}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
  },
});

export default ProfileGroup;