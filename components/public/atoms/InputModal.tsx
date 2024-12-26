// components/common/InputModal.tsx
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  View,
  TextInput,
  TouchableOpacity,
  Text,
} from 'react-native';
import { styles } from './styles'; 

interface InputModalProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  title?: string;
  placeholder?: string;
}

const InputModal: React.FC<InputModalProps> = ({
  visible,
  onClose,
  value,
  onChangeText,
  onSend,
  title = "Type a message",
  placeholder = "3 sets of squat (180x5, 180x5, 180x4);\n5k @ 5:40 pace..."
}) => {
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalContainer}
      keyboardVerticalOffset={Platform.OS === "ios" ? -64 : 0}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0]
                    })
                  }]
                }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
              </View>
              <TextInput
                style={styles.expandedInput}
                value={value}
                onChangeText={onChangeText}
                multiline
                placeholder={placeholder}
                placeholderTextColor="#666"
                autoFocus
                keyboardAppearance="dark"
              />
              <TouchableOpacity
                style={[styles.sendButton, !value.trim() && styles.disabledButton]}
                onPress={onSend}
                disabled={!value.trim()}
              >
                <Text style={[styles.sendButtonText, !value.trim() && styles.disabledButtonText]}>
                  Send
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputModal;