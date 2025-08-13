import { View, Text, StyleSheet } from "react-native";

type MessageType = "error" | "success" | "info";

interface SystemMessageProps {
  message: string;
  type: MessageType;
}

export function SystemMessage({ message, type }: SystemMessageProps) {
  const styles = getStyles(type);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {type === "success" && "✅ "}
        {type === "error" && "❌ "}
        {message}
      </Text>
    </View>
  );
}

const getStyles = (type: MessageType) =>
  StyleSheet.create({
    container: {
      backgroundColor:
        type === "error"
          ? "#ffebee"
          : type === "success"
          ? "#e8f5e8"
          : "#e3f2fd",
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor:
        type === "error"
          ? "#ffcdd2"
          : type === "success"
          ? "#c8e6c9"
          : "#bbdefb",
    },
    text: {
      color:
        type === "error"
          ? "#c62828"
          : type === "success"
          ? "#2e7d32"
          : "#1565c0",
      fontSize: 14,
    },
  });
