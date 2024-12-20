import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import SectionHeader from '../atoms/SectionHeader';
import ProfileGroup from './ProfileGroup';
import { ProfileSectionProps } from '@/types/profileComponents';

function ProfileSection({ title, data }: ProfileSectionProps) {
  // Memoize the formatted data to prevent unnecessary processing
  const formattedData = useMemo(() => {
    return Object.entries(data).map(([key, value]) => ({
      key,
      label: key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      value: Array.isArray(value) ? value.join(', ') : String(value),
    }));
  }, [data]);

  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <ProfileGroup data={formattedData} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#111',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
});

// Memoize the entire section component
export default memo(ProfileSection, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  return (
    prevProps.title === nextProps.title &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});