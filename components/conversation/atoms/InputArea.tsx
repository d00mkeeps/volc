// components/conversation/InputArea.tsx

import React from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  draftMessage: string;
  onDraftMessageChange: (draft: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, draftMessage, onDraftMessageChange }) => {
  const handleSend = () => {
    if (draftMessage.trim()) {
      onSendMessage(draftMessage);
      onDraftMessageChange('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={draftMessage}
        onChangeText={onDraftMessageChange}
        placeholder="Type a message..."
        placeholderTextColor="#999"
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
};

// ... (styles remain the same)


const styles = StyleSheet.create({
  keyboardAvoidingView: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    backgroundColor: '#222',
  },
  input: {
    flex: 1,
    marginRight: 10,
    borderWidth: 0,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: '#041402',
    color: '#eee',
  },
});

export default InputArea;