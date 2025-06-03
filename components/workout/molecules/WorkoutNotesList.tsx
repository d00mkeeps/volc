// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// interface WorkoutNotesListProps {
//   notes: string;
//   editMode?: boolean;
//   onNotesChange?: (notes: string) => void;
// }

// const WorkoutNotesList: React.FC<WorkoutNotesListProps> = ({
//   notes,
//   editMode = false,
//   onNotesChange
// }) => {
//   const [editableNotes, setEditableNotes] = useState<string[]>([]);
//   const [initialized, setInitialized] = useState(false);

//   // Only initialize notes when the component mounts or edit mode changes
//   useEffect(() => {
//     if (!initialized || !editMode) {
//       setEditableNotes(getNotesList(notes));
//       setInitialized(true);
//     }
//   }, [notes, editMode, initialized]);

//   const getNotesList = (notes: string): string[] => {
//     try {
//       if (notes && notes.trim()) {
//         if (notes.startsWith('[') && notes.endsWith(']')) {
//           const parsed = JSON.parse(notes) as string[];
//           return parsed.filter(note => note && note.trim()).length > 0
//             ? parsed.filter(note => note && note.trim())
//             : [''];
//         }
//       }
//     } catch {
//       // If parsing fails, return original as single note
//     }

//     return notes && notes.trim() ? [notes] : [''];
//   };

//   const handleNoteChange = (text: string, index: number) => {
//     const updatedNotes = [...editableNotes];
//     updatedNotes[index] = text;
//     setEditableNotes(updatedNotes);

//     if (onNotesChange) {
//       // Convert back to the expected format
//       onNotesChange(JSON.stringify(updatedNotes));
//     }
//   };

//   const addNewNote = () => {
//     const updatedNotes = [...editableNotes, ''];
//     setEditableNotes(updatedNotes);

//     if (onNotesChange) {
//       onNotesChange(JSON.stringify(updatedNotes));
//     }
//   };

//   const removeNote = (index: number) => {
//     const updatedNotes = editableNotes.filter((_, i) => i !== index);
//     const finalNotes = updatedNotes.length ? updatedNotes : [''];
//     setEditableNotes(finalNotes);

//     if (onNotesChange) {
//       onNotesChange(JSON.stringify(finalNotes));
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.sectionTitle}>Notes</Text>

//       {editMode ? (
//         <>
//           {editableNotes.map((note, index) => (
//             <View key={`edit-note-${index}`} style={styles.editNoteContainer}>
//               <TextInput
//                 style={styles.noteInput}
//                 value={note}
//                 onChangeText={(text) => handleNoteChange(text, index)}
//                 placeholder="Add note here..."
//                 placeholderTextColor="#666"
//                 multiline
//               />
//               <TouchableOpacity
//                 style={styles.deleteButton}
//                 onPress={() => removeNote(index)}
//               >
//                 <Ionicons name="trash-outline" size={20} color="#ff4444" />
//               </TouchableOpacity>
//             </View>
//           ))}

//           <TouchableOpacity
//             style={styles.addButton}
//             onPress={addNewNote}
//           >
//             <Ionicons name="add-circle-outline" size={20} color="#8cd884" />
//             <Text style={styles.addButtonText}>Add Note</Text>
//           </TouchableOpacity>
//         </>
//       ) : (
//         <>
//           {editableNotes.length > 0 && editableNotes[0] !== '' ? (
//             editableNotes.map((note, index) => (
//               <Text key={`view-note-${index}`} style={styles.note}>
//                 • {note}
//               </Text>
//             ))
//           ) : (
//             <Text style={styles.emptyNote}>No notes added yet</Text>
//           )}
//         </>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#444',
//   },
//   sectionTitle: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 12,
//   },
//   note: {
//     color: '#bbb',
//     fontSize: 16,
//     marginBottom: 8,
//     marginLeft: 8,
//   },
//   emptyNote: {
//     color: '#666',
//     fontSize: 16,
//     marginBottom: 8,
//     marginLeft: 8,
//     fontStyle: 'italic',
//   },
//   editNoteContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   noteInput: {
//     flex: 1,
//     color: '#fff',
//     backgroundColor: '#333',
//     borderRadius: 8,
//     padding: 10,
//     fontSize: 16,
//     marginRight: 8,
//   },
//   deleteButton: {
//     padding: 8,
//   },
//   addButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 8,
//     marginTop: 8,
//   },
//   addButtonText: {
//     color: '#8cd884',
//     marginLeft: 8,
//     fontSize: 16,
//   },
// });

// export default WorkoutNotesList;
