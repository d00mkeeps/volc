// components/conversation/InputArea.tsx

import React from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  draftMessage?: string;
  onDraftMessageChange?: (draft: string) => void;
  isHomePage?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  onSendMessage, 
  draftMessage, 
  onDraftMessageChange, 
  isHomePage = false 
}) => {
  const handleSend = () => {
    if (draftMessage && draftMessage.trim()) {
      onSendMessage(draftMessage);
      if (onDraftMessageChange) {
        onDraftMessageChange('');
      }
    }
  };

  return (
    <View style={[styles.container, isHomePage ? null : styles.nonHomePageContainer]}>
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    backgroundColor: '#222', // Default color for home page
  },
  nonHomePageContainer: {
    backgroundColor: '#1f281f', // Color for non-home pages
  },
  input: {
    flex: 1,
    marginRight: 10,
    borderWidth: 0,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: '#041402',
    color: '#eee',
  },
});

export default InputArea;