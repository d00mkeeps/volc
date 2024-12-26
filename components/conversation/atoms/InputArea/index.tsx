import { InputAreaProps } from "@/types/index";
import { memo, useCallback, useEffect, useState, useRef } from "react";
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text,
  StyleSheet, 
  LayoutChangeEvent,
  Keyboard
} from "react-native";

const InputArea: React.FC<InputAreaProps> = memo(({ disabled, onSendMessage }) => {
  const [input, setInput] = useState('');
  const lastLayoutRef = useRef<LayoutChangeEvent['nativeEvent']['layout']>();

  const measureLayout = useCallback((event: LayoutChangeEvent) => {
    const currentLayout = event.nativeEvent.layout;
    const lastLayout = lastLayoutRef.current;
    
    console.log('InputArea layout event:', {
      current: currentLayout,
      previous: lastLayout,
      changed: lastLayout ? {
        x: currentLayout.x !== lastLayout.x,
        y: currentLayout.y !== lastLayout.y,
        width: currentLayout.width !== lastLayout.width,
        height: currentLayout.height !== lastLayout.height
      } : 'initial layout'
    });

    lastLayoutRef.current = currentLayout;
  }, []);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (event) => {
      console.log('Keyboard will show:', event);
    });
    
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', (event) => {
      console.log('Keyboard did show:', event);
    });

    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', (event) => {
      console.log('Keyboard will hide:', event);
    });
    
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', (event) => {
      console.log('Keyboard did hide:', event);
    });

    return () => {
      keyboardWillShow.remove();
      keyboardDidShow.remove();
      keyboardWillHide.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const handleInputChange = useCallback((text: string) => {
    setInput(text);
  }, []);

  const handleSend = useCallback(() => {
    if (!disabled && input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  }, [disabled, input, onSendMessage]);

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
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1f281f',
    borderTopWidth: 1,
    borderTopColor: '#2a332a',
    width: '100%',
    position: 'relative',
    bottom: 0,
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