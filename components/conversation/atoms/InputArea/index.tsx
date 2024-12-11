// components/conversation/atoms/InputArea/index.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { useMessage } from '@/context/MessageContext';
import { ConnectionState } from '@/types/states';
import ExpandedModal from './ExpandedModal';
import { styles } from './styles';

interface InputAreaProps {
  isHomePage?: boolean;
  disabled?: boolean;
  onSendMessage?: (message: string) => void;  
  draftMessage?: string;                    
  onDraftMessageChange?: (message: string) => void;  
}

const getPlaceholderText = (connectionState: ConnectionState, isHomePage: boolean): string => {
  if (isHomePage) return 'Describe your workout to start tracking...';
  
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
  if (isHomePage) return null;
  
  if (connectionState.type === 'ERROR') {
    return connectionState.error?.message || 'Unable to send messages';
  }
  if (connectionState.type === 'DISCONNECTED') {
    return 'Not connected';
  }
  return null;
};

const InputArea: React.FC<InputAreaProps> = ({ 
  isHomePage = false, 
  disabled = false,
  onSendMessage,
  onDraftMessageChange,
  draftMessage
}) => {
  const { sendMessage: contextSendMessage, connectionState } = useMessage();
  const [input, setInput] = useState(draftMessage || '');
  const [isModalVisible, setIsModalVisible] = useState(false);

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
      setIsModalVisible(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    onDraftMessageChange?.(text);
  };

  return (
    <>
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
            onFocus={() => isHomePage && setIsModalVisible(true)}
            blurOnSubmit={true}
            enablesReturnKeyAutomatically={true}
            keyboardAppearance="dark"
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
      
      {isModalVisible && (
        <View style={styles.modalContainer}>
          <ExpandedModal
            visible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            value={input}
            onChangeText={handleInputChange}
            onSend={handleSend}
          />
        </View>
      )}
    </>
  );
};

export default InputArea;