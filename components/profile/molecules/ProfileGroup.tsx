import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProfileItem from '../atoms/ProfileItem';
import { ProfileGroupProps } from '@/types/profileComponents';

const ProfileGroup: React.FC<ProfileGroupProps> = ({ data, onEdit, nonEditableFields = [] }) => {
  const formatValue = (key: string, value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      // Future-proofing for complex goal structure
      return JSON.stringify(value);
    }
    return String(value);
  };

  const formatLabel = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <View style={styles.container}>
      {Object.entries(data).map(([key, value], index) => (
        <ProfileItem
          key={key}
          label={formatLabel(key)}
          value={formatValue(key, value)}
          isLastItem={index === Object.entries(data).length - 1}
          onEdit={onEdit && !nonEditableFields.includes(key) 
            ? () => onEdit(key, formatValue(key, value), formatLabel(key)) 
            : undefined}
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