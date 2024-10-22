import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import ProfileDisplay from '@/components/profile/organisms/ProfileDisplay';
import { syntheticUserProfile } from '@/assets/mockData';
import { SignOutButton } from '@/components/auth/atoms/SignOutButton';

export default function ProfileDisplayScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ProfileDisplay profile={syntheticUserProfile} />
      <View style={styles.buttonContainer}>
        <SignOutButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  buttonContainer: {
    marginBottom: 20, // Space from bottom
  }
});