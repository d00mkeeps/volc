// components/profile/molecules/EditFieldModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface EditFieldModalProps {
  isVisible: boolean;
  fieldName: string;
  fieldKey: string;
  currentValue: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
}

const EditFieldModal: React.FC<EditFieldModalProps> = ({
  isVisible,
  fieldName,
  fieldKey,
  currentValue,
  onSave,
  onCancel
}) => {
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateField = (value: string): boolean => {
    setError(null);
    
    // Field-specific validation
    switch (fieldKey) {
      case 'name':
        if (!value.trim()) {
          setError('Name cannot be empty');
          return false;
        }
        break;
        
      case 'measurement_system':
        const lowerValue = value.trim().toLowerCase();
        if (lowerValue !== 'imperial' && lowerValue !== 'metric') {
          setError('Must be either "Imperial" or "Metric"');
          return false;
        }
        break;
        
      case 'experience':
        if (!value.trim()) {
          setError('Experience cannot be empty');
          return false;
        }
        break;
        
      case 'goal':
        if (!value.trim()) {
          setError('Goal cannot be empty');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleSave = () => {
    if (validateField(newValue)) {
      onSave(newValue);
      setNewValue('');
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Edit {fieldName}</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Current</Text>
            <Text style={styles.currentValue}>{currentValue}</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New</Text>
            <TextInput
              style={styles.input}
              value={newValue}
              onChangeText={(text) => {
                setNewValue(text);
                setError(null); // Clear error when user types
              }}
              placeholder={`Enter new ${fieldName.toLowerCase()}`}
              placeholderTextColor="#777"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setNewValue('');
                setError(null);
                onCancel();
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: '85%',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#8cd884',
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 16,
    color: '#ddd',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 6,
  },
  input: {
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 6,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  saveButton: {
    backgroundColor: '#8cd884',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
});

export default EditFieldModal;