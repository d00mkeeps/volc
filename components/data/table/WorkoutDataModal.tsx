 // components/data/workout/WorkoutDataModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ScrollView,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GraphImage } from '../graph/atoms/GraphImage';
import { WorkoutDataTable } from './organisms/WorkoutDataTable';
import { WorkoutDataBundle } from '@/types/workout';

interface WorkoutDataModalProps {
  visible: boolean;
  onClose: () => void;
  bundle: WorkoutDataBundle | null;
}

export const WorkoutDataModal: React.FC<WorkoutDataModalProps> = ({
  visible,
  onClose,
  bundle
}) => {
  const [activeView, setActiveView] = useState<'graph' | 'data'>('graph');
  const [isLandscape, setIsLandscape] = useState(false);
  const [formattedTitle, setFormattedTitle] = useState('Workout Data');

// Add this improved function to WorkoutDataModal.tsx
// Improved formatBundleTitle function
const formatBundleTitle = (bundle: WorkoutDataBundle | null): string => {
  if (!bundle) return 'Workout Data';
  
  // Log the complete bundle structure to see where data is located
  console.log('Bundle structure for title:', JSON.stringify({
    metadata: bundle.metadata,
    workoutDataMetadata: bundle.workout_data?.metadata
  }));
  
  // Get unique exercise names
  const exercises: string[] = [];
  if (bundle.metadata?.exercises_included) {
    // Filter out duplicates by creating a Set
    const uniqueExercises = new Set(bundle.metadata.exercises_included);
    exercises.push(...Array.from(uniqueExercises));
  }
  
  // Get date range from flattened data directly
  let dateRange = '';
  
  // Try to extract dates from the actual workout data (alternative approach)
  if (bundle.workout_data?.workouts && Array.isArray(bundle.workout_data.workouts)) {
    try {
      let earliestDate: Date | null = null;
      let latestDate: Date | null = null;
      
      bundle.workout_data.workouts.forEach((workout: { date: string | number | Date; }) => {
        if (workout.date) {
          const workoutDate = new Date(workout.date);
          
          if (!isNaN(workoutDate.getTime())) {
            if (!earliestDate || workoutDate < earliestDate) {
              earliestDate = workoutDate;
            }
            
            if (!latestDate || workoutDate > latestDate) {
              latestDate = workoutDate;
            }
          }
        }
      });
      
      if (earliestDate && latestDate) {
        const formatDate = (date: Date) => {
          return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        };
        
        dateRange = `${formatDate(earliestDate)} - ${formatDate(latestDate)}`;
        console.log('Date range derived from workouts:', dateRange);
      }
    } catch (error) {
      console.error('Error extracting dates from workouts:', error);
    }
  }
  
  // Check multiple possible locations for date_range
  if (!dateRange) {
    // Check bundle.metadata.date_range first
    if (bundle.metadata?.date_range) {
      console.log('Found date_range in bundle.metadata:', bundle.metadata.date_range);
      try {
        const earliest = new Date(bundle.metadata.date_range.start);
        const latest = new Date(bundle.metadata.date_range.end);
        
        if (!isNaN(earliest.getTime()) && !isNaN(latest.getTime())) {
          dateRange = `${earliest.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${latest.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
        }
      } catch (e) {
        console.error('Error parsing bundle.metadata.date_range:', e);
      }
    }
    
    // If still no date range, check bundle.workout_data.metadata.date_range
    if (!dateRange && bundle.workout_data?.metadata?.date_range) {
      console.log('Found date_range in workout_data.metadata:', bundle.workout_data.metadata.date_range);
      try {
        const earliest = new Date(bundle.workout_data.metadata.date_range.earliest);
        const latest = new Date(bundle.workout_data.metadata.date_range.latest);
        
        if (!isNaN(earliest.getTime()) && !isNaN(latest.getTime())) {
          dateRange = `${earliest.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${latest.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
        }
      } catch (e) {
        console.error('Error parsing workout_data.metadata.date_range:', e);
      }
    }
  }
  
  // Format the title
  const exerciseList = exercises.length > 0 ? 
    exercises.join(', ') : 
    'Workout data';
  
  const finalTitle = dateRange ? 
    `${exerciseList} (${dateRange})` : 
    exerciseList;
    
  console.log('Final formatted title:', finalTitle);
  return finalTitle;
};

useEffect(() => {
  if (bundle) {
    const title = formatBundleTitle(bundle);
    setFormattedTitle(title);
    console.log('Set formatted title to:', title);
  }
}, [bundle]);

    
  
  // Check initial orientation
  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    setIsLandscape(width > height);
  }, []);
  
  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    return () => subscription.remove();
  }, []);

  // In WorkoutDataModal.tsx - debugging props
useEffect(() => {
  if (bundle) {
    console.log('Bundle received in modal:', bundle.bundle_id);
    console.log('Bundle chart_url:', bundle.chart_url);
    console.log('Bundle workout_data:', bundle.workout_data);
    
    // Log detailed structure
    if (bundle?.workout_data) {
      if (typeof bundle.workout_data === 'string') {
        // String type is already recognized by TypeScript, no need for assertion
        console.log('workout_data is a string of length:', bundle.workout_data.length);
        try {
          const parsed = JSON.parse(bundle.workout_data);
          console.log('Parsed workout_data has keys:', Object.keys(parsed));
        } catch (e) {
          console.log('Could not parse workout_data as JSON');
        }
      } else {
        // Very explicit type assertion to avoid "never" type
        const workoutDataObj: { [key: string]: any } = bundle.workout_data as { [key: string]: any };
        console.log('workout_data keys:', Object.keys(workoutDataObj));
      
      
      }
    }
  }
}, [bundle]);
  
  // Get current dimensions
  const { width, height } = Dimensions.get('window');
  
  // Calculate dimensions for content - use percentages for better responsiveness
  const modalWidth = isLandscape ? '90%' : '90%';
  const modalHeight = isLandscape ? '90%' : '80%';
  
  // Determine graph dimensions
  const graphWidth = isLandscape ? '100%' : '100%';
  const graphHeight = 300; // Fixed height works better for most screen sizes

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalOverlay}>
          <View 
            style={[
              styles.modalContainer,
              {
                width: modalWidth,
                height: modalHeight,
                maxWidth: 1000, // Set maximum width to handle very large screens
              }
            ]}
          >
            {/* Control buttons - positioned at top */}
            <View style={styles.controlsContainer}>
            <Text style={styles.modalTitle} numberOfLines={3} ellipsizeMode="tail">
  {formattedTitle}
</Text>
              
              <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={() => setActiveView(activeView === 'graph' ? 'data' : 'graph')}
                >
                  <Ionicons 
                    name={activeView === 'graph' ? 'list' : 'bar-chart'} 
                    size={24} 
                    color="#FFF" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={() => {
                    console.log('Share functionality to be implemented');
                  }}
                >
                  <Ionicons name="share-outline" size={24} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.controlButton, styles.closeButton]}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Content area */}
            <ScrollView 
              style={styles.contentScrollView}
              contentContainerStyle={styles.contentContainer}
            >
              {/* Show graph if in graph view or in landscape mode */}
              {(activeView === 'graph' || isLandscape) && (
                <View style={[
                  styles.graphContainer,
                  { width: graphWidth, height: graphHeight }
                ]}>
                  {bundle?.chart_url ? (
                    <GraphImage 
                      chartUrl={bundle.chart_url} 
                      width={isLandscape ? width * 0.8 : width * 0.8}
                      height={graphHeight}
                      inert={true}
                    />
                  ) : (
                    <View style={styles.noGraphContainer}>
                      <Ionicons name="bar-chart-outline" size={60} color="#ccc" />
                      <Text style={styles.noGraphText}>No graph available</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Show data table if in data view or in landscape mode */}
              {(activeView === 'data' || isLandscape) && (
                <View style={styles.dataContainer}>
                  <WorkoutDataTable bundle={bundle} />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#333',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#555',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  closeButton: {
    backgroundColor: '#ff3b30',
  },
  contentScrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
  },
  graphContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noGraphContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noGraphText: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },
  dataContainer: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});