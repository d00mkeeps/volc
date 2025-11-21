import React, { useEffect, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card, Button, Spinner, useTheme } from "tamagui";
import ChartDataView from "../molecules/visualization/ChartDataView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adminService, AdminStats, LLMStats } from "../../services/api/adminService";

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [llmStats, setLLMStats] = useState<LLMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [generalStats, llmData] = await Promise.all([
        adminService.getStats(),
        adminService.getLLMStats(),
      ]);
      setStats(generalStats);
      setLLMStats(llmData);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const toggleExpand = (path: string) => {
    setExpandedEndpoint(expandedEndpoint === path ? null : path);
  };

  if (loading && !stats) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background?.get() }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} />}
    >
      <Text fontSize="$8" fontWeight="bold" marginBottom="$4">
        Engineering Dashboard
      </Text>

      {/* Global Stats Cards */}
      <XStack gap="$3" marginBottom="$6" flexWrap="wrap">
        <StatCard title="24h Requests" value={stats?.total_requests.toString() || "0"} />
        <StatCard title="Avg Latency" value={`${stats?.avg_latency || 0}ms`} />
        <StatCard 
          title="Error Rate" 
          value={`${stats?.error_rate || 0}%`} 
          color={stats?.error_rate && stats.error_rate > 1 ? "$red10" : "$green10"} 
        />
      </XStack>

      {/* LLM Performance Metrics */}
      <Text fontSize="$6" fontWeight="bold" marginTop="$6" marginBottom="$4">
        LLM Performance Metrics
      </Text>

      {/* Token Usage Cards */}
      <Text fontSize="$5" fontWeight="600" marginBottom="$3">
        Token Usage
      </Text>
      <XStack gap="$3" marginBottom="$6" flexWrap="wrap">
        <StatCard 
          title="Total Input" 
          value={llmStats?.token_stats.total_input_tokens.toLocaleString() || "0"} 
        />
        <StatCard 
          title="Total Output" 
          value={llmStats?.token_stats.total_output_tokens.toLocaleString() || "0"} 
        />
        <StatCard 
          title="Avg Input" 
          value={llmStats?.token_stats.avg_input_tokens.toString() || "0"} 
        />
        <StatCard 
          title="Avg Output" 
          value={llmStats?.token_stats.avg_output_tokens.toString() || "0"} 
        />
      </XStack>

      {/* Latency Stats */}
      <Text fontSize="$5" fontWeight="600" marginBottom="$3">
        LLM Latency
      </Text>
      <XStack gap="$3" marginBottom="$6" flexWrap="wrap">
        <StatCard 
          title="Avg Latency" 
          value={`${llmStats?.latency_stats.avg_latency || 0}ms`} 
        />
        <StatCard 
          title="P50" 
          value={`${llmStats?.latency_stats.p50_latency || 0}ms`} 
        />
        <StatCard 
          title="P95" 
          value={`${llmStats?.latency_stats.p95_latency || 0}ms`} 
          color="$orange10"
        />
        <StatCard 
          title="P99" 
          value={`${llmStats?.latency_stats.p99_latency || 0}ms`} 
          color="$red10"
        />
      </XStack>

      {/* Volume Stats */}
      <Text fontSize="$5" fontWeight="600" marginBottom="$3">
        Request Volume
      </Text>
      <XStack gap="$3" marginBottom="$6" flexWrap="wrap">
        <StatCard 
          title="Total LLM Requests" 
          value={llmStats?.volume_stats.total_requests.toString() || "0"} 
        />
        {llmStats?.volume_stats.by_model.map((model) => (
          <StatCard 
            key={model.model}
            title={model.model} 
            value={model.count.toString()} 
          />
        ))}
      </XStack>

      <Text fontSize="$6" fontWeight="bold" marginBottom="$3">
        Top 10 Endpoints
      </Text>

      <YStack gap="$3">
        {stats?.top_endpoints.map((endpoint) => (
          <Card key={endpoint.path} bordered padding="$0" overflow="hidden">
            {/* Header / Summary Row */}
            <Button
              unstyled
              onPress={() => toggleExpand(endpoint.path)}
              padding="$4"
              backgroundColor="$background"
              pressStyle={{ backgroundColor: "$gray4" }}
            >
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold" fontSize="$4" numberOfLines={1} flex={1}>
                    {endpoint.path}
                  </Text>
                  <Text color="$gray10" fontSize="$3">
                    {endpoint.count} reqs
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$gray10" fontSize="$3">
                    Avg: {endpoint.avg_latency}ms
                  </Text>
                  <Text color="$blue10" fontSize="$3">
                    {expandedEndpoint === endpoint.path ? "Hide Details" : "Show Details"}
                  </Text>
                </XStack>
              </YStack>
            </Button>

            {/* Expanded Content */}
            {expandedEndpoint === endpoint.path && (
              <YStack padding="$4" backgroundColor="$gray2" borderTopWidth={1} borderColor="$borderColor">
                <ChartDataView
                  data={{
                    title: "Latency (Last 50 reqs)",
                    chart_type: "line",
                    labels: endpoint.history.map((_, i) => i.toString()), // Simple index labels
                    datasets: [
                      {
                        label: "Latency (ms)",
                        data: endpoint.history.map((h) => h.latency),
                        color: theme.blue10?.get(),
                      },
                    ],
                  }}
                />
              </YStack>
            )}
          </Card>
        ))}
      </YStack>
    </ScrollView>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color?: string }) {
  return (
    <Card flex={1} minWidth={100} padding="$3" bordered>
      <Text color="$gray10" fontSize="$3" marginBottom="$1">
        {title}
      </Text>
      <Text fontSize="$6" fontWeight="bold" color={color || "$color"}>
        {value}
      </Text>
    </Card>
  );
}
