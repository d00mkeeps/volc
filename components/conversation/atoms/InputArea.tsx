import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Text 
} from 'react-native';
import { useMessage } from '@/context/MessageContext';

const InputArea: React.FC = () => {
  const { sendMessage, isStreaming, isLoading } = useMessage();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isStreaming && !isLoading) {
      sendMessage(input);
      setInput('');
      console.log('Message sent');
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
          placeholderTextColor="#666"
          editable={!isStreaming && !isLoading}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={true}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (isStreaming || isLoading || !input.trim()) && styles.disabledButton
          ]}
          onPress={handleSend}
          disabled={isStreaming || isLoading || !input.trim()}
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
    paddingHorizontal: 16,
    backgroundColor: '#1f281f',
    borderTopWidth: 1,
    borderTopColor: '#2a332a',
    width: '100%',
  },
  input: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2a332a',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#041402',
    color: '#fff',
    fontSize: 16,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  disabledButton: {
    backgroundColor: '#2a332a',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default InputArea