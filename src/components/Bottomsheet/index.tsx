import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";
import { Screens } from "../../themes";
import { IBottomSheetProps } from "./IBottomSheetProps";

/**
 * @author  vicky@
 * @description This is a component of BottomSheet.
 * It provides a callback button to close the bottomsheet.
 */

const BottomSheet = ({
  isVisible,
  children,
  height = 250,
  onClose,
}: IBottomSheetProps) => {
  const RBSheets: any = useRef();
  useEffect(() => {
    if (isVisible) {
      RBSheets.current.open();
    } else {
      setTimeout(() => {
        RBSheets.current?.close();
      }, 100); 
    }
  }, [isVisible]);
  return (
    <RBSheet
      ref={RBSheets}
      onClose={onClose}
      height={height}
      openDuration={250}
      customStyles={{
        container: {
          justifyContent: "center",
          alignItems: "center",
          borderTopLeftRadius: 29,
          borderTopRightRadius: 29,
        },
      }}
    >
      {children}
    </RBSheet>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    justifyContent: "flex-end",
    backgroundColor: Screens.pureWhite,
    position: "absolute",
    height: "100%",
    width: "100%",
  },
  content: {
    backgroundColor: Screens.pureWhite,
  },
});
