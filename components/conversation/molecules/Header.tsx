import { HeaderProps } from "@/types/chat";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, View, TouchableOpacity, Platform, StatusBar, StyleSheet, Text } from "react-native";

const Header: React.FC<HeaderProps> = ({ title, subtitle, showNavigation }) => {
  const router = useRouter();

  const handleHomePress = () => {
    router.push("/(drawer)/(drawer-screens)");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {showNavigation && (
            <View style={styles.navigationContainer}>
              <TouchableOpacity 
                onPress={handleHomePress}
                style={styles.navButton}
              >
                <Ionicons name="home" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.textContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Header
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#1f281f',
  },
  container: {
    padding: 16,
    backgroundColor: '#1f281f',
    borderBottomWidth: 1,
    borderBottomColor: '#2a332a',
    marginBottom: 8,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  navButton: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0aba0',
    fontWeight: '400',
  },
});