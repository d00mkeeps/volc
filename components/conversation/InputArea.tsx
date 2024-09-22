// components/conversation/InputArea.tsx

import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
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
    padding: 10,
    backgroundColor: '#1f281f',
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