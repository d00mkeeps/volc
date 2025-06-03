// // components/workout/molecules/TemplateSelector.tsx
// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { CompleteWorkout } from '@/types/workout';

// interface TemplateSelectorProps {
//   templates: CompleteWorkout[];
//   selectedTemplateId: string | null;
//   onSelectTemplate: (template: CompleteWorkout) => void;
// }

// const TemplateSelector: React.FC<TemplateSelectorProps> = ({
//   templates,
//   selectedTemplateId,
//   onSelectTemplate,
// }) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isExpanded, setIsExpanded] = useState(false);

//   const filteredTemplates = templates.filter(template => {
//     const searchLower = searchQuery.toLowerCase();
//     return (
//       template.name.toLowerCase().includes(searchLower) ||
//       (template.notes && template.notes.toLowerCase().includes(searchLower))
//     );
//   });

//   const recentTemplates = templates.slice(0, 5);

//   const displayTemplates = searchQuery ? filteredTemplates : recentTemplates;
//   const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
//   return (
//     <View style={styles.container}>
//       <TouchableOpacity
//         style={styles.selectorButton}
//         onPress={() => setIsExpanded(!isExpanded)}
//       >
//         <Text style={styles.label}>Template:</Text>
//         <Text style={styles.selectedValue} numberOfLines={1}>
//           {selectedTemplate?.name || 'Select a template'}
//         </Text>
//         <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#8cd884" />
//       </TouchableOpacity>

//       {isExpanded && (
//         <View style={styles.dropdown}>
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search templates..."
//             placeholderTextColor="#666"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />

//           <FlatList
//             data={displayTemplates}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={[
//                   styles.templateItem,
//                   selectedTemplateId === item.id && styles.selectedItem
//                 ]}
//                 onPress={() => {
//                   onSelectTemplate(item);
//                   setIsExpanded(false);
//                 }}
//               >
//                 <Text style={styles.templateName}>{item.name}</Text>
//                 <Text style={styles.templateDate}>
//                   {new Date(item.created_at).toLocaleDateString()}
//                 </Text>
//               </TouchableOpacity>
//             )}
//             ListEmptyComponent={
//               <Text style={styles.emptyText}>
//                 {searchQuery ? 'No matching templates found' : 'No recent templates'}
//               </Text>
//             }
//             style={styles.templateList}
//           />
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginBottom: 16,
//     position: 'relative',
//     zIndex: 100,
//   },
//   selectorButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#333',
//     padding: 12,
//     borderRadius: 8,
//   },
//   label: {
//     color: '#888',
//     marginRight: 8,
//   },
//   selectedValue: {
//     color: '#fff',
//     flex: 1,
//   },
//   dropdown: {
//     position: 'absolute',
//     top: 48,
//     left: 0,
//     right: 0,
//     backgroundColor: '#333',
//     borderRadius: 8,
//     padding: 12,
//     zIndex: 10,
//     maxHeight: 300,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//   },
//   searchInput: {
//     backgroundColor: '#444',
//     color: '#fff',
//     padding: 10,
//     borderRadius: 4,
//     marginBottom: 8,
//   },
//   templateList: {
//     maxHeight: 240,
//   },
//   templateItem: {
//     padding: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#444',
//   },
//   selectedItem: {
//     backgroundColor: '#1a1a1a',
//   },
//   templateName: {
//     color: '#8cd884',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   templateDate: {
//     color: '#888',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   emptyText: {
//     color: '#666',
//     textAlign: 'center',
//     padding: 12,
//     fontStyle: 'italic',
//   },
// });

// export default TemplateSelector;
