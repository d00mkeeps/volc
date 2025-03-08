// import React, { useState } from 'react';
// import { View, StyleSheet } from 'react-native';
// import ProgramList from '@/components/program/molecules/ProgramList';
// import { ProgramDetailsModal } from '@/components/ProgramDisplayModal/ProgramDetailsModal';
// import { Program } from '@/types';
// import { mockPrograms } from '@/assets/mockData'; 

// const ProgramsScreen: React.FC = () => {
//   const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);

//   const handleProgramPress = (programId: string) => {
//     const program = mockPrograms.find(p => p.id === programId);
//     if (program) {
//       setSelectedProgram(program);
//       setModalVisible(true);
//     }
//   };

//   const closeModal = () => {
//     setModalVisible(false);
//     setSelectedProgram(null);
//   };

//   return (
//     <View style={styles.container}>
//       <ProgramList 
//         programs={mockPrograms} 
//         onProgramPress={handleProgramPress} 
//       />
//       {selectedProgram && (
//         <ProgramDetailsModal
//           program={selectedProgram}
//           isVisible={modalVisible}
//           onClose={closeModal}
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#222',
//   },
// });

// export default ProgramsScreen;