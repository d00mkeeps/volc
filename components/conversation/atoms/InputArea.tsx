import React from 'react';
import { useMessage } from '@/context/MessageContext';
import { KeyboardAvoidingView, Platform, View, TextInput, Button, StyleSheet } from 'react-native';

const InputArea: React.FC = () => {
  const { draftMessage, setDraftMessage, sendMessage, isLoading, isStreaming } = useMessage();

  const handleSend = () => {
    if (draftMessage.trim() && !isLoading && !isStreaming) {
      sendMessage(draftMessage, 'default');
      setDraftMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={draftMessage}
          onChangeText={setDraftMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          editable={!isLoading && !isStreaming}
        />
        <Button title="Send" onPress={handleSend} disabled={isLoading || isStreaming} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingBottom: 16,
    paddingTop: 8,
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
    borderRadius: 15,
    paddingHorizontal: 14,
    backgroundColor: '#041402',
    color: '#eee',
  },
});

export default InputArea;