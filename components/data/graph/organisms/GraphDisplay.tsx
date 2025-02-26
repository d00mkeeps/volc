// components/data/graph/molecules/GraphDisplay.tsx
// Modified for sidebar integration

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { useAttachments } from '@/context/ChatAttachmentContext';
import { GraphImage } from '../atoms/GraphImage';
import { WorkoutDataBundle } from '@/types/workout';
import { Ionicons } from '@expo/vector-icons';

interface GraphDisplayProps {
  conversationId: string;
  maxDisplayed?: number;
  isSidebar?: boolean;
}

export const GraphDisplay: React.FC<GraphDisplayProps> = ({
  conversationId,
  maxDisplayed = 3,
  isSidebar = false,
}) => {
  const { getGraphBundlesByConversation, deleteAttachment, isLoading } = useAttachments();
  const [selectedBundle, setSelectedBundle] = useState<WorkoutDataBundle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  
  const graphBundles = getGraphBundlesByConversation(conversationId);
  
  if (graphBundles.length === 0) {
    return null;
  }
  
  // Calculate dimensions based on context (sidebar or main view)
  const graphWidth = isSidebar ? 260 : 280;
  const graphHeight = isSidebar ? 150 : 180;
  
  const handleGraphPress = (bundle: WorkoutDataBundle) => {
    setSelectedBundle(bundle);
    setModalVisible(true);
  };
  
  const handleDeleteGraph = async (bundleId: string) => {
    try {
      await deleteAttachment(bundleId, 'graph_bundle');
      if (selectedBundle?.bundle_id === bundleId) {
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Failed to delete graph:', error);
    }
  };
  
  const displayedBundles = graphBundles.slice(0, maxDisplayed);
  const hasMoreGraphs = graphBundles.length > maxDisplayed;
  
  return (
    <View style={[styles.container, isSidebar && styles.sidebarContainer]}>
      {/* Only show header in main view, not in sidebar */}
      {!isSidebar && (
        <View style={styles.header}>
          <Text style={styles.title}>Graphs</Text>
          {hasMoreGraphs && (
            <TouchableOpacity 
              onPress={() => {
                setSelectedBundle(null);
                setModalVisible(true);
              }}
            >
              <Text style={styles.viewAllText}>
                View All ({graphBundles.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* In sidebar mode, stack graphs vertically */}
      {isSidebar ? (
        <View style={styles.stackContainer}>
          {displayedBundles.map((bundle) => (
            <TouchableOpacity 
              key={bundle.bundle_id}
              style={[styles.graphItem, styles.sidebarGraphItem]}
              onPress={() => handleGraphPress(bundle)}
              activeOpacity={0.8}
            >
              <GraphImage 
                chartUrl={bundle.chart_url || ''} 
                width={graphWidth} 
                height={graphHeight}
                onError={(error) => console.error('Graph error:', error)}
              />
              <Text style={styles.graphTitle} numberOfLines={1}>
                {bundle.original_query}
              </Text>
            </TouchableOpacity>
          ))}
          
          {hasMoreGraphs && (
            <TouchableOpacity 
              style={styles.viewMoreButton}
              onPress={() => {
                setSelectedBundle(null);
                setModalVisible(true);
              }}
            >
              <Text style={styles.viewMoreText}>
                View {graphBundles.length - maxDisplayed} more graphs
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displayedBundles.map((bundle) => (
            <TouchableOpacity 
              key={bundle.bundle_id}
              style={styles.graphItem}
              onPress={() => handleGraphPress(bundle)}
              activeOpacity={0.8}
            >
              <GraphImage 
                chartUrl={bundle.chart_url || ''} 
                width={graphWidth} 
                height={graphHeight}
                onError={(error) => console.error('Graph error:', error)}
              />
              <Text style={styles.graphTitle} numberOfLines={1}>
                {bundle.original_query}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      {/* Detail Modal - same for both modes */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedBundle ? 'Graph Detail' : `All Graphs (${graphBundles.length})`}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#eee" />
              </TouchableOpacity>
            </View>
            
            {selectedBundle ? (
              // Single graph detail view
              <View style={styles.detailContainer}>
                <GraphImage 
                  chartUrl={selectedBundle.chart_url || ''} 
                  width={Math.min(320, width - 64)} 
                  height={240}
                />
                <Text style={styles.detailQuery}>
                  {selectedBundle.original_query}
                </Text>
                
                <View style={styles.metadataContainer}>
                  <Text style={styles.metadataLabel}>Date Range:</Text>
                  <Text style={styles.metadataValue}>
                    {new Date(selectedBundle.metadata.date_range.start).toLocaleDateString()} - 
                    {new Date(selectedBundle.metadata.date_range.end).toLocaleDateString()}
                  </Text>
                  
                  <Text style={styles.metadataLabel}>Exercises:</Text>
                  <Text style={styles.metadataValue}>
                    {selectedBundle.metadata.exercises_included.join(', ')}
                  </Text>
                  
                  <Text style={styles.metadataLabel}>Total Workouts:</Text>
                  <Text style={styles.metadataValue}>
                    {selectedBundle.metadata.total_workouts}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteGraph(selectedBundle.bundle_id)}
                  disabled={isLoading}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.deleteButtonText}>
                    {isLoading ? 'Deleting...' : 'Delete Graph'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // All graphs grid view
              <ScrollView contentContainerStyle={styles.gridContainer}>
                {graphBundles.map((bundle) => (
                  <TouchableOpacity 
                    key={bundle.bundle_id}
                    style={styles.gridItem}
                    onPress={() => setSelectedBundle(bundle)}
                    activeOpacity={0.8}
                  >
                    <GraphImage 
                      chartUrl={bundle.chart_url || ''} 
                      width={160} 
                      height={120}
                    />
                    <Text style={styles.gridItemTitle} numberOfLines={2}>
                      {bundle.original_query}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sidebarContainer: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#0066cc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  graphItem: {
    marginRight: 16,
    width: 280,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sidebarGraphItem: {
    marginRight: 0,
    marginBottom: 16,
    width: '100%',
    backgroundColor: '#1f281f', // Darker background for sidebar
  },
  graphTitle: {
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff', // White text for sidebar
  },
  
  // Vertical stack for sidebar
  stackContainer: {
    width: '100%',
  },
  viewMoreButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#3a433a',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#333',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#eee',
  },
  
  // Detail view styles
  detailContainer: {
    padding: 16,
    alignItems: 'center',
  },
  detailQuery: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  metadataContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Grid view styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  gridItem: {
    width: '50%',
    padding: 8,
  },
  gridItemTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
});