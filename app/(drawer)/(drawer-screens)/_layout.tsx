import React, {} from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { 
  TouchableOpacity,
  Text,
  Platform,
  SafeAreaView,
  StatusBar,
  View,
  StyleSheet} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type IconProps = {
  color: string;
  size: number;
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();

  return (
    <DrawerContentScrollView {...props}>
      <TouchableOpacity 
        style={{ padding: 16 }}
        onPress={() => router.push('/')}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#999'}}>TrainSmart</Text>
      </TouchableOpacity>
      <DrawerItemList {...props}/>
    </DrawerContentScrollView>
  );
}


export default function DrawerScreensLayout() {
   const router = useRouter()
  
  return (
    
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        header: ({ navigation, route }) => (
          <SafeAreaView style={styles.headerContainer}>
            <View style={styles.headerContent}>
              {/* Left - Drawer Toggle */}
              <TouchableOpacity 
                onPress={() => navigation.toggleDrawer()}
                style={styles.menuButton}
              >
                <Ionicons name="menu" size={24} color="#007AFF" />
              </TouchableOpacity>
              
              {/* Center - Title */}
              <TouchableOpacity 
                onPress={() => router.push("/(drawer)/(drawer-screens)")}
                style={styles.titleButton}
              >
                <Text style={styles.headerTitle}>TrainSmart</Text>
              </TouchableOpacity>
              

              
              {/* Right - Buttons */}
                <View style={styles.headerButtonContainer}>
                <TouchableOpacity
                  onPress={() => navigation.setParams({ openWelcomeModal: true })}
                  style={styles.headerButton}
                >
                  <Text style={styles.headerButtonText}>W</Text>
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
          drawerIcon: ({ color, size }: IconProps) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="programs"
        options={{
          drawerLabel: 'Programs',
          title: 'Programs',
          drawerIcon: ({ color, size }: IconProps) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Add other drawer screens here */}
    </Drawer>
    
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#222',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  headerContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  menuButton: {
    padding: 8,
  },
  titleButton: {
    flex: 1,
    alignItems: 'center',
    color: '#0f3310'
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#559e55',
  },
  headerButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animationDebugContainer: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(255, 0, 0, 0.2)', // Debug background
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#559e55',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 200,
    height: 200,
  },
});