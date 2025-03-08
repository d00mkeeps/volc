import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function InsightsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { 
          backgroundColor: '#222', 
          paddingTop: 4,
          borderTopColor:'#666' ,
          borderTopWidth: 2,
          display: 'none'
        },
        tabBarLabelStyle: { 
          fontSize: 12 
        },
      }}
    >
      {/* <Tabs.Screen
        name="visual-data"
        options={{
          title: 'Visual Data',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      /> */}
<Tabs.Screen
  name="workout-history"
  options={{
    title: 'History',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="book-outline" size={size} color={color} />
    ),
  }}
/>
   
    </Tabs>
  );
}