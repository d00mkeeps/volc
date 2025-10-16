import React, { useRef, useState, useEffect } from "react";
import { View } from "react-native";
import { YStack } from "tamagui";
import PagerView from "react-native-pager-view";
import { usePathname } from "expo-router";
import CustomTabBar from "@/components/organisms/CustomTabBar";

// Import your screen components
import HomeScreen from "./index";
import ProfileScreen from "./profile";
import ChatScreen from "./chats";
import WorkoutScreen from "./workouts";

export default function TabLayout() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pathname = usePathname();

  // Map routes to page indices
  const routeToPage: Record<string, number> = {
    "/": 0,
    "/profile": 1,
    "/chats": 2,
    "/workouts": 3,
  };

  // Sync PagerView with route changes
  useEffect(() => {
    const targetPage = routeToPage[pathname];
    if (targetPage !== undefined && targetPage !== currentPage) {
      console.log(
        `📱 Route changed: ${pathname} -> switching to page ${targetPage}`
      );
      pagerRef.current?.setPage(targetPage);
      setCurrentPage(targetPage);
    }
  }, [pathname]);

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  };

  return (
    <YStack flex={1}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        <View key="home" style={{ flex: 1 }}>
          <HomeScreen />
        </View>
        <View key="profile" style={{ flex: 1 }}>
          <ProfileScreen />
        </View>
        <View key="chats" style={{ flex: 1 }}>
          <ChatScreen isActive={currentPage === 2} />
        </View>
        <View key="leaderboard" style={{ flex: 1 }}>
          <WorkoutScreen isActive={currentPage === 3} />
        </View>
      </PagerView>

      <CustomTabBar activeIndex={currentPage} onTabPress={handleTabPress} />
    </YStack>
  );
}
