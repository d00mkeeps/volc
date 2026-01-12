// /components/organisms/WelcomeBottomSheet.tsx
import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Animated, Dimensions } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useTheme } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useUserStore } from "@/stores/userProfileStore";
import { userProfileService } from "@/services/db/userProfile";
import Toast from "react-native-toast-message";
import { MetaEvents } from "@/services/analytics/metaEvents";

import Slide1 from "./Slide1";
import Slide2 from "./Slide2";
import Slide3 from "./Slide3";
import Slide4 from "./Slide4";

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
  const [dob, setDob] = useState(new Date());
  const [dobChanged, setDobChanged] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);
  const [trainingLocation, setTrainingLocation] = useState<string | null>(null);
  const [locationOther, setLocationOther] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // Animation refs for 4 slides
  const slideOpacity = useRef([
    new Animated.Value(1), // Slide 0 starts visible
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const slideTranslateX = useRef([
    new Animated.Value(0), // Slide 0 starts at position
    new Animated.Value(50),
    new Animated.Value(50),
    new Animated.Value(50),
  ]).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  const snapPoints = useMemo(() => {
    const screenHeight = Dimensions.get("window").height;
    return [screenHeight * 0.7];
  }, []);

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
      setDob(new Date());
      setDobChanged(false);
      setExperienceLevel(null);
      setTrainingLocation(null);
      setLocationOther("");
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
    []
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

    if (!user || isImperial === null || !trainingLocation || !experienceLevel) {
      console.log("[WelcomeBottomSheet] Missing required data:", {
        hasUser: !!user,
        isImperial,
        trainingLocation,
        experienceLevel,
      });
      return;
    }

    setLoading(true);
    try {
      const finalLocation =
        trainingLocation === "other" ? locationOther : trainingLocation;

      console.log("[WelcomeBottomSheet] Saving profile data:", {
        isImperial,
        dob: dob.toISOString().split("T")[0],
        experienceLevel,
        trainingLocation: finalLocation,
      });

      await userProfileService.completeOnboarding({
        isImperial,
        dob,
        experienceLevel,
        trainingLocation: finalLocation,
        height: height || undefined,
        weight: weight || undefined,
      });

      await refreshProfile();

      console.log("[WelcomeBottomSheet] Profile saved successfully");

      // Track registration completion for Meta ads
      MetaEvents.logCompleteRegistration();

      Toast.show({
        type: "success",
        text1: "Profile setup complete!",
      });

      if (onComplete) onComplete();
      bottomSheetRef.current?.dismiss();
    } catch (error) {
      console.error("[WelcomeBottomSheet] Error saving profile:", error);
      Toast.show({
        type: "error",
        text1: "Failed to save profile",
        text2: "Please try again",
      });
    } finally {
      setLoading(false);
    }
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
      today.getDate()
    );
    return date <= minAgeDate;
  };

  const canProgressDob = dobChanged && isAgeValid(dob);
  const canProgressExperience =
    trainingLocation !== null &&
    (trainingLocation !== "other" || locationOther.trim() !== "");

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={1}
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
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

        {/* Slide 3: Experience & Location */}
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
          <Slide3
            theme={theme}
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
            trainingLocation={trainingLocation}
            setTrainingLocation={setTrainingLocation}
            locationOther={locationOther}
            setLocationOther={setLocationOther}
            canProgressExperience={canProgressExperience}
            goToSlide={goToSlide}
          />
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: slideOpacity[3],
            transform: [{ translateX: slideTranslateX[3] }],
          }}
          pointerEvents={currentSlide === 3 ? "auto" : "none"}
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
