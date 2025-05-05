import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
} from "react-native";
import {
  Appbar,
  Card,
  DataTable,
  List,
  Divider,
  Surface,
} from "react-native-paper";
import { Title } from "../../public/atoms/Title";
import { ToggleSwitch } from "../../public/atoms/ToggleSwitch";
import { useData } from "@/context/DataContext";
import SidebarWorkoutList from "../../data/workout/organisms/SidebarWorkoutList";
import { WorkoutDataBundle } from "@/types/workout";

interface SidebarProps {
  isOpen: boolean;
  conversationId: string;
  detailedAnalysis: boolean;
  onToggleAnalysis: (value: boolean) => void;
}

interface Performer {
  name: string;
  first_value: number;
  last_value: number;
  change: number;
  change_percent: number;
}

const SIDEBAR_WIDTH = 300;

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  conversationId,
  detailedAnalysis,
  onToggleAnalysis,
}) => {
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const { getGraphBundlesByConversation, getWorkoutsByConversation } =
    useData();

  // Log when the component renders
  useEffect(() => {
    console.log(`[Sidebar] Rendering with conversation ID: ${conversationId}`);
  }, [conversationId]);

  // Get the data and log it
  const graphBundles = getGraphBundlesByConversation(conversationId);
  const workouts = getWorkoutsByConversation(conversationId);

  // Log the retrieved data
  useEffect(() => {
    console.log(
      `[Sidebar] Found ${graphBundles.length} graph bundles for conversation: ${conversationId}`
    );
    if (graphBundles.length > 0) {
      console.log(`[Sidebar] Latest bundle ID: ${graphBundles[0].bundle_id}`);
      console.log(
        `[Sidebar] Chart URLs available:`,
        graphBundles[0].chart_urls ? "yes" : "no"
      );
      if (graphBundles[0].chart_urls) {
        console.log(
          `[Sidebar] Chart URLs:`,
          Object.keys(graphBundles[0].chart_urls)
        );
      }
      console.log(
        `[Sidebar] Metadata available:`,
        graphBundles[0].metadata ? "yes" : "no"
      );
    }

    console.log(
      `[Sidebar] Found ${workouts.length} workouts for conversation: ${conversationId}`
    );
  }, [graphBundles, workouts, conversationId]);

  const hasGraphs = graphBundles.length > 0;
  const hasWorkouts = workouts.length > 0;

  // Get the latest bundle
  const latestBundle: WorkoutDataBundle | undefined = hasGraphs
    ? graphBundles[0]
    : undefined;

  // Log the latest bundle details when it changes
  useEffect(() => {
    if (latestBundle) {
      console.log(`[Sidebar] Latest bundle loaded: ${latestBundle.bundle_id}`);
      console.log(
        `[Sidebar] Bundle has strength chart:`,
        !!latestBundle.chart_urls?.strength_progress
      );
      console.log(
        `[Sidebar] Bundle has volume chart:`,
        !!latestBundle.chart_urls?.volume_progress
      );
      console.log(
        `[Sidebar] Bundle has correlation chart:`,
        !!latestBundle.chart_urls?.correlation_heatmap
      );
      console.log(
        `[Sidebar] Bundle has top performers:`,
        !!(
          latestBundle.top_performers?.strength ||
          latestBundle.top_performers?.volume
        )
      );
    }
  }, [latestBundle]);

  // Get charts from the latest bundle
  const strengthChart = latestBundle?.chart_urls?.strength_progress;
  const volumeChart = latestBundle?.chart_urls?.volume_progress;
  const correlationChart = latestBundle?.chart_urls?.correlation_heatmap;

  // Extract top performers from the bundle
  const topStrengthPerformers = latestBundle?.top_performers?.strength || [];
  const topVolumePerformers = latestBundle?.top_performers?.volume || [];

  // Get analysis metadata
  const analysisMetadata = latestBundle?.metadata || {};
  const dateRange = analysisMetadata.date_range || {};

  // Format date range for display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const startDate = formatDate(dateRange.earliest);
  const endDate = formatDate(dateRange.latest);

  // Animation for sidebar open/close
  useEffect(() => {
    console.log(`[Sidebar] Sidebar open state changed to: ${isOpen}`);
    Animated.spring(slideAnim, {
      toValue: isOpen ? 0 : SIDEBAR_WIDTH,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isOpen, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Header Section */}
          <Appbar.Header style={styles.header}>
            <Appbar.Content
              title="Workout Analysis"
              subtitle={
                hasGraphs ? `${startDate} - ${endDate}` : "No analysis data"
              }
            />
          </Appbar.Header>

          {/* Visual Analytics Section - Only show if graphs are available */}
          {hasGraphs && strengthChart && volumeChart && (
            <View style={styles.graphsContainer}>
              <View style={styles.graphRow}>
                <Card style={styles.graphCard}>
                  <Card.Cover
                    source={{ uri: strengthChart }}
                    style={styles.graphImage}
                  />
                  <Card.Title title="Strength Progress" />
                </Card>

                <Card style={styles.graphCard}>
                  <Card.Cover
                    source={{ uri: volumeChart }}
                    style={styles.graphImage}
                  />
                  <Card.Title title="Volume Progress" />
                </Card>
              </View>

              {/* Correlation Visualization - If available */}
              {correlationChart && (
                <Card style={styles.correlationCard}>
                  <Card.Title title="Exercise Correlations" />
                  <Card.Cover
                    source={{ uri: correlationChart }}
                    style={styles.correlationImage}
                  />
                </Card>
              )}
            </View>
          )}

          {/* Performance Table */}
          {hasGraphs &&
            (topStrengthPerformers.length > 0 ||
              topVolumePerformers.length > 0) && (
              <Surface style={styles.performanceContainer}>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Exercise</DataTable.Title>
                    <DataTable.Title numeric>1RM Δ</DataTable.Title>
                    <DataTable.Title numeric>Vol Δ</DataTable.Title>
                  </DataTable.Header>

                  {/* Map through top performers */}
                  {topStrengthPerformers
                    .slice(0, 5)
                    .map((performer: Performer, index: number) => {
                      // Find matching volume performer if available
                      const volumePerformer = topVolumePerformers.find(
                        (v: Performer) => v.name === performer.name
                      );

                      const strengthChange = performer.change_percent || 0;
                      const volumeChange = volumePerformer?.change_percent || 0;

                      return (
                        <DataTable.Row key={`performer-${index}`}>
                          <DataTable.Cell>{performer.name}</DataTable.Cell>
                          <DataTable.Cell
                            numeric
                            textStyle={
                              strengthChange > 0
                                ? styles.positiveChange
                                : strengthChange < 0
                                ? styles.negativeChange
                                : styles.neutralChange
                            }
                          >
                            {strengthChange > 0 ? "+" : ""}
                            {strengthChange.toFixed(1)}%
                          </DataTable.Cell>
                          <DataTable.Cell
                            numeric
                            textStyle={
                              volumeChange > 0
                                ? styles.positiveChange
                                : volumeChange < 0
                                ? styles.negativeChange
                                : styles.neutralChange
                            }
                          >
                            {volumeChange > 0 ? "+" : ""}
                            {volumeChange.toFixed(1)}%
                          </DataTable.Cell>
                        </DataTable.Row>
                      );
                    })}
                </DataTable>
              </Surface>
            )}

          {/* Metadata Section */}
          {hasGraphs && (
            <List.Section>
              <List.Subheader>Analysis Details</List.Subheader>
              <List.Item
                title="Time Range"
                description={`${startDate} to ${endDate}`}
                left={(props) => <List.Icon {...props} icon="calendar-range" />}
              />
              <List.Item
                title="Workouts Analyzed"
                description={
                  analysisMetadata.total_workouts?.toString() || "N/A"
                }
                left={(props) => <List.Icon {...props} icon="dumbbell" />}
              />
              <List.Item
                title="Exercises Tracked"
                description={
                  analysisMetadata.total_exercises?.toString() || "N/A"
                }
                left={(props) => <List.Icon {...props} icon="run" />}
              />

              {latestBundle?.consistency_metrics && (
                <List.Item
                  title="Consistency Score"
                  description={`${latestBundle.consistency_metrics.score}/100`}
                  left={(props) => <List.Icon {...props} icon="check-circle" />}
                />
              )}
            </List.Section>
          )}

          <Divider style={styles.divider} />

          {/* Workouts Section */}
          {hasWorkouts && (
            <View style={styles.section}>
              <Title title="Attached Workouts" variant="small" />
              <View style={styles.workoutsContainer}>
                <SidebarWorkoutList workouts={workouts} maxDisplayed={3} />
              </View>
            </View>
          )}

          {/* Options Section */}
          <View style={styles.section}>
            <Title title="Options" variant="small" />
            <ToggleSwitch
              label="Detailed Analysis"
              value={detailedAnalysis}
              onValueChange={onToggleAnalysis}
            />
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#2a332a",
    borderLeftWidth: 1,
    borderLeftColor: "#3a433a",
    zIndex: 100,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 0,
  },
  header: {
    backgroundColor: "#3a433a",
    elevation: 0,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  graphsContainer: {
    padding: 8,
  },
  graphRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  graphCard: {
    width: "48%",
    marginBottom: 8,
  },
  graphImage: {
    height: 120,
    backgroundColor: "#fff",
  },
  correlationCard: {
    marginTop: 8,
    marginBottom: 16,
  },
  correlationImage: {
    height: 180,
    backgroundColor: "#fff",
  },
  performanceContainer: {
    marginHorizontal: 8,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  positiveChange: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  negativeChange: {
    color: "#F44336",
    fontWeight: "bold",
  },
  neutralChange: {
    color: "#9E9E9E",
  },
  divider: {
    marginVertical: 16,
  },
  workoutsContainer: {
    marginTop: 8,
  },
});
