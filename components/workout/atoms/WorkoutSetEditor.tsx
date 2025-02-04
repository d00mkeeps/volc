// components/workout/atoms/WorkoutSetEditor.tsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { WorkoutSet } from '@/types/workout';

interface WorkoutSetEditorProps {
  set: WorkoutSet;
  onSetChange: (set: WorkoutSet) => void;
  isLastSet: boolean;
}

const WorkoutSetEditor: React.FC<WorkoutSetEditorProps> = ({
  set,
  onSetChange,
  isLastSet,
}) => {
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validateField = (
    value: string | null, 
    field: 'weight' | 'reps' | 'rpe' | 'distance' | 'duration'
  ): boolean => {
    if (value === null || value === '') {
      setErrors(prev => ({ ...prev, [field]: null }));
      return true;
    }

    const num = Number(value);
    let isValid = true;
    let errorMessage = '';

    switch (field) {
      case 'weight':
        isValid = num >= 0 && num <= 2000;
        errorMessage = 'Weight must be between 0-2000';
        break;
      case 'reps':
        isValid = num >= 0 && num <= 250;
        errorMessage = 'Reps must be between 0-250';
        break;
      case 'rpe':
        isValid = num >= 0 && num <= 10;
        errorMessage = 'RPE must be between 0-10';
        break;
      case 'duration':
        isValid = num >= 0 && num <= (96 * 3600); // 96 hours in seconds
        errorMessage = 'Duration must be between 0-96 hours';
        break;
      case 'distance':
        isValid = num >= 0 && num <= 100000;
        errorMessage = 'Distance must be between 0-100,000';
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: isValid ? null : errorMessage
    }));

    return isValid;
  };

  const handleChange = (value: string, field: keyof WorkoutSet) => {
    const numberFields: (keyof WorkoutSet)[] = ['weight', 'reps', 'rpe', 'distance', 'duration'];
    
    if (numberFields.includes(field)) {
      if (value === '') {
        onSetChange({ ...set, [field]: null });
        return;
      }
      
      const isValid = validateField(value, field as any);
      if (isValid) {
        onSetChange({ ...set, [field]: Number(value) });
      }
    } else {
      onSetChange({ ...set, [field]: value });
    }
  };

  return (
    <View style={[styles.container, !isLastSet && styles.bottomBorder]}>
      <TextInput
        style={[styles.input, errors.weight && styles.inputError]}
        value={set.weight?.toString() || ''}
        onChangeText={(value) => handleChange(value, 'weight')}
        keyboardType="numeric"
        placeholder="Weight"
        placeholderTextColor="#666"
      />
      <TextInput
        style={[styles.input, errors.reps && styles.inputError]}
        value={set.reps?.toString() || ''}
        onChangeText={(value) => handleChange(value, 'reps')}
        keyboardType="numeric"
        placeholder="Reps"
        placeholderTextColor="#666"
      />
      <TextInput
        style={[styles.input, errors.rpe && styles.inputError]}
        value={set.rpe?.toString() || ''}
        onChangeText={(value) => handleChange(value, 'rpe')}
        keyboardType="numeric"
        placeholder="RPE"
        placeholderTextColor="#666"
      />
      {set.distance !== undefined && (
        <TextInput
          style={[styles.input, errors.distance && styles.inputError]}
          value={set.distance?.toString() || ''}
          onChangeText={(value) => handleChange(value, 'distance')}
          keyboardType="numeric"
          placeholder="Distance"
          placeholderTextColor="#666"
        />
      )}
      {set.duration !== undefined && (
        <TextInput
          style={[styles.input, errors.duration && styles.inputError]}
          value={set.duration?.toString() || ''}
          onChangeText={(value) => handleChange(value, 'duration')}
          keyboardType="numeric"
          placeholder="Duration"
          placeholderTextColor="#666"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  input: {
    flex: 1,
    color: '#bbb',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#333',
    marginHorizontal: 4,
    padding: 8,
    borderRadius: 4,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4444',
  },
});

export default WorkoutSetEditor;