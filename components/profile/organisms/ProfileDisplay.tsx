// // components/profile/organisms/ProfileDisplay.tsx
// import React, { useState } from 'react';
// import { View, StyleSheet } from 'react-native';
// import SectionHeader from '../atoms/SectionHeader';
// import ProfileGroup from '../molecules/ProfileGroup';
// import EditFieldModal from '../molecules/EditFieldModal';
// import { useUser } from '@/context/UserContext';

// // Helper function to convert age_group number to readable range
// const getAgeRangeText = (ageGroup: number | null): string => {
//   if (ageGroup === null) return 'Not specified';

//   switch (ageGroup) {
//     case 1: return '16-24 years';
//     case 2: return '25-34 years';
//     case 3: return '35-44 years';
//     case 4: return '45-54 years';
//     case 5: return '55-64 years';
//     case 6: return '65+ years';
//     default: return 'Unknown age group';
//   }
// };

// const ProfileDisplay: React.FC = () => {
//   const { userProfile, updateProfile } = useUser();
//   const [modalVisible, setModalVisible] = useState(false);
//   const [currentField, setCurrentField] = useState<{
//     key: string;
//     value: string;
//     displayName: string;
//   } | null>(null);

//   if (!userProfile) {
//     return null;
//   }

//   // Define which fields cannot be edited
//   const nonEditableFields = ['age_range'];

//   // Properly map from database fields
//   const generalInfo = {
//     name: `${userProfile.first_name} ${userProfile.last_name}`.trim(),
//     measurement_system: userProfile.is_imperial ? 'Imperial' : 'Metric',
//     age_range: getAgeRangeText(userProfile.age_group)
//   };

//   // Access training_history JSON fields correctly
//   const trainingHistory = userProfile.training_history || {};
//   const progressInfo = {
//     experience: trainingHistory.trainingAge || 'Not specified',
//     activities: Array.isArray(trainingHistory.exercisePreferences)
//       ? trainingHistory.exercisePreferences.join(', ')
//       : 'None specified',
//     current_abilities: Array.isArray(trainingHistory.currentAbilities)
//       ? trainingHistory.currentAbilities.join(', ')
//       : 'None specified',
//     injuries: Array.isArray(trainingHistory.injuries) && trainingHistory.injuries.length > 0
//       ? trainingHistory.injuries.join(', ')
//       : 'None reported',
//     goal: userProfile.goal || 'No goal set'
//   };

//   const handleEditField = (key: string, value: string, displayName: string) => {
//     // Skip editing for non-editable fields
//     if (nonEditableFields.includes(key)) return;

//     setCurrentField({ key, value, displayName });
//     setModalVisible(true);
//   };

//   const handleSaveField = async (newValue: string) => {
//     if (!currentField || !userProfile) return;

//     let updates: any = {};

//     // Handle different field types
//     switch (currentField.key) {
//       case 'name':
//         // Split name into first and last
//         const nameParts = newValue.trim().split(' ');
//         const firstName = nameParts[0];
//         const lastName = nameParts.slice(1).join(' ');
//         updates = {
//           first_name: firstName,
//           last_name: lastName || ''
//         };
//         break;

//       case 'measurement_system':
//         updates = {
//           is_imperial: newValue.toLowerCase() === 'imperial'
//         };
//         break;

//       case 'goal':
//         updates = { goal: newValue };
//         break;

//       case 'experience':
//       case 'activities':
//       case 'current_abilities':
//       case 'injuries':
//         // Update training_history JSON
//         const newTrainingHistory = { ...trainingHistory };

//         if (currentField.key === 'experience') {
//           newTrainingHistory.trainingAge = newValue;
//         } else if (currentField.key === 'activities') {
//           newTrainingHistory.exercisePreferences = newValue.split(',').map(item => item.trim());
//         } else if (currentField.key === 'current_abilities') {
//           newTrainingHistory.currentAbilities = newValue.split(',').map(item => item.trim());
//         } else if (currentField.key === 'injuries') {
//           newTrainingHistory.injuries = newValue.split(',').map(item => item.trim());
//         }

//         updates = {
//           training_history: newTrainingHistory
//         };
//         break;
//     }

//     try {
//       await updateProfile(updates);
//       setModalVisible(false);
//       setCurrentField(null);
//     } catch (error) {
//       console.error('Failed to update profile:', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.section}>
//         <SectionHeader title="General Information" />
//         <ProfileGroup
//           data={generalInfo}
//           onEdit={handleEditField}
//           nonEditableFields={nonEditableFields}
//         />
//       </View>

//       <View style={styles.section}>
//         <SectionHeader title="Training & Goals" />
//         <ProfileGroup
//           data={progressInfo}
//           onEdit={handleEditField}
//         />
//       </View>

//       {/* Edit Modal */}
//       {currentField && (
//         <EditFieldModal
//           isVisible={modalVisible}
//           fieldName={currentField.displayName}
//           currentValue={currentField.value}
//           fieldKey={currentField.key}
//           onSave={handleSaveField}
//           onCancel={() => {
//             setModalVisible(false);
//             setCurrentField(null);
//           }}
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#222',
//     padding: 16,
//   },
//   section: {
//     backgroundColor: '#111',
//     borderRadius: 8,
//     overflow: 'hidden',
//     marginBottom: 16,
//   },
// });

// export default ProfileDisplay;
