import React, { useRef, useState, useEffect } from "react";
import { View } from "react-native";
import { YStack } from "tamagui";
import PagerView from "react-native-pager-view";
import { usePathname } from "expo-router";

// Import your screen components
import HomeScreen from "./index";
import WorkoutScreen from "./workouts";
import CustomTabBar from "@/components/organisms/CustomTabBar";
import { ChatOverlay } from "@/components/organisms/chat/ChatOverlay";

interface TabLayoutProps {
  // Define any props if needed
}

export default function TabLayout() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pathname = usePathname();

  // Map routes to page indices
  const routeToPage: Record<string, number> = {
    "/": 0,
    "/workouts": 1,
  };

  // Sync PagerView with route changes
  useEffect(() => {
    const targetPage = routeToPage[pathname];
    if (targetPage !== undefined && targetPage !== currentPage) {
      console.log(
        `📱 Route changed: ${pathname} -> switching to page ${targetPage}`
      );
      pagerRef.current?.setPage(targetPage);
    }
  }, [pathname]);

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  };

  /*
   * ARCHITECTURE NOTE:
   * We wrap the entire PagerView in a container that has the TabBar and ChatOverlay at the bottom.
   * The ChatOverlay sits visually above the TabBar.
   * When collapsed, ChatOverlay is just the input bar.
   * When expanded, ChatOverlay fills the screen (covering PagerView and TabBar).
   */

  return (
    <YStack flex={1} backgroundColor="$background">
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        <View key="home">
          <HomeScreen />
        </View>
        <View key="workouts">
          <WorkoutScreen />
        </View>
      </PagerView>

      {/* Floating Overlay Component */}
      {/* 
        This sits at the bottom of the screen stack.
        It contains the InputArea (collapsed) AND the full Modal (expanded).
      */}
      <ChatOverlay tabBarHeight={50} />

      <CustomTabBar activeIndex={currentPage} onTabPress={handleTabPress} />
    </YStack>
  );
}
