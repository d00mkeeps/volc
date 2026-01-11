import React, { useRef, useEffect, useState } from "react";
import { View } from "react-native";
import { useTour } from "@/context/TourContext";
import { TourStepId } from "@/utils/tourPersistence";
import TourTooltip from "./TourTooltip";

interface TourStepProps {
  stepId: TourStepId;
  title: string;
  message: string;
  children: React.ReactElement;
  triggerCondition?: boolean;
}

export default function TourStep({
  stepId,
  title,
  message,
  children,
  triggerCondition = true,
}: TourStepProps) {
  const { shouldShowStep, startStep, completeStep, dismissStep, activeStep } =
    useTour();
  const targetRef = useRef<View>(null);
  const [targetPosition, setTargetPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [hasMeasured, setHasMeasured] = useState(false);

  const isActive = activeStep === stepId;

  useEffect(() => {
    if (shouldShowStep(stepId) && triggerCondition && !hasMeasured) {
      // Delay to ensure layout is ready
      const timer = setTimeout(() => {
        targetRef.current?.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            setTargetPosition({ x, y, width, height });
            setHasMeasured(true);
            startStep(stepId);
          }
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [stepId, triggerCondition, shouldShowStep, hasMeasured]);

  // Reset measurement when step completes
  useEffect(() => {
    if (!isActive && hasMeasured) {
      setHasMeasured(false);
    }
  }, [isActive]);

  return (
    <>
      <View ref={targetRef} collapsable={false}>
        {children}
      </View>
      <TourTooltip
        stepId={stepId}
        isVisible={isActive}
        title={title}
        message={message}
        targetPosition={targetPosition}
        onComplete={() => completeStep(stepId)}
        onDismiss={dismissStep}
      />
    </>
  );
}
