import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WorkoutNotesListProps {
  notes: string;
  editMode?: boolean;
  onNotesChange?: (notes: string) => void
}

const WorkoutNotesList: React.FC<WorkoutNotesListProps> = ({ 
    notes,
editMode,
onNotesChange
 }) => {
  const getNotesList = (notes: string): string[] => {
    try {
      if (notes.startsWith('[') && notes.endsWith(']')) {
        return JSON.parse(notes) as string[];
      }
    } catch {
      // If parsing fails, return original as single note
    }
    return [notes];
  };

  const notesList = getNotesList(notes);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Notes</Text>
      {notesList.map((note, index) => (
        <Text key={index} style={styles.note}>
          • {note}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  note: {
    color: '#bbb',
    fontSize: 16,
    marginBottom: 8,
    marginLeft: 8,
  },
});

export default WorkoutNotesList;