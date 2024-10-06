import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from '@/components/useColorScheme';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();

  return (
    <DrawerContentScrollView {...props}>
      <TouchableOpacity 
        style={{ padding: 16 }}
        onPress={() => router.push('/')}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white'}}>TrainSmart</Text>
      </TouchableOpacity>
      <DrawerItemList {...props}/>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter()

  return (
    <GestureHandlerRootView style={{flex: 1}}>
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        headerTitle: () => (
          <TouchableOpacity onPress={() => router.push('/(drawer)')}>
            <Text style={styles.headerTitle}>TrainSmart</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.headerButtonContainer}>
            <TouchableOpacity
              onPress={() => navigation.setParams({ openWelcomeModal: true })}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>W</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('programs')}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>P</Text>
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="programs"
        options={{
          drawerLabel: 'Programs',
          title: 'Programs',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
    <Drawer.Screen
          name="insights"
          options={{
            drawerLabel: 'Insights',
            title: 'Insights',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
          }}
        />
      <Drawer.Screen
        name="user"
        options={{
          drawerLabel: 'Profile',
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  headerButtonContainer: {
    flexDirection: 'row',
    marginRight: 10,
  },
  headerButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF', // You can adjust this color as needed
  },
});