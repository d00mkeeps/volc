import React, { useRef, useState } from "react";
import { View } from "react-native";
import { YStack } from "tamagui";
import PagerView from "react-native-pager-view";
import CustomTabBar from "@/components/organisms/CustomTabBar";

// Import your screen components
import HomeScreen from "./index";
import ProfileScreen from "./profile";
import ChatScreen from "./chats";
import WorkoutScreen from "./workouts";

export default function TabLayout() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

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
          <ChatScreen />
        </View>
        <View key="leaderboard" style={{ flex: 1 }}>
          <WorkoutScreen isActive={currentPage === 3} />
        </View>
      </PagerView>

      <CustomTabBar activeIndex={currentPage} onTabPress={handleTabPress} />
    </YStack>
  );
}
