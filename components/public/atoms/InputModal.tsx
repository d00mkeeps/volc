// // components/common/InputModal.tsx
// import React, { useState } from 'react';
// import {
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   TouchableWithoutFeedback,
//   View,
//   TextInput,
//   TouchableOpacity,
//   Text,
//   StyleSheet
// } from 'react-native';
// import { styles } from './styles';
// import { CHAT_CONFIGS, ChatConfigKey } from '@/constants/ChatConfigMaps';
// import ConfigSelect from '@/components/conversation/atoms/ConfigSelect';

// interface InputModalProps {
//   visible: boolean;
//   onClose: () => void;
//   value: string;
//   onChangeText: (text: string) => void;
//   onSend: (message: string, config: ChatConfigKey) => void;
//   title?: string;
//   placeholder?: string;
//   selectedConfig: ChatConfigKey | null;  // Add this
//   onConfigSelect: (config: ChatConfigKey) => void;  // Add this
// }

// const InputModal: React.FC<InputModalProps> = ({
//   visible,
//   onClose,
//   value,
//   onChangeText,
//   onSend,
//   title = "Type a message",
//   placeholder = "3 sets of squat (180x5, 180x5, 180x4);\n5k @ 5:40 pace...",
//   selectedConfig,
//   onConfigSelect
// }) => {
//   const [configSelectVisible, setConfigSelectVisible] = useState(false);
//   const slideAnim = React.useRef(new Animated.Value(0)).current;

//   React.useEffect(() => {
//     if (visible) {
//       Animated.spring(slideAnim, {
//         toValue: 1,
//         useNativeDriver: true,
//         tension: 65,
//         friction: 8,
//       }).start();
//     } else {
//       Animated.spring(slideAnim, {
//         toValue: 0,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [visible]);

//   if (!visible) return null;

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       style={styles.modalContainer}
//       keyboardVerticalOffset={Platform.OS === "ios" ? -64 : 0}
//     >
//       <TouchableWithoutFeedback onPress={onClose}>
//         <View style={styles.modalOverlay}>
//           <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
//             <Animated.View
//               style={[
//                 styles.modalContent,
//                 {
//                   transform: [{
//                     translateY: slideAnim.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [300, 0]
//                     })
//                   }]
//                 }
//               ]}
//             >
//               <View style={styles.modalHeader}>
//                 <Text style={styles.modalTitle}>{title}</Text>
//               </View>

//               {/* Add config selector button */}
//               <TouchableOpacity
//                 style={styles.configSelector}
//                 onPress={() => setConfigSelectVisible(true)}
//               >
//                 <Text style={styles.configSelectorText}>
//                   {selectedConfig ? CHAT_CONFIGS[selectedConfig] : 'Select chat type'}
//                 </Text>
//               </TouchableOpacity>

//               <TextInput
//                 style={styles.expandedInput}
//                 value={value}
//                 onChangeText={onChangeText}
//                 multiline
//                 placeholder={placeholder}
//                 placeholderTextColor="#666"
//                 autoFocus
//                 keyboardAppearance="dark"
//               />

//               <TouchableOpacity
//                 style={[
//                   styles.sendButton,
//                   (!value.trim() || !selectedConfig) && styles.disabledButton
//                 ]}
//     onPress={() => {
//       if (value.trim() && selectedConfig) {
//         onSend(value, selectedConfig);  // Pass both the message and config
//         onClose();
//       }
//     }}
//     disabled={!value.trim() || !selectedConfig}
//   >
//     <Text style={[
//       styles.sendButtonText,
//       (!value.trim() || !selectedConfig) && styles.disabledButtonText
//     ]}>
//       Send
//     </Text>
//   </TouchableOpacity>
//               <ConfigSelect
//                 visible={configSelectVisible}
//                 onClose={() => setConfigSelectVisible(false)}
//                 onSelect={(config) => {
//                   onConfigSelect(config);
//                   setConfigSelectVisible(false);
//                 }}
//               />
//             </Animated.View>
//           </TouchableWithoutFeedback>
//         </View>
//       </TouchableWithoutFeedback>
//     </KeyboardAvoidingView>
//   );
// };

// export default InputModal;
