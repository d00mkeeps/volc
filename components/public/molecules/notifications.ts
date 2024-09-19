import { Platform } from 'react-native';

// You may need to install a library like 'react-native-toast-message' for this
import Toast from 'react-native-toast-message';

export const showNotification = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    // For web, you might want to use a different notification method
    alert(`${title}\n${message}`);
  } else {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
    });
  }
};