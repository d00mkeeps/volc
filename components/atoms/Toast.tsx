import Toast from "react-native-toast-message";

export interface ToastNotification {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

// Convert our toast types to react-native-toast-message types
const convertType = (type: ToastNotification["type"]) => {
  switch (type) {
    case "warning":
      return "info"; // react-native-toast-message doesn't have warning, use info
    default:
      return type;
  }
};

// Global function for showing toasts (for use in stores)
export const showToast = (notification: ToastNotification): void => {
  Toast.show({
    type: convertType(notification.type),
    text1: notification.title,
    text2: notification.message,
    visibilityTime: notification.duration || 4000,
    // Add custom styling for warning type
    ...(notification.type === "warning" && {
      props: {
        text1Style: { color: "#f59e0b" },
        text2Style: { color: "#92400e" },
      },
    }),
  });
};

// Convenience functions
export const showSuccessToast = (
  title: string,
  message: string,
  duration?: number
) => showToast({ type: "success", title, message, duration });

export const showErrorToast = (
  title: string,
  message: string,
  duration?: number
) => showToast({ type: "error", title, message, duration });

export const showWarningToast = (
  title: string,
  message: string,
  duration?: number
) => showToast({ type: "warning", title, message, duration });

export const showInfoToast = (
  title: string,
  message: string,
  duration?: number
) => showToast({ type: "info", title, message, duration });

// Hook for components (optional)
export const useToast = () => {
  return {
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
  };
};
