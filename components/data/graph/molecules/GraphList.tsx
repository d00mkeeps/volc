// GraphList.tsx
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { GraphImage } from '../atoms/GraphImage';
import { WorkoutDataBundle } from '@/types/workout';

interface GraphListProps {
  bundles: WorkoutDataBundle[];
  onGraphPress?: (bundle: WorkoutDataBundle) => void;
}

export const GraphList: React.FC<GraphListProps> = ({ 
  bundles,
  onGraphPress
}) => {
  // Filter out bundles without chart URLs
  const graphBundles = bundles.filter(bundle => bundle.chart_url);
  
  if (graphBundles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No graphs available</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={graphBundles}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      keyExtractor={(item) => item.bundle_id.toString()}
      renderItem={({ item }) => (
        <View style={styles.graphContainer}>
          <GraphImage 
            chartUrl={item.chart_url!} 
            width={280} 
            height={210}
            onError={(error) => console.error('Graph error:', error)}
          />
          <Text style={styles.graphTitle} numberOfLines={1}>
            {item.original_query}
          </Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  graphContainer: {
    marginRight: 16,
    width: 280,
  },
  graphTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  }
});