// components/profile/organisms/ProfileDisplay.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import SectionHeader from '../atoms/SectionHeader';
import ProfileGroup from '../molecules/ProfileGroup';
import { useUser } from '@/context/UserContext';

const ProfileDisplay: React.FC = () => {
  const { userProfile } = useUser();

  if (!userProfile) {
    return null;
  }

  const generalInfo = {
    name: `${userProfile.first_name} ${userProfile.last_name}`.trim(),
    display_name: userProfile.display_name,
    measurement_system: userProfile.is_imperial ? 'Imperial' : 'Metric',
  };

  const progressInfo = {
    experience: `${userProfile.training_history.years_of_experience} years`,
    preferred_activities: userProfile.training_history.preferred_activities,
    goals: userProfile.goals,
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <SectionHeader title="General Information" />
        <ProfileGroup data={generalInfo} />
      </View>
      
      <View style={styles.section}>
        <SectionHeader title="Progress & Goals" />
        <ProfileGroup data={progressInfo} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    padding: 16,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
});

export default ProfileDisplay;