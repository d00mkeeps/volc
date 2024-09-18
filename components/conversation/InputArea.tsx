import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const InputArea: React.FC = () => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    console.log('Sending message:', message);
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message..."
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
});

export default InputArea;