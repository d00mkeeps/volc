import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export const showNotification = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    //use a different notification method for web
    alert(`${title}\n${message}`);
  } else {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 2500,
      onShow: () => console.log('Toast showed'),
      onHide: () => console.log('Toast hidden'),
    });
  }
};