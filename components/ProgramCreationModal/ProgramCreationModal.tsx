// import React, { useState, useRef, useCallback } from 'react';
// import { View, Modal, StyleSheet, SafeAreaView } from 'react-native';
// import Wizard, { WizardRef } from "react-native-wizard";
// import { Button } from '../public/atoms';
// import {ChatUI} from '../conversation/organisms/ChatUI';
// import { Text } from '@/components/Themed';

// type ProgramCreationModalProps = {
//   isVisible: boolean;
//   onClose: () => void;
// };

// // Add step type definition
// interface WizardStep {
//   content: JSX.Element;
// }

// export const ProgramCreationModal: React.FC<ProgramCreationModalProps> = ({ isVisible, onClose }) => {
//   const wizardRef = useRef<WizardRef>(null);
//   const [isFirstStep, setIsFirstStep] = useState(true);
//   const [isLastStep, setIsLastStep] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);

//   const handleProgramGoalsSignal = useCallback((type: string, data: any) => {
//     if (type === 'program_goals_complete') {
//       wizardRef.current?.next();
//     }
//   }, []);

//   const handleIntermediateGoalsSignal = useCallback((type: string, data: any) => {
//     if (type === 'program_intermediate_complete') {
//       wizardRef.current?.next();
//     }
//   }, []);

//   const stepList: WizardStep[] = [
//     {
//       content: (
//         <ChatUI 
//           configName="program"
//           title="Program Goals"
//           subtitle="Let's define your basic goal and create a SMART goal for your program."
//           onSignal={handleProgramGoalsSignal}
//         />
//       )
//     },
//     {
//       content: (
//         <ChatUI 
//           configName="program"
//           title="Intermediate Goals"
//           subtitle="Let's discuss suitable intermediate goals and create your program."
//           onSignal={handleIntermediateGoalsSignal}
//         />
//       )
//     },
//     {
//       content: (
//         <View style={styles.finalStep}>
//           <Text style={styles.finalStepText}>
//             Great job! Your program has been created and uploaded to your profile.
//           </Text>
//         </View>
//       )
//     }
//   ];

//   // Type the callback parameters
//   const handleCurrentStep = useCallback(({ 
//     currentStep, 
//     isLastStep, 
//     isFirstStep 
//   }: {
//     currentStep: number;
//     isLastStep: boolean;
//     isFirstStep: boolean;
//   }) => {
//     setCurrentStep(currentStep);
//     setIsFirstStep(isFirstStep);
//     setIsLastStep(isLastStep);
//     console.log(`Step ${currentStep + 1} of ${stepList.length}`);
//   }, []);

//   return (
//     <Modal
//       animationType="slide"
//       transparent={true}
//       visible={isVisible}
//       onRequestClose={onClose}
//     >
//       <SafeAreaView style={styles.modalContainer}>
//         <View style={styles.wizardContainer}>
//           <Wizard
//             ref={wizardRef}
//             steps={stepList}
//             isFirstStep={(val: boolean) => setIsFirstStep(val)}
//             isLastStep={(val: boolean) => setIsLastStep(val)}
//             currentStep={handleCurrentStep}
//           />
//         </View>
//         <View style={styles.buttonContainer}>
//           {!isFirstStep && (
//             <Button
//               onPress={() => wizardRef.current?.prev()}
//               style={styles.button}
//             >
//               Back
//             </Button>
//           )}
//           <Button
//             onPress={() => {
//               if (isLastStep) {
//                 onClose();
//               } else {
//                 wizardRef.current?.next();
//               }
//             }}
//             style={styles.button}
//           >
//             {isLastStep ? "Finish" : "Next"}
//           </Button>
//         </View>
//       </SafeAreaView>
//     </Modal>
//   );
// };


// const styles = StyleSheet.create({
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   wizardContainer: {
//     backgroundColor: '#1f281f',
//     borderRadius: 20,
//     width: '90%',
//     height: '80%',
//     padding: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '90%',
//     marginTop: 20,
//   },
//   button: {
//     width: '48%',
//   },
//   finalStep: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   finalStepText: {
//     fontSize: 18,
//     textAlign: 'center',
//     padding: 20,
//   },
// });