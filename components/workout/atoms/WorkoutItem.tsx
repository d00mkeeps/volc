import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CompleteWorkout } from '@/types/workout';
import { useWorkout } from '@/context/WorkoutContext';

interface WorkoutItemProps {
  workout: CompleteWorkout;
  isLastItem?: boolean;
}

const WorkoutItem: React.FC<WorkoutItemProps> = ({ workout, isLastItem = false }) => {
  const { getWorkout } = useWorkout();
  const formattedDate = new Date(workout.created_at).toLocaleDateString();
  
  const formatNotes = (notes: string | undefined): string[] | undefined => {
    if (!notes) return undefined;
    
    try {
      if (notes.startsWith('[') && notes.endsWith(']')) {
        const parsedNotes = JSON.parse(notes) as string[];
        return parsedNotes.map(note => 
          note.length > 30 ? `${note.substring(0, 27)}...` : note
        );
      }
    } catch {
      // If JSON parsing fails, treat as regular string
    }
    
    // Return single string as an array with one item
    return [notes.length > 30 ? `${notes.substring(0, 27)}...` : notes];
  };

  const displayNotes = formatNotes(workout.notes);

  const handlePress = () => {
    getWorkout(workout.id);
  };

  return (
    <TouchableOpacity 
      style={[styles.container, isLastItem && styles.lastItem]}
      onPress={handlePress}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.name}>{workout.name}</Text>
        {displayNotes && displayNotes.map((note, index) => (
          <Text key={index} style={styles.description}>
            • {note}
          </Text>
        ))}
      </View>
      <Text style={styles.date}>{formattedDate}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  contentContainer: {
    flex: 1,
    marginRight: 16,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  name: {
    color: '#8cd884',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#bbb',
    fontSize: 14,
    marginLeft: 8,
    marginTop: 2,
  },
  date: {
    color: '#eee',
    fontSize: 12,
  },
});

export default WorkoutItem;