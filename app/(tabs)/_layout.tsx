import React, { useRef, useState, useEffect } from "react";
import { View } from "react-native";
import { YStack } from "tamagui";
import PagerView from "react-native-pager-view";
import { usePathname } from "expo-router";
import HomeScreen from "./index";
import WorkoutScreen from "./workouts";
import CustomTabBar from "@/components/organisms/CustomTabBar";
import { ChatOverlay } from "@/components/organisms/chat/ChatOverlay";
import { useLayoutStore } from "@/stores/layoutStore";

export default function TabLayout() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pathname = usePathname();
  const setTabBarHeight = useLayoutStore((state) => state.setTabBarHeight);

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

  return (
    <YStack flex={1} backgroundColor="$background">
      <View style={{ flex: 1, zIndex: 10 }}>
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
        <ChatOverlay currentPage={currentPage} />
        <CustomTabBar
          activeIndex={currentPage}
          onTabPress={handleTabPress}
          onLayout={setTabBarHeight}
        />
      </View>
    </YStack>
  );
}
