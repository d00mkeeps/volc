import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { tourPersistence, TourStepId } from "@/utils/tourPersistence";
import { useUserStore } from "@/stores/userProfileStore";

interface TourContextValue {
  activeStep: TourStepId | null;
  completedSteps: Set<TourStepId>;
  tourEnabled: boolean;
  shouldShowStep: (stepId: TourStepId) => boolean;
  startStep: (stepId: TourStepId) => void;
  completeStep: (stepId: TourStepId) => void;
  dismissStep: () => void;
  resetTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

const ALL_TOUR_STEPS: TourStepId[] = [
  "exercise_notes",
  "exercise_definition",
  "exercise_change",
  "navigation_features",
];

export function TourProvider({ children }: { children: ReactNode }) {
  const { userProfile, updateProfile } = useUserStore();
  const [activeStep, setActiveStep] = useState<TourStepId | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<TourStepId>>(
    new Set()
  );
  const [initialized, setInitialized] = useState(false);

  // Tour is enabled if user hasn't completed it on the server
  const hasCompletedTour = userProfile?.completed_onboarding_tour ?? false;
  const tourEnabled = !hasCompletedTour;

  useEffect(() => {
    if (!tourEnabled) {
      setInitialized(true);
      return;
    }

    tourPersistence.getState().then((state) => {
      setCompletedSteps(new Set(state.completedSteps));
      setInitialized(true);
    });
  }, [tourEnabled]);

  const shouldShowStep = (stepId: TourStepId): boolean => {
    return (
      tourEnabled &&
      initialized &&
      !completedSteps.has(stepId) &&
      activeStep === null
    );
  };

  const startStep = (stepId: TourStepId) => {
    if (!completedSteps.has(stepId)) {
      setActiveStep(stepId);
    }
  };

  const completeStep = async (stepId: TourStepId) => {
    await tourPersistence.markComplete(stepId);
    const newCompleted = new Set([...completedSteps, stepId]);
    setCompletedSteps(newCompleted);
    setActiveStep(null);

    // If all steps done, mark tour complete on server
    if (ALL_TOUR_STEPS.every((step) => newCompleted.has(step))) {
      await updateProfile({ completed_onboarding_tour: true });
      console.log("🎉 Onboarding tour completed!");
    }
  };

  const dismissStep = () => {
    setActiveStep(null);
  };

  const resetTour = async () => {
    await tourPersistence.reset();
    await updateProfile({ completed_onboarding_tour: false });
    setCompletedSteps(new Set());
    setActiveStep(null);
  };

  return (
    <TourContext.Provider
      value={{
        activeStep,
        completedSteps,
        tourEnabled,
        shouldShowStep,
        startStep,
        completeStep,
        dismissStep,
        resetTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within TourProvider");
  }
  return context;
}
