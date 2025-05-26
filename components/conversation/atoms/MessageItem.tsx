import React, { memo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { Message } from "@/types";
import { GraphImage } from "../../data/graph/atoms/GraphImage";
import { useData } from "@/context/DataContext";
import {
  WorkoutDataBundle,
  WorkoutWithConversation,
  CompleteWorkout,
  SetInput,
} from "@/types/workout";
import { WorkoutDataModal } from "../../data/table/WorkoutDataModal";
import WorkoutDetailModal from "@/components/workout/organisms/WorkoutDetailModal";
import { convertToCompleteWorkout } from "@/utils/workoutConversion";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  previousMessage?: Message;
}

const MessageItem: React.FC<MessageItemProps> = memo(
  ({ message, isStreaming = false, previousMessage }) => {
    const { getGraphBundlesByConversation, getWorkoutsByConversation } =
      useData();
    const [matchingBundle, setMatchingBundle] =
      useState<WorkoutDataBundle | null>(null);
    const [matchingWorkout, setMatchingWorkout] =
      useState<WorkoutWithConversation | null>(null);
    const [isLoadingGraph, setIsLoadingGraph] = useState(false);
    const [workoutDataModalVisible, setWorkoutDataModalVisible] =
      useState(false);
    const [workoutDetailModalVisible, setWorkoutDetailModalVisible] =
      useState(false);

    // Determine if this message has an associated graph or workout
    useEffect(() => {
      // Only assistant messages can have associated data and only if there's a previous user message
      if (
        message.sender === "assistant" &&
        previousMessage?.sender === "user"
      ) {
        // Check for graph bundles
        const bundles = getGraphBundlesByConversation(message.conversation_id);

        if (bundles.length) {
          const match = bundles.find(
            (bundle) =>
              bundle.original_query &&
              previousMessage.content.includes(bundle.original_query)
          );

          if (match) {
            setMatchingBundle(match);
            setIsLoadingGraph(false);
          }
        }

        // Check for workouts - get the most recent workout for this conversation
        const workouts = getWorkoutsByConversation(message.conversation_id);

        if (workouts.length) {
          // Get the most recent workout (should be the first one given our sort)
          const recentWorkout = workouts[0];

          // Set as matching workout if it's within a reasonable time window of this message
          // Add null check for timestamp
          if (recentWorkout) {
            const workoutTime = new Date(recentWorkout.created_at).getTime();

            // Check if message has a valid timestamp
            if (
              message.timestamp &&
              typeof message.timestamp.getTime === "function"
            ) {
              const messageTime = message.timestamp.getTime();

              // If workout was created within 10 seconds of message
              if (Math.abs(workoutTime - messageTime) < 10000) {
                setMatchingWorkout(recentWorkout);
              }
            } else {
              // If no valid timestamp, match the most recent workout anyway
              setMatchingWorkout(recentWorkout);
            }
          }
        }
      }
    }, [
      message,
      previousMessage,
      getGraphBundlesByConversation,
      getWorkoutsByConversation,
    ]);

    const completeWorkout = matchingWorkout
      ? convertToCompleteWorkout(matchingWorkout)
      : null;
    const exerciseCount = completeWorkout?.workout_exercises.length || 0;

    // Check if the message is short (for conditional styling)
    const isShortMessage = message.content.length < 100;

    // Ultra minimal markdown styles for short messages
    const markdownStyles = StyleSheet.create({
      // Base text style with absolutely no margins
      body: {
        fontSize: styles.text.fontSize,
        lineHeight: styles.text.lineHeight,
        color: message.sender === "user" ? "#041402" : "#def7dc",
        margin: 0,
        padding: 0,
      },

      // Regular paragraph with no margin
      paragraph: {
        marginVertical: 1,
        marginTop: 0,
        marginBottom: 0,
        paddingVertical: 0,
      },

      // Headings with reduced top margins
      heading1: {
        fontSize: 24,
        fontWeight: "700",
        marginTop: 6,
        marginBottom: 6,
        lineHeight: 28,
        color: message.sender === "user" ? "#041402" : "#def7dc",
      },
      heading2: {
        fontSize: 22,
        fontWeight: "700",
        marginTop: 6,
        marginBottom: 4,
        lineHeight: 26,
        color: message.sender === "user" ? "#041402" : "#def7dc",
      },
      heading3: {
        fontSize: 20,
        fontWeight: "600",
        marginTop: 5,
        marginBottom: 3,
        lineHeight: 24,
        color: message.sender === "user" ? "#041402" : "#def7dc",
      },
      heading4: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 4,
        marginBottom: 2,
        lineHeight: 22,
        color: message.sender === "user" ? "#041402" : "#def7dc",
      },
      heading5: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 3,
        marginBottom: 1,
        lineHeight: 20,
        color: message.sender === "user" ? "#041402" : "#def7dc",
      },
      heading6: {
        fontSize: 16,
        fontWeight: "600",
        fontStyle: "italic",
        marginTop: 2,
        marginBottom: 1,
        lineHeight: 20,
        color: message.sender === "user" ? "#041402" : "#def7dc",
      },

      // Text formatting
      strong: {
        fontWeight: "800",
      },
      em: {
        fontStyle: "italic",
      },

      // Lists with minimal indentation and spacing
      bullet_list: {
        marginLeft: 10,
        marginBottom: 0,
        marginTop: 0,
      },
      ordered_list: {
        marginLeft: 10,
        marginBottom: 0,
        marginTop: 0,
      },
      list_item: {
        marginBottom: 0,
      },

      // Code blocks
      code_inline: {
        fontFamily: "monospace",
        backgroundColor: message.sender === "user" ? "#a0e099" : "#1a291a",
        paddingHorizontal: 4,
        borderRadius: 3,
      },
      code_block: {
        fontFamily: "monospace",
        backgroundColor: message.sender === "user" ? "#a0e099" : "#1a291a",
        padding: 6,
        borderRadius: 5,
        marginVertical: 2,
      },

      // Links
      link: {
        color: message.sender === "user" ? "#006600" : "#8cd884",
        textDecorationLine: "underline",
      },
    });

    return (
      <View style={styles.messageWrapper}>
        <View
          style={[
            styles.container,
            message.sender === "user"
              ? styles.userMessage
              : styles.assistantMessage,
            isStreaming && styles.streamingMessage,
          ]}
        >
          {/* Graph at the top of assistant message */}
          {message.sender === "assistant" && matchingBundle?.chart_url && (
            <View style={styles.graphContainer}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setWorkoutDataModalVisible(true)}
              >
                <GraphImage
                  chartUrl={matchingBundle.chart_url}
                  width={280}
                  height={200}
                  inert={true}
                />
                <View style={styles.graphOverlay}>
                  <Text style={styles.graphOverlayText}>Tap for details</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Workout summary at the top of assistant message */}
          {message.sender === "assistant" && matchingWorkout && (
            <View style={styles.workoutContainer}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setWorkoutDetailModalVisible(true)}
                style={styles.workoutSummary}
              >
                <Text style={styles.workoutTitle}>{matchingWorkout.name}</Text>
                <Text style={styles.workoutSubtitle}>
                  {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
                </Text>
                <View style={styles.workoutOverlay}>
                  <Text style={styles.workoutOverlayText}>
                    Tap to view workout
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Message text content with Markdown support */}
          <View style={{ overflow: "visible" }}>
            <Markdown style={markdownStyles}>
              {message.content + (isStreaming ? "..." : "")}
            </Markdown>
          </View>

          {/* Loading indicator for graphs */}
          {isLoadingGraph && (
            <View style={styles.graphLoadingContainer}>
              <ActivityIndicator
                color={message.sender === "user" ? "#041402" : "#def7dc"}
                size="small"
              />
              <Text
                style={[
                  styles.graphLoadingText,
                  message.sender === "user"
                    ? styles.userText
                    : styles.assistantText,
                ]}
              >
                Preparing workout visualization...
              </Text>
            </View>
          )}
        </View>

        {/* Workout data modal */}
        <WorkoutDataModal
          visible={workoutDataModalVisible}
          onClose={() => setWorkoutDataModalVisible(false)}
          bundle={matchingBundle}
        />

        {/* Workout detail modal */}
        {completeWorkout && (
          <WorkoutDetailModal
            isVisible={workoutDetailModalVisible}
            workout={completeWorkout}
            onClose={() => setWorkoutDetailModalVisible(false)}
            onSave={async () => Promise.resolve()} // Return a Promise that resolves immediately
          />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  messageWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 1, // Minimal vertical padding
  },
  container: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 6, // Base padding, will be overridden for short messages
    borderRadius: 12,
    marginVertical: 2,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#b2f7aa",
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#041402",
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#041402",
  },
  assistantText: {
    color: "#def7dc",
  },
  streamingMessage: {
    opacity: 0.7,
  },
  graphContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  graphLoadingContainer: {
    marginTop: 10,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  graphLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    fontStyle: "italic",
  },
  graphOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
  },
  graphOverlayText: {
    color: "#fff",
    fontSize: 12,
  },
  // New styles for workout display
  workoutContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "center",
    width: "100%",
  },
  workoutSummary: {
    backgroundColor: "#272d27",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#8cd884",
    position: "relative",
  },
  workoutTitle: {
    color: "#8cd884",
    fontSize: 16,
    fontWeight: "bold",
  },
  workoutSubtitle: {
    color: "#def7dc",
    fontSize: 14,
    marginTop: 4,
  },
  workoutOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  workoutOverlayText: {
    color: "#fff",
    fontSize: 12,
  },
});

export default MessageItem;
