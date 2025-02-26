// components/data/table/WorkoutDataTable.tsx
import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { DataTable, Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WorkoutDataBundle } from '@/types/workout';

interface WorkoutDataTableProps {
  bundle: WorkoutDataBundle | null;
}

// Define the structure based on your actual data
interface FlattenedWorkoutData {
  exercise: string;
  date: Date;
  weight: number;
  reps: number;
  estimated_1rm?: number;
}

export const WorkoutDataTable: React.FC<WorkoutDataTableProps> = ({ bundle }) => {
  const [page, setPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<keyof FlattenedWorkoutData>('date');
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('descending');
  const itemsPerPage = 10;

  // Flatten the nested workout data structure and extract weight unit
  const { flatData, weightUnit } = useMemo(() => {
    // Default weight unit
    let weightUnit = 'kg';
    
    if (!bundle || !bundle.workout_data) {
      console.log('No bundle or workout_data found');
      return { flatData: [], weightUnit };
    }
    
    let flatData: FlattenedWorkoutData[] = [];
    const workoutData = bundle.workout_data;
    
    // Check for workouts array
    if (workoutData.workouts && Array.isArray(workoutData.workouts)) {
      // Process each workout
      workoutData.workouts.forEach((workout: any) => {
        // Check if this workout has exercises
        if (workout.exercises && Array.isArray(workout.exercises)) {
          workout.exercises.forEach((exercise: any) => {
            // Extract exercise name from exercise_name field
            const exerciseName = exercise.exercise_name || exercise.name || 'Unknown Exercise';
            
            // Get weight unit if available
            if (exercise.units && exercise.units.weight) {
              weightUnit = exercise.units.weight;
            }
            
            // Take just the best set for each exercise (as specified)
            let bestSet = {
              weight: 0,
              reps: 0,
              estimated_1rm: 0
            };
            
            // Find the set with the highest 1RM
            if (exercise.sets && Array.isArray(exercise.sets)) {
              exercise.sets.forEach((set: any) => {
                if (set.estimated_1rm && set.estimated_1rm > (bestSet.estimated_1rm || 0)) {
                  bestSet = set;
                }
              });
              
              // Only add if we found a valid set
              if (bestSet.estimated_1rm > 0) {
                flatData.push({
                  exercise: exerciseName,
                  date: new Date(workout.date || workout.created_at),
                  weight: bestSet.weight || 0,
                  reps: bestSet.reps || 0,
                  estimated_1rm: bestSet.estimated_1rm
                });
              }
            }
          });
        } else if (workout.workout_exercises && Array.isArray(workout.workout_exercises)) {
          // Alternative structure
          workout.workout_exercises.forEach((exercise: any) => {
            const exerciseName = exercise.exercise_name || exercise.name || 'Unknown Exercise';
            
            // Get weight unit if available
            if (exercise.units && exercise.units.weight) {
              weightUnit = exercise.units.weight;
            }
            
            // Take just the best set for each exercise
            let bestSet = {
              weight: 0,
              reps: 0,
              estimated_1rm: 0
            };
            
            if (exercise.workout_exercise_sets && Array.isArray(exercise.workout_exercise_sets)) {
              exercise.workout_exercise_sets.forEach((set: any) => {
                if (set.estimated_1rm && set.estimated_1rm > (bestSet.estimated_1rm || 0)) {
                  bestSet = set;
                }
              });
              
              if (bestSet.estimated_1rm > 0) {
                flatData.push({
                  exercise: exerciseName,
                  date: new Date(workout.date || workout.created_at),
                  weight: bestSet.weight || 0,
                  reps: bestSet.reps || 0,
                  estimated_1rm: bestSet.estimated_1rm
                });
              }
            }
          });
        }
      });
    }
    
    return { flatData, weightUnit: 'kg' };
  }, [bundle]);

  // Calculate number of pages
  const numberOfPages = Math.max(1, Math.ceil(flatData.length / itemsPerPage));

  // Sort data based on column and direction
  const sortedData = useMemo(() => {
    if (!flatData.length) return [];
    
    return [...flatData].sort((a, b) => {
      if (sortColumn === 'date') {
        return sortDirection === 'ascending' 
          ? a.date.getTime() - b.date.getTime()
          : b.date.getTime() - a.date.getTime();
      }
      
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Handle undefined/null cases for numeric values
      if (aValue === undefined || aValue === null) return sortDirection === 'ascending' ? -1 : 1;
      if (bValue === undefined || bValue === null) return sortDirection === 'ascending' ? 1 : -1;
      
      return sortDirection === 'ascending'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [flatData, sortColumn, sortDirection]);

  // Get paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, page, itemsPerPage]);

  // Handle sort toggle
  const toggleSort = (column: keyof FlattenedWorkoutData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
    } else {
      setSortColumn(column);
      setSortDirection('descending');
    }
  };

  const columns = [
    { key: 'exercise', label: 'Exercise', width: 120, align: 'center' },
    { key: 'date', label: 'Date', width: 120, align: 'center' },
    { key: 'weight', label: `Weight (${weightUnit})`, width: 120, align: 'center' },
    { key: 'reps', label: 'Reps', width: 70, align: 'center' },
    { key: 'estimated_1rm', label: `Est. 1RM (${weightUnit})`, width: 120, align: 'center' }
  ];

  if (!bundle || flatData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No workout data available</Text>
      </View>
    );
  }

  // Custom header component that maintains fixed widths and proper alignment
  const CustomHeader = () => (
    <View style={styles.headerRow}>
      {columns.map(column => (
        <View 
          key={column.key} 
          style={[
            styles.headerCell, 
            { width: column.width }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.headerCellContent,
              { justifyContent: 'center' }
            ]}
            onPress={() => toggleSort(column.key as keyof FlattenedWorkoutData)}
          >
            {sortColumn === column.key && (
              <MaterialCommunityIcons 
                name={sortDirection === 'ascending' ? 'arrow-up' : 'arrow-down'} 
                size={16} 
                color="#666"
                style={styles.sortIcon}
              />
            )}
            <Text style={styles.headerText}>
              {column.label}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal>
        <View>
          {/* Custom header with fixed column widths */}
          <CustomHeader />
          
          {/* Data rows */}
          {paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <View key={`row-${index}`} style={styles.dataRow}>
                <View style={[styles.dataCell, { width: columns[0].width }]}>
                  <Text 
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                    style={styles.leftText}
                  >
                    {item.exercise}
                  </Text>
                </View>
                <View style={[styles.dataCell, { width: columns[1].width }]}>
                  <Text style={styles.leftText}>
                    {item.date.toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.dataCell, { width: columns[2].width }]}>
                  <Text style={styles.numericText}>{item.weight}</Text>
                </View>
                <View style={[styles.dataCell, { width: columns[3].width }]}>
                  <Text style={styles.numericText}>{item.reps}</Text>
                </View>
                <View style={[styles.dataCell, { width: columns[4].width }]}>
                  <Text style={styles.numericText}>
                    {item.estimated_1rm !== undefined ? item.estimated_1rm.toFixed(1) : '-'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.dataRow}>
              <View style={[styles.dataCell, { width: columns.reduce((sum, col) => sum + col.width, 0) }]}>
                <Text style={styles.emptyText}>No workout data entries found</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <DataTable.Pagination
        page={page}
        numberOfPages={numberOfPages}
        onPageChange={(page) => setPage(page)}
        label={`${page + 1} of ${numberOfPages}`}
        showFastPaginationControls
        numberOfItemsPerPage={itemsPerPage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#666',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#777',
  },
  headerCell: {
    padding: 12, // Slightly reduced padding
    justifyContent: 'center',
  },
  headerCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortIcon: {
    marginRight: 4,
    width: 16, // Fixed width for sort icon
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dataCell: {
    padding: 12, // Match header padding
    justifyContent: 'center',
    backgroundColor: '#999'
  },
  leftText: {
    textAlign: 'center',
  },
  numericText: {
    textAlign: 'center',
  },
});