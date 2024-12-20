import { InputAreaProps } from "@/types/index";
import { memo, useCallback, useEffect, useState,  } from "react";
import { View, 
  TextInput, 
  TouchableOpacity, 
  Text,
StyleSheet, 
LayoutChangeEvent} from "react-native";

const InputArea: React.FC<InputAreaProps> = memo(({ disabled, onSendMessage }) => {
  const [input, setInput] = useState('');

  useEffect(() => {
    console.log('InputArea rendered');
  });

  const measureLayout = useCallback(() => {
    // Using onLayout to get position info
    return (event: LayoutChangeEvent) => {
      const {x, y, width, height} = event.nativeEvent.layout;
      console.log('InputArea position:', {x, y, width, height});
    };
  }, []);

  // Track input changes
  const handleInputChange = (text: string) => {
    console.log('Input changed:', text);
    setInput(text);
  };
  

  const handleSend = () => {
    if (!disabled && input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <View 
    style={styles.container}
    onLayout={measureLayout}
    >
      <TextInput
        style={[styles.input, disabled && styles.disabledInput]}
        value={input}
        onChangeText={handleInputChange}
        onFocus={() => console.log('Input focused')}
        onBlur={() => console.log('Input blurred')}
        placeholder={disabled ? 'Not connected...' : 'Type a message...'}
        placeholderTextColor="#666"
        editable={!disabled}
        multiline={false}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={true}
        enablesReturnKeyAutomatically={true}
        keyboardAppearance="dark"
        maxLength={1000}
      />
      <TouchableOpacity
        style={[styles.sendButton, disabled && styles.disabledButton]}
        onPress={handleSend}
        disabled={disabled || !input.trim()}
      >
        <Text style={[styles.sendButtonText, disabled && styles.disabledButtonText]}>
          Send
        </Text>
      </TouchableOpacity>
    </View>
  );
});


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