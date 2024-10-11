import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

interface TimeframeSelectProps {
  timeframes: string[];
  selectedTimeframe: string;
  onSelectTimeframe: (timeframe: string) => void;
}

const TimeframeSelect: React.FC<TimeframeSelectProps> = ({ timeframes, selectedTimeframe, onSelectTimeframe }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (timeframe: string) => {
    onSelectTimeframe(timeframe);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity style={styles.selectButton} onPress={() => setModalVisible(true)}>
        <View style={styles.selectButtonContainer}>
          <Text style={styles.selectButtonText}>
            {selectedTimeframe || 'Select timeframe'}
          </Text>
          <Text style={styles.listIcon}>☰</Text>
        </View>
      </TouchableOpacity>
      
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <FlatList
              data={timeframes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.timeframeItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.timeframeItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
    selectButton: {
      paddingHorizontal: 6,
      paddingVertical: 8,
      backgroundColor: '#4a854a',
      borderRadius: 10,
    },
    selectButtonText: {
      color: '#ddd',
      fontSize: 14,  
      fontWeight: 'medium',
      textAlign: 'center',
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
      backgroundColor: '#559e55',
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '80%',
      maxHeight: '80%',
    },
    searchInput: {
      height: 40,
      borderColor: '#4a854a',
      borderWidth: 1,
      borderRadius: 10,
      paddingLeft: 10,
      marginBottom: 10,
      width: '100%',
      color: '#eee',
      backgroundColor: '#4a854a',
    },
    timeframeItem: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#4a854a',
      width: '100%',
    },
    timeframeItemText: {
      color: '#ddd',
      fontSize: 16,
    },
    closeButton: {
      marginTop: 15,
      backgroundColor: '#4a854a',
      borderRadius: 20,
      padding: 10,
      elevation: 2,
    },
    closeButtonText: {
      color: '#ddd',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    caret: {
      fontSize: 18, 
      color: '#ddd',
    },
    selectButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    listIcon: {
      color: '#eee',
      fontSize: 24,
      marginLeft: 5, 
      paddingRight: 8,
  
    },
  
  
  });
export default TimeframeSelect;