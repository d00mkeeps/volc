// /components/organisms/WelcomeBottomSheet.tsx
import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Animated } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useTheme } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useLayoutStore } from "@/stores/layoutStore";
import { useUserStore } from "@/stores/userProfileStore";
import { userProfileService } from "@/services/db/userProfile";
import Toast from "react-native-toast-message";
import { MetaEvents } from "@/services/analytics/metaEvents";

import Slide1 from "./Slide1";
import Slide2 from "./Slide2";
import Slide4 from "./Slide4";

import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useChatStore } from "@/stores/chat/ChatStore";

interface WelcomeBottomSheetProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function WelcomeBottomSheet({
  isVisible,
  onComplete,
}: WelcomeBottomSheetProps) {
  console.log("[WelcomeBottomSheet] Render - isVisible:", isVisible);

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const { user } = useAuth();
  const refreshProfile = useUserStore((state) => state.refreshProfile);

  // State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [isImperial, setIsImperial] = useState<boolean | null>(null);
  const [dob, setDob] = useState(new Date(2000, 0, 1)); // Default: Jan 1, 2000
  const [dobChanged, setDobChanged] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [trainingLocation, setTrainingLocation] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // Animation refs for 4 slides
  const slideOpacity = useRef([
    new Animated.Value(1), // Slide 0 starts visible
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const slideTranslateX = useRef([
    new Animated.Value(0), // Slide 0 starts at position
    new Animated.Value(50),
    new Animated.Value(50),
  ]).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  const screenHeight = useLayoutStore((state) => state.screenHeight);
  const snapPoints = useMemo(() => [screenHeight * 0.7], [screenHeight]);

  // Handle visibility changes
  useEffect(() => {
    console.log("[WelcomeBottomSheet] isVisible changed:", isVisible);

    if (isVisible) {
      console.log("[WelcomeBottomSheet] Presenting modal");
      bottomSheetRef.current?.present();
      // Reset to slide 0
      setCurrentSlide(0);
      slideOpacity.forEach((anim, i) => anim.setValue(i === 0 ? 1 : 0));
      slideTranslateX.forEach((anim, i) => anim.setValue(i === 0 ? 0 : 50));
      setIsImperial(null);
      setDob(new Date(2000, 0, 1)); // Reset to Jan 1, 2000
      setDobChanged(false);
      setExperienceLevel("");
      setTrainingLocation("");
      setHeight("");
      setWeight("");
      iconOpacity.setValue(0);
    } else {
      console.log("[WelcomeBottomSheet] Dismissing modal");
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible]);

  // DOB Icon Animation
  useEffect(() => {
    if (dobChanged) {
      console.log("[WelcomeBottomSheet] DOB changed, animating icon");
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [dobChanged]);

  // Log on mount/unmount
  useEffect(() => {
    console.log("[WelcomeBottomSheet] Component mounted");
    return () => console.log("[WelcomeBottomSheet] Component unmounted");
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={1}
        opacity={0.5}
        pressBehavior="none"
      />
    ),
    [],
  );

  const goToSlide = (targetIndex: number) => {
    console.log("[WelcomeBottomSheet] goToSlide:", targetIndex);
    const currentIndex = currentSlide;
    const direction = targetIndex > currentIndex ? -50 : 50;

    Animated.parallel([
      Animated.timing(slideOpacity[currentIndex], {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideTranslateX[currentIndex], {
        toValue: direction,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideOpacity[targetIndex], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideTranslateX[targetIndex], {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentSlide(targetIndex);
    });
  };

  const handleComplete = async () => {
    console.log("[WelcomeBottomSheet] handleComplete called");

    if (!user || isImperial === null) {
      console.log("[WelcomeBottomSheet] Missing required data:", {
        hasUser: !!user,
        isImperial,
      });
      return;
    }

    // Dismiss modal and show success toast immediately (Optimistic)
    if (onComplete) onComplete();
    bottomSheetRef.current?.dismiss();

    Toast.show({
      type: "success",
      text1: "Profile setup complete!",
    });

    // Perform save in background
    (async () => {
      try {
        console.log("[WelcomeBottomSheet] Saving profile data (background):", {
          isImperial,
          dob: dob.toISOString().split("T")[0],
        });

        await userProfileService.completeOnboarding({
          isImperial,
          dob,
          experienceLevel: experienceLevel || undefined,
          trainingLocation: trainingLocation || undefined,
          height: height || undefined,
          weight: weight || undefined,
        });

        await refreshProfile();

        console.log("[WelcomeBottomSheet] Profile saved successfully in background");

        // Track registration completion for Meta ads
        MetaEvents.logCompleteRegistration();

        const workoutCount = useWorkoutStore.getState().workouts.length;
        if (workoutCount === 0) {
          // Ensure correct v2 greeting is computed
          useChatStore.getState().computeGreeting();
          
          setTimeout(() => {
            useConversationStore.getState().setPendingChatOpen(true);
          }, 500);
        }
      } catch (error) {
        console.error(
          "[WelcomeBottomSheet] Background error saving profile:",
          error,
        );
        // We could show an error toast here, but since the user is already past the modal,
        // it might be confusing. For now, we'll just log it.
      }
    })();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isAgeValid = (date: Date) => {
    const today = new Date();
    const minAgeDate = new Date(
      today.getFullYear() - 16,
      today.getMonth(),
      today.getDate(),
    );
    return date <= minAgeDate;
  };

  const canProgressDob = dobChanged && isAgeValid(dob);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={1}
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
      enableHandlePanningGesture={false}
      enableOverDrag={false}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onChange={(index) =>
        console.log("[WelcomeBottomSheet] Sheet index changed to:", index)
      }
      backgroundStyle={{
        backgroundColor: theme.background.val,
      }}
      handleIndicatorStyle={{
        backgroundColor: "#1f1c1cff",
        width: 40,
        height: 4,
      }}
      handleStyle={{
        paddingVertical: 8,
      }}
    >
      <BottomSheetView
        style={{
          paddingBottom: insets.bottom + 20,
          flex: 1,
        }}
      >
        {/* Slide 1: Units */}
        <Animated.View
          style={{
            position: "absolute",
            flex: 1,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: slideOpacity[0],
            transform: [{ translateX: slideTranslateX[0] }],
          }}
          pointerEvents={currentSlide === 0 ? "auto" : "none"}
        >
          <Slide1
            isImperial={isImperial}
            setIsImperial={setIsImperial}
            goToSlide={goToSlide}
          />
        </Animated.View>

        {/* Slide 2: DOB */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: slideOpacity[1],
            transform: [{ translateX: slideTranslateX[1] }],
          }}
          pointerEvents={currentSlide === 1 ? "auto" : "none"}
        >
          <Slide2
            theme={theme}
            dob={dob}
            setDob={setDob}
            dobChanged={dobChanged}
            setDobChanged={setDobChanged}
            formatDate={formatDate}
            isAgeValid={isAgeValid}
            iconOpacity={iconOpacity}
            canProgressDob={canProgressDob}
            goToSlide={goToSlide}
          />
        </Animated.View>

        {/* Slide 3: Height & Weight (Successive to DOB) */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: slideOpacity[2],
            transform: [{ translateX: slideTranslateX[2] }],
          }}
          pointerEvents={currentSlide === 2 ? "auto" : "none"}
        >
          <Slide4
            theme={theme}
            isImperial={isImperial}
            height={height}
            setHeight={setHeight}
            weight={weight}
            setWeight={setWeight}
            loading={loading}
            handleComplete={handleComplete}
            goToSlide={goToSlide}
          />
        </Animated.View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
