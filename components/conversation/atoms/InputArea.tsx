import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { useMessage } from '@/context/MessageContext';

const InputArea: React.FC = () => {
  const { sendMessage, isStreaming, isLoading, connectWebSocket } = useMessage();
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connectSocket = async () => {
      try {
        await connectWebSocket('default');
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectSocket();
  }, [connectWebSocket]);

  const handleSend = () => {
    if (input.trim() && !isStreaming && !isLoading && isConnected) {
      sendMessage(input);
      setInput('');
    } else if (!isConnected) {
      console.error('WebSocket is not connected. Attempting to reconnect...');
      connectWebSocket('default');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="Type a message..."
        editable={!isStreaming && !isLoading && isConnected}
      />
      <Button 
        title="Send" 
        onPress={handleSend} 
        disabled={isStreaming || isLoading || !isConnected || !input.trim()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
});

export default InputArea;