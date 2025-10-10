import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Screens } from '../../themes';
import Button from '../Button';

const CustomPopupIDV = ({
  isVisible,
  title,
  message,
  buttons,
  onClose,
  inputValue,       // ✅ New prop
  onInputChange,    // ✅ New prop
}) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{title}</Text>

          {onInputChange ? (
            <TextInput
              style={styles.input}
              placeholder="Enter code"
              value={inputValue}
              onChangeText={onInputChange}
            />
          ) : (
            <Text style={styles.message}>{message}</Text>
          )}

          <View style={styles.buttonGroup}>
            {buttons.map((button, index) => (
              <Button
                key={index}
                onPress={() => {
                  button.onPress();
                  onClose();
                }}
                style={{
                  buttonContainer: [
                    styles.buttonContainer,
                    button.text.toLowerCase() === "cancel"
                      ? styles.cancelButtonContainer
                      : styles.authorizeButtonContainer,
                  ],
                  text:
                    button.text.toLowerCase() === "cancel"
                      ? styles.cancelButtonText
                      : styles.authorizeButtonText,
                }}
                title={button.text}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99999,
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    position: 'relative',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    padding: 5,
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 15,
    marginHorizontal: 15,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 25,
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonGroup: {
    width: '90%',
    marginVertical: 10,
  },
  buttonContainer: {
    elevation: 5,
    marginBottom: 0,
  },
  authorizeButtonContainer: {
    backgroundColor: Screens.colors.primary,
    borderWidth: 2,
  },
  cancelButtonContainer: {
    backgroundColor: '#fff',
  },
  authorizeButtonText: {
    color: Screens.pureWhite,
    fontSize: 14,
  },
  cancelButtonText: {
    color: Screens.colors.primary,
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#333',
  },
});

export default CustomPopupIDV;
