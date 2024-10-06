import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import ProfileDisplay from '@/components/profile/organisms/ProfileDisplay';
import { syntheticUserProfile } from '@/assets/mockData';

export default function ProfileDisplayScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ProfileDisplay profile={syntheticUserProfile} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
});