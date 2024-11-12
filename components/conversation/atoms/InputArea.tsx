import React, { useMemo, useState } from 'react';
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
import { ConnectionState } from '@/types/states';

interface InputAreaProps {
  isHomePage?: boolean;
  disabled?: boolean;
  onSendMessage?: (message: string) => void;  
  draftMessage?: string;                    
  onDraftMessageChange?: (message: string) => void;  
}

const getPlaceholderText = (connectionState: ConnectionState, isHomePage: boolean): string => {
  // If on home page, always show default message
  if (isHomePage) return 'Type a message to start a new chat...';
  
  // Otherwise use connection-based messages
  switch (connectionState.type) {
    case 'DISCONNECTED':
      return 'Disconnected...';
    case 'CONNECTING':
      return 'Connecting...';
    case 'STREAMING':
      return 'Processing...';
    case 'ERROR':
      return 'Connection error';
    default:
      return 'Type a message...';
  }
};

const getErrorMessage = (connectionState: ConnectionState, isHomePage: boolean): string | null => {
  // Don't show connection errors on home page
  if (isHomePage) return null;
  
  if (connectionState.type === 'ERROR') {
    return connectionState.error?.message || 'Unable to send messages';
  }
  if (connectionState.type === 'DISCONNECTED') {
    return 'Not connected';
  }
  return null;
};

const InputArea: React.FC<InputAreaProps> = ({ isHomePage = false, disabled = false,
  onSendMessage,
  onDraftMessageChange,
  draftMessage
 }) => {
  const { sendMessage: contextSendMessage, connectionState } = useMessage();
  const [input, setInput] = useState(draftMessage || '');

  const messageState = useMemo(() => {
    const canType = isHomePage ? !disabled : connectionState.canSendMessage;
    const hasValidInput = input.trim().length > 0;
    
    return {
      canType,
      canSend: canType && hasValidInput,
      placeholder: getPlaceholderText(connectionState, isHomePage),
      errorMessage: getErrorMessage(connectionState, isHomePage)
    };
  }, [connectionState, input, isHomePage, disabled]);

  const handleSend = () => {
    if (messageState.canSend) {
      if (onSendMessage) {
        onSendMessage(input);
      } else {
        contextSendMessage(input);
      }
      setInput('');
    }
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    onDraftMessageChange?.(text);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
      style={styles.keyboardAvoidingView}
    >
      <View style={[
        styles.container,
        isHomePage && styles.homePageContainer
      ]}>
        <TextInput
          style={[
            styles.input,
            !messageState.canType && styles.disabledInput,
            isHomePage && styles.homePageInput
          ]}
          value={input}
          onChangeText={handleInputChange}
          placeholder={messageState.placeholder}
          placeholderTextColor="#666"
          editable={messageState.canType}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={true}
          enablesReturnKeyAutomatically={true}
          keyboardAppearance="dark"
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !messageState.canSend && styles.disabledButton,
            isHomePage && styles.homePageSendButton
          ]}
          onPress={handleSend}
          disabled={!messageState.canSend}
        >
          <Text style={[
            styles.sendButtonText,
            !messageState.canSend && styles.disabledButtonText
          ]}>
            Send
          </Text>
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
  homePageContainer: {
    backgroundColor: '#222',
    borderTopColor: '#333',
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
  homePageInput: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  disabledInput: {
    backgroundColor: '#0a1c08',
    borderColor: '#1a231a',
    color: '#666',
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
  homePageSendButton: {
    backgroundColor: '#4CAF50', // Keep the same or change if needed
  },
  disabledButton: {
    backgroundColor: '#2a332a',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#666',
  },
});

export default InputArea;