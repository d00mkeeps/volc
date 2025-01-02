/*import React, { useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { styles } from '../../../public/atoms/styles';
import { ExpandedModalProps } from '@/types/index';

const ExpandedModal: React.FC<ExpandedModalProps> = ({
  visible,
  onClose,
  value,
  onChangeText,
  onSend,
}) => {
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
                <Text style={styles.modalTitle}>Start conversation!</Text>
              </View>
              <TextInput
                style={styles.expandedInput}
                value={value}
                onChangeText={onChangeText}
                multiline
                placeholder="Describe your workout..."
                placeholderTextColor="#666"
                autoFocus
                keyboardAppearance="dark"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !value.trim() && styles.disabledButton
                ]}
                onPress={onSend}
                disabled={!value.trim()}
              >
                <Text style={[
                  styles.sendButtonText,
                  !value.trim() && styles.disabledButtonText
                ]}>
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

export default ExpandedModal;*/