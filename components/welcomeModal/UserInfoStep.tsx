import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { TextInput } from '../public/atoms';
import { UserInfoData } from './index';

type UserInfoStepProps = {
  onNext: (data: UserInfoData) => void;
  initialData: UserInfoData;
};

export const UserInfoStep: React.FC<UserInfoStepProps> = ({ onNext, initialData }) => {
  const [userInfo, setUserInfo] = useState<UserInfoData>(initialData);

  const handleChange = (key: keyof UserInfoData, value: string | boolean) => {
    setUserInfo(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onNext(userInfo);
  };

  return (
    <View>
      <Text style={styles.stepTitle}>User Information</Text>
      <TextInput
        placeholder="Display Name"
        value={userInfo.displayName}
        onChangeText={(text) => handleChange('displayName', text)}
        style={styles.input}
      />
      <TextInput
        placeholder="First Name"
        value={userInfo.firstName}
        onChangeText={(text) => handleChange('firstName', text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Last Name"
        value={userInfo.lastName}
        onChangeText={(text) => handleChange('lastName', text)}
        style={styles.input}
      />
      <View style={styles.switchContainer}>
        <Text style={{color: '#8cd884', padding: 3
}}>Use freedom units? (lbs, ft, etc)</Text>
        <Switch
          value={userInfo.isImperial}
          onValueChange={(value) => handleChange('isImperial', value)}
        />
      </View>
  
    </View>
  );
};

const styles = StyleSheet.create({
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8cd884'

  },
  input: {
    marginBottom: 10,
    color: '#8cd884'

  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    color: '#8cd884'

  },
});