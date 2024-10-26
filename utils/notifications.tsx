import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export const showNotification = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    // For web, use a different notification method
    alert(`${title}\n${message}`);
  } else {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
    });
  }
};