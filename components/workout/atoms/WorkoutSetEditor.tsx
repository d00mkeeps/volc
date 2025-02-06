// components/workout/atoms/WorkoutSetEditor.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { WorkoutSet } from '@/types/workout';

type WorkoutField = 'weight' | 'reps' | 'rpe' | 'distance' | 'duration';

interface WorkoutSetEditorProps {
  set: WorkoutSet;
  onSetChange: (set: WorkoutSet) => void;
  isLastSet: boolean;
  visibleFields: WorkoutField[];
}

const WorkoutSetEditor: React.FC<WorkoutSetEditorProps> = ({
  set,
  onSetChange,
  isLastSet,
  visibleFields,
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

  const renderField = (field: WorkoutField) => {
    const getPlaceholder = () => {
      switch(field) {
        case 'weight': return 'kg';
        case 'reps': return '#';
        case 'rpe': return '1-10';
        case 'distance': return 'km';
        case 'duration': return 'sec';
      }
    };

    
    return (
      <View key={field} style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
        <TextInput
          style={[styles.input, errors[field] && styles.inputError]}
          value={set[field]?.toString() || ''}
          onChangeText={(value) => handleChange(value, field)}
          keyboardType="numeric"
          placeholder={getPlaceholder()}
          placeholderTextColor="#666"
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, !isLastSet && styles.bottomBorder]}>
      {visibleFields.map(field => renderField(field))}
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
  fieldContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  fieldLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  input: {
    color: '#bbb',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4444',
  },
});

export default WorkoutSetEditor;