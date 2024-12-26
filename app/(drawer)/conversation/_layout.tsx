import { Stack } from 'expo-router';

export default function ConversationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#1f281f',
        
        },
      }}
    />
  );
}