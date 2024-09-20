import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import React, { useState } from 'react';
import { Button } from '@/components/public/atoms';
import { WelcomeModal } from '@/components/welcomeModal/WelcomeModal';
import Toast from 'react-native-toast-message';
import { DrawerToggleButton } from '@react-navigation/drawer';

export default function HomeScreen() {
  const [openWelcomeModal, setOpenWelcomeModal] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>TrainSmart</Text>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <Button onPress={() => setOpenWelcomeModal(true)}>
          Open Welcome Modal
        </Button>
        <WelcomeModal isVisible={openWelcomeModal} onClose={() => setOpenWelcomeModal(false)} />
      </View>
      <Toast />
    </>
  );
}

HomeScreen.navigationOptions = {
  headerLeft: () => <DrawerToggleButton />,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});