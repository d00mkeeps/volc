// import React from "react";
// import { Stack, Text } from "tamagui";
// import { Ionicons } from "@expo/vector-icons";

// interface ViewMoreCardProps {
//   title: string;
//   subtitle: string;
//   onPress: () => void;
// }

// export default function ViewMoreCard({
//   title,
//   subtitle,
//   onPress,
// }: ViewMoreCardProps) {
//   return (
//     <Stack
//       flex={1}
//       backgroundColor="$backgroundSoft"
//       borderRadius="$3"
//       paddingHorizontal="$3"
//       paddingVertical="$2"
//       borderWidth={1}
//       borderColor="$border"
//       borderStyle="dashed"
//       pressStyle={{
//         borderColor: "$primary",
//         backgroundColor: "$background",
//         scale: 0.98,
//       }}
//       hoverStyle={{
//         borderColor: "$primaryLight",
//       }}
//       cursor="pointer"
//       onPress={onPress}
//       justifyContent="center"
//       alignItems="center"
//       minHeight={60}
//     >
//       <Stack alignItems="center" gap="$1">
//         <Ionicons
//           name="chevron-forward-outline"
//           size={16}
//           color="#4a854a" // You might want to use a token here instead
//         />
//         <Text fontSize="$3" fontWeight="500" color="$primary" numberOfLines={1}>
//           {title}
//         </Text>
//         <Text fontSize="$2" color="$textSoft" numberOfLines={1}>
//           {subtitle}
//         </Text>
//       </Stack>
//     </Stack>
//   );
// }
