import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Keyboard, Platform, useColorScheme, Animated, TouchableOpacity } from "react-native";
import { Stack, useTheme, XStack, YStack } from "tamagui";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Check, X, ChevronLeft } from "@/assets/icons/IconMap";

interface WelcomeBottomSheetProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function WelcomeBottomSheet({ isVisible, onComplete }: WelcomeBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["60%"], []);
  
  const [dob, setDob] = useState<Date>(() => new Date(2000, 0, 1));
  const [hasChanged, setHasChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showState2, setShowState2] = useState(false);
  const [isImperial, setIsImperial] = useState<boolean | null>(null); // null = no selection
  
  const { user } = useAuth();
  const theme = useTheme();
  const colorScheme = useColorScheme();

  // Animation values
  const state1Opacity = useRef(new Animated.Value(1)).current;
  const state1TranslateX = useRef(new Animated.Value(0)).current;
  const state2Opacity = useRef(new Animated.Value(0)).current;
  const state2TranslateX = useRef(new Animated.Value(50)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
      // Reset animation values when sheet opens
      state1Opacity.setValue(1);
      state1TranslateX.setValue(0);
      state2Opacity.setValue(0);
      state2TranslateX.setValue(50);
      setShowState2(false);
      setIsImperial(null);
      setHasChanged(false);
      iconOpacity.setValue(0);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible]);

  useEffect(() => {
    if (hasChanged) {
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [hasChanged]);

  // WelcomeBottomSheet.handleUnitSelect - Auto-progress to State 2 when unit is selected
  const handleUnitSelect = (imperial: boolean) => {
    setIsImperial(imperial);
    
    // Auto-advance to State 2
    setTimeout(() => {
      setShowState2(true);
      Animated.parallel([
        Animated.timing(state1Opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(state1TranslateX, {
          toValue: -50,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(state2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(state2TranslateX, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 150); // Small delay for visual feedback
  };

  // WelcomeBottomSheet.handleBackToState1 - Navigate back to unit selection
  const handleBackToState1 = () => {
    setShowState2(false);
    Animated.parallel([
      Animated.timing(state2Opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(state2TranslateX, {
        toValue: 50,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(state1Opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(state1TranslateX, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // WelcomeBottomSheet.handleComplete - Save DOB and unit preference
  const handleComplete = async () => {
    if (!dob || !user || isImperial === null) return;

    setLoading(true);
    try {
      const formattedDob = dob.toISOString().split('T')[0];
      
      const updates: any = { 
        dob: formattedDob,
        is_imperial: isImperial 
      };

      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("auth_user_uuid", user.id);

      if (error) throw error;

      Keyboard.dismiss();
      onComplete();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="none" 
      />
    ),
    []
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isAgeValid = (date: Date) => {
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    return date <= minAgeDate;
  };

  const isValid = isAgeValid(dob);

return (
  <BottomSheetModal
    ref={bottomSheetRef}
    index={0}
    snapPoints={snapPoints}
    backdropComponent={renderBackdrop}
    enablePanDownToClose={false}
    enableContentPanningGesture={false}
    enableHandlePanningGesture={false}
    backgroundStyle={{ backgroundColor: theme.background.val }}
    handleIndicatorStyle={{ backgroundColor: theme.color.val }}
  >
    <BottomSheetView style={{ flex: 1, padding: 24, paddingBottom: 48 }}>
      <YStack flex={1} position="relative">
        
{/* State 1: Welcome + Unit Selection */}
<Animated.View
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    opacity: state1Opacity,
    transform: [{ translateX: state1TranslateX }],
  }}
  pointerEvents={showState2 ? 'none' : 'auto'}
>
  <YStack paddingTop="$2">
    
    {/* Header */}
    <YStack paddingBottom="$2">
      <Text size="large" fontWeight="700" fontSize={28}>
        Welcome to Volc! 🌋
      </Text>
    </YStack>

    {/* Main Content Section */}
    <YStack gap="$4" alignItems="center" justifyContent="center" paddingTop="$10">
      
      {/* Label */}
      <Text fontSize={18} fontWeight="600" color="$color" marginBottom="$2">
        Which do you use?
      </Text>

{/* Segmented Control */}
<XStack 
  backgroundColor="$gray4" 
  borderRadius="$4" 
  padding="$1.5"
  width="100%"
>
  <Button
    flex={1}
    backgroundColor={isImperial === false ? '$background' : 'transparent'}
    borderRadius="$3"
    paddingVertical="$2"
    onPress={() => handleUnitSelect(false)}
    pressStyle={{ opacity: 0.8 }}
    borderColor={'$primary'}
    borderWidth={isImperial === false ? 0.25 : 0}
    shadowColor={isImperial === false ? "$shadowColor" : "transparent"}
    shadowOffset={isImperial === false ? { width: 0, height: 1 } : { width: 0, height: 0 }}
    shadowOpacity={isImperial === false ? 0.1 : 0}
    shadowRadius={isImperial === false ? 2 : 0}
    elevation={isImperial === false ? 2 : 0}
  >
    <Text 
      fontWeight={isImperial === false ? '600' : '400'}
      color={isImperial === false ? '$color' : '$textMuted'}
      fontSize={16}
    >
      kg / km
    </Text>
  </Button>
  
  <Button
    flex={1}
    backgroundColor={isImperial === true ? '$background' : 'transparent'}
    borderRadius="$3"
    paddingVertical="$2"
    onPress={() => handleUnitSelect(true)}
    pressStyle={{ opacity: 0.8 }}
    borderColor={'$primary'}
    borderWidth={isImperial === true ? 0.25 : 0}
    shadowColor={isImperial === true ? "$shadowColor" : "transparent"}
    shadowOffset={isImperial === true ? { width: 0, height: 1 } : { width: 0, height: 0 }}
    shadowOpacity={isImperial === true ? 0.1 : 0}
    shadowRadius={isImperial === true ? 2 : 0}
    elevation={isImperial === true ? 2 : 0}
  >
    <Text 
      fontWeight={isImperial === true ? '600' : '400'}
      color={isImperial === true ? '$color' : '$textMuted'}
      fontSize={16}
    >
      lbs / miles
    </Text>
  </Button>
</XStack>


      {/* Unit preview - only show when selected */}
      {/* Unit preview removed per feedback */}

    </YStack>

  </YStack>
</Animated.View>
        {/* State 2: DOB Entry */}
        <Animated.View
          style={{
            flex: 1,
            opacity: state2Opacity,
            transform: [{ translateX: state2TranslateX }],
          }}
          pointerEvents={showState2 ? 'auto' : 'none'}
        >
          <YStack flex={1} justifyContent="space-between">
            
            {/* Header with Back Button */}
            <YStack paddingBottom="$2">
              <XStack alignItems="center" gap="$2" marginBottom="$1">
                <TouchableOpacity 
                  onPress={handleBackToState1}
                  style={{ padding: 4, marginLeft: -4 }}
                >
                  <ChevronLeft size={28} color={theme.color.val} />
                </TouchableOpacity>
                <Text size="large" fontWeight="700" fontSize={24}>
                  Please enter your birthday
                </Text>
              </XStack>
            </YStack>

            {/* Main Content Section (Centered) */}
            <YStack alignItems="center" justifyContent="center" flex={1}>
              
              {/* Date Display with Validation Icon */}
              <YStack alignItems="center" gap="$2">
                <XStack alignItems="center" gap="$3">
                  <Text 
                    color={"$textMuted"} 
                    fontWeight="700"
                    fontSize={22}
                    textAlign="center"
                  >
                    {formatDate(dob)}
                  </Text>
                  
                  <Animated.View style={{ opacity: iconOpacity }}>
                    {isValid ? (
                      <Check size={36} color="$green8" />
                    ) : (
                      <X size={36} color="$red8" />
                    )}
                  </Animated.View>
                </XStack>

                {/* Always render but control opacity */}
                <Text 
                  color="$red10" 
                  fontSize={14} 
                  textAlign="center"
                  opacity={hasChanged && !isValid ? 1 : 0}
                >
                  You must be 16 or older to use Volc
                </Text>
              </YStack>

              {/* Date Picker */}
              <Stack 
                backgroundColor="transparent"
                borderRadius="$4" 
                overflow="hidden"
                width="100%"
                alignItems="center"
                paddingVertical="$2"
              >
                <DateTimePicker
                  value={dob}
                  mode="date"
                  display="spinner"
                  themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setDob(selectedDate);
                      setHasChanged(true);
                    }
                  }}
                  minimumDate={(() => {
                    const minDate = new Date();
                    minDate.setFullYear(minDate.getFullYear() - 100);
                    return minDate;
                  })()}
                  style={{ height: 180 }}
                  maximumDate={new Date()}
                />
              </Stack>
            </YStack>

            {/* Continue Button */}
   {/* Continue Button */}
<Button
  onPress={handleComplete}
  disabled={!hasChanged || !isValid || loading}
  marginBottom="$8"
  size="large"
  shadowColor="$shadowColor"
  shadowOffset={{ width: 0, height: 2 }}
  shadowOpacity={0.15}
  shadowRadius={4}
  elevation={3}
>
  <Text color="white" fontWeight="600" fontSize={18}>
    {loading ? "Saving..." : "Done"}
  </Text>
</Button>

          </YStack>
        </Animated.View>

      </YStack>
    </BottomSheetView>
  </BottomSheetModal>
);

}