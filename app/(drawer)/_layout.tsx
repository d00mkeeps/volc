import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from '@/components/useColorScheme';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView, StatusBar } from 'react-native';
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
    header: ({ navigation, route, options }) => (
      <SafeAreaView style={{ 
        backgroundColor: '#222',
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
      }}>
        <View style={{
          height: 24,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}>
          {/* Left - Drawer Toggle */}
          <TouchableOpacity 
            onPress={() => navigation.toggleDrawer()}
            style={{ 
              padding: 8,
              position: 'absolute',
              left: 8,
              zIndex: 1
            }}
          >
            <Text>
              <Ionicons name="menu" size={20} color="#007AFF" />
            </Text>
          </TouchableOpacity>
          
          {/* Center - Title */}
          <View style={{ 
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <TouchableOpacity 
              onPress={() => router.push('/(drawer)')}
              style={{
              }}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#007AFF',
              }}>
                TrainSmart
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Right - Buttons */}
          <View style={[
            styles.headerButtonContainer, 
            { 
              position: 'absolute',
              right: 8,
              zIndex: 1
            }
          ]}>
            <TouchableOpacity
              onPress={() => navigation.setParams({ openWelcomeModal: true })}
              style={[styles.headerButton, { width: 28, height: 28 }]}
            >
              <Text style={[styles.headerButtonText, { fontSize: 14 }]}>W</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('programs')}
              style={[styles.headerButton, { width: 28, height: 28 }]}
            >
              <Text style={[styles.headerButtonText, { fontSize: 14 }]}>P</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
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
    color: '#007AFF', 
    marginHorizontal: 16,
    textAlign: 'center'
  },
});