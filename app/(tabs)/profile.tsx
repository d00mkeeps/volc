// app/(tabs)/profile.tsx
import React, { useMemo, useCallback, useRef } from "react";
import { Stack, Text } from "tamagui";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSharedValue } from "react-native-reanimated";
import { Dimensions } from "react-native";

const { height: screenHeight } = Dimensions.get("window");

export default function ProfileScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const animatedIndex = useSharedValue(0);
  const animatedPosition = useSharedValue(0);

  const snapPoints = useMemo(() => {
    console.log("Testing higher percentages");
    return ["50%", "70%", "95%"];
  }, []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      console.log("Profile BottomSheet index:", index);
      console.log("Animated position:", animatedPosition.value);
      animatedIndex.value = index;
    },
    [animatedIndex, animatedPosition]
  );

  const testSnap = (index: number) => {
    console.log(`Trying to snap to index ${index} (${snapPoints[index]})`);
    bottomSheetRef.current?.snapToIndex(index);
  };

  return (
    <>
      {/* Content WITHOUT Stack container - positioned absolutely */}
      <Stack
        position="absolute"
        top={100}
        left={20}
        right={20}
        zIndex={1}
        backgroundColor="$background"
        padding="$4"
        borderRadius="$3"
      >
        <Text fontSize="$6" color="$color">
          Profile Screen
        </Text>
        <Text fontSize="$3" color="$textSoft">
          Screen height: {screenHeight}
        </Text>

        {/* Test buttons */}
        <Stack gap="$2" marginTop="$4">
          <Text
            onPress={() => testSnap(0)}
            style={{ color: "blue", padding: 10 }}
          >
            Snap to 25% ({Math.round(screenHeight * 0.25)}px)
          </Text>
          <Text
            onPress={() => testSnap(1)}
            style={{ color: "blue", padding: 10 }}
          >
            Snap to 50% ({Math.round(screenHeight * 0.5)}px)
          </Text>
          <Text
            onPress={() => testSnap(2)}
            style={{ color: "blue", padding: 10 }}
          >
            Snap to 75% ({Math.round(screenHeight * 0.75)}px)
          </Text>
        </Stack>
      </Stack>

      {/* BottomSheet WITHOUT parent Stack wrapper */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={false}
        animatedIndex={animatedIndex}
        animatedPosition={animatedPosition}
        backgroundStyle={{
          backgroundColor: "#1a1a1a",
        }}
        handleIndicatorStyle={{
          backgroundColor: "#666",
          width: 40,
          height: 4,
        }}
        handleStyle={{
          paddingVertical: 8,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 12,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => {
            const { height, width } = event.nativeEvent.layout;
            console.log(
              "BottomSheet actual rendered size:",
              width,
              "x",
              height
            );
          }}
        >
          <Text fontSize="$6" color="white" fontWeight="bold">
            BOTTOM SHEET DEBUG
          </Text>
          <Text fontSize="$4" color="white">
            Expected heights: 219px, 437px, 656px
          </Text>
          <Text fontSize="$4" color="white">
            Current positions: 499, 476, 281
          </Text>
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}
