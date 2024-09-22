import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from '@/components/useColorScheme';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


function CustomDrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white'}}>TrainSmart</Text>
      </View>
      <DrawerItemList {...props}/>
    </DrawerContentScrollView>
  );
}

    export default function AppLayout() {
      const colorScheme = useColorScheme();
    
      return (
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={({ navigation }) => ({
            headerShown: true,
            drawerActiveTintColor: '#007AFF',
            drawerInactiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
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
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="user-data"
        options={{
          drawerLabel: 'Profile',
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
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
});