import { StyleSheet, Dimensions, Platform } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.35;
export const MODAL_WIDTH = SCREEN_WIDTH * 0.9;

export const styles = StyleSheet.create({
  configSelector: {
    borderWidth: 1,
    borderColor: '#2a332a',
    borderRadius: 15,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#041402',
  },
  configSelectorText: {
    color: '#fff',
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    position: 'absolute',
    top: -83,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 80 : 20,
  },
  modalContent: {
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
    backgroundColor: '#222',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  dismissArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  expandedInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    textAlignVertical: 'top',
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 12,
  },

  // Input Area styles
container: {
  flexDirection: 'row',
  paddingVertical: 16,
  paddingHorizontal: 16,
  backgroundColor: '#1f281f',
  borderTopWidth: 1,
  borderTopColor: '#2a332a',
  width: '100%',
  minHeight: 80,
},
  keyboardAvoidingView: {
    width: '100%',
},
  homePageContainer: {
    backgroundColor: '#222',
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2a332a',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#041402',
    color: '#fff',
    fontSize: 16,
    minHeight: 40,
  },
  homePageInput: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  disabledInput: {
    backgroundColor: '#0a1c08',
    borderColor: '#1a231a',
    color: '#666',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  homePageSendButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#2a332a',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#666',
  },
});