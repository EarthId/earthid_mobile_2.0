import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Dimensions,
  TouchableWithoutFeedback,
  BackHandler,
} from 'react-native';
import { IBottomSheetProps } from './IBottomSheetProps';
import { Screens } from '../../themes';

const screenHeight = Dimensions.get('window').height;

const CustomBottomSheet = ({
  isVisible = false,
  children,
  height = 250,
  onClose,
}: IBottomSheetProps) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (isVisible) {
      showSheet();
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    } else {
      hideSheet();
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }

    return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
  }, [isVisible]);

  const showSheet = () => {
    Animated.timing(translateY, {
      toValue: screenHeight - height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideSheet = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
    });
  };

  const handleBackPress = () => {
    hideSheet();
    return true;
  };

  const handleOverlayPress = () => {
    hideSheet();
  };

  if (!isVisible) return null;

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.container,
          {
            height: height,
            transform: [{ translateY }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default CustomBottomSheet;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: Screens.pureWhite,
    borderTopLeftRadius: 29,
    borderTopRightRadius: 29,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
});
