// components/atoms/ToggleSwitch.tsx
import { Switch, View, Text, StyleSheet } from 'react-native';

interface ToggleSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  value,
  onValueChange,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3a433a', true: '#4a8b4a' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
  },
});