import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ProfileItemProps {
  label: string;
  value: string;
  isLastItem: boolean;
  onEdit?: () => void;
}

const ProfileItem: React.FC<ProfileItemProps> = ({ label, value, isLastItem, onEdit }) => {
  return (
    <View style={[styles.container, !isLastItem && styles.borderBottom]}>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {onEdit && (
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={18} color="#8cd884" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#fff',
  },
  editButton: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
});

export default ProfileItem;