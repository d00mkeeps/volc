import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Text } from 'react-native';
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
        console.log('WebSocket connected');
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      }
    };
    connectSocket();
  }, [connectWebSocket]);

  useEffect(() => {
    console.log(`InputArea state: isStreaming=${isStreaming}, isLoading=${isLoading}, isConnected=${isConnected}`);
  }, [isStreaming, isLoading, isConnected]);

  const handleSend = () => {
    if (input.trim() && !isStreaming && !isLoading && isConnected) {
      sendMessage(input);
      setInput('');
      console.log('Message sent');
    } else if (!isConnected) {
      console.error('WebSocket is not connected. Attempting to reconnect...');
      connectWebSocket('default');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
      style={styles.keyboardAvoidingView}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          editable={!isStreaming && !isLoading && isConnected}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (isStreaming || isLoading || !isConnected || !input.trim()) && styles.disabledButton
          ]}
          onPress={handleSend}
          disabled={isStreaming || isLoading || !isConnected || !input.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 10,
    backgroundColor: '#1f281f',
  },
  input: {
    flex: 1,
    marginRight: 10,
    borderWidth: 0,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#041402',
    color: '#eee',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#888',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default InputArea;