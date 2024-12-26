import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

export default function DrawerLayout() {

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Stack 
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="(drawer-screens)" />
        <Stack.Screen name="conversation" />
      </Stack>
    </GestureHandlerRootView>
  );
}