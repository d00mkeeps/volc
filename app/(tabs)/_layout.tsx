import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={({ navigation }) => ({
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#222',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#559e55',
        tabBarInactiveTintColor: '#999',
        header: ({ navigation, route }) => (
          <SafeAreaView style={styles.headerContainer}>
            <View style={styles.headerContent}>
              {/* Center - Title */}
              <TouchableOpacity 
                onPress={() => router.push("/(tabs)")}
                style={styles.titleButton}
              >
                <Text style={styles.headerTitle}>TrainSmart</Text>
              </TouchableOpacity>

              {/* Right - W Button */}
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: 'Programs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#222',
  },
  headerContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  titleButton: {
    flex: 1,
    alignItems: 'center',
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
});