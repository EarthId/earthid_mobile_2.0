import {
  StackActions,
  useNavigation,
  useRoute,
  useTheme,
} from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
} from "react-native";
import { RNCamera } from "react-native-camera";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';

import Button from "../../components/Button";
import { SnackBar } from "../../components/SnackBar";
import GenericText from "../../components/Text";
import { LocalImages } from "../../constants/imageUrlConstants";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { SaveSecurityConfiguration } from "../../redux/actions/LocalSavingActions";
import { Screens } from "../../themes/index";
import { ESecurityTypes } from "../../typings/enums/Security";
import { getDeviceId } from "../../utils/encryption";
import { SERVICE } from "../../utils/securityServices";
import DocumentMask from "../uploadDocuments/DocumentMask";
import { EARTHID_DEV_BASE } from "../../constants/URLContstants";
import { useFetch } from "../../hooks/use-fetch";
import CustomPopup from "../../components/Loader/customPopup";
import { saveDocuments } from "../../redux/actions/authenticationAction";
//import { saveDocuments } from "../../redux/actions/authenticationAction";

const rnBiometrics = new ReactNativeBiometrics();

const LivenessCameraScreen = (props: any) => {

  const [isPopupVisible, setPopupVisible] = useState(false);
  const [popupContent, setPopupContent] = useState({
    title: '',
    message: '',
    buttons: []
  });

  const showPopup = (title, message, buttons) => {
    setPopupContent({ title, message, buttons });
    setPopupVisible(true);
  };

  const [maskedColor, setmaskedColor] = useState("#fff");
  const passcodes = AsyncStorage.getItem("passcode");
  const route = useRoute();
  const {
    loading,
    data: deletedRespopnse,
    error,
    fetch: deleteFetch,
  } = useFetch();
  const navigation = useNavigation();
  const types = route?.params?.type;

  const [data, setData] = useState();
  const dispatch = useAppDispatch();
  const userDetails = useAppSelector((state) => state.contract);
  const securityReducer: any = useAppSelector((state) => state.security);
  // Initial state of variables
  let rightEyeOpen: any[] = [];
  let camera: {
    takePictureAsync: (arg0: { quality: number; base64: boolean }) => any;
  } | null = null;
  let faceCount = 0;
  let faceId: null = null;
  let faceOrigin: any[] = [];
  let stillToast = true;
  let faceDetected = false;

  // Averaging Function
  const average = (array: any[]) =>
    array && array.length > 0
      ? array.reduce((a: any, b: any) => a + b) / array.length
      : 0;

  // Face Distance Calculator
  const distance = (x0: number, y0: number, x1: number, y1: number) =>
    Math.hypot(x1 - x0, y1 - y0);

  const _handleBarCodeRead = async (faceArray: any) => {
    if (!faceDetected) {
      // Face Recognition algorithm
      if (faceArray.faces.length === 1 && faceCount < 2) {
        var id = faceArray.faces[0].faceID;
        if (faceId === null) {
          faceId = id;
        }

        if (faceArray.faces[0].faceID === id) {
          rightEyeOpen.push(faceArray.faces[0].rightEyeOpenProbability);
          faceOrigin.push(faceArray.faces[0].bounds.origin);
        }
        faceCount += 1;
      } else {
        var avg = average(rightEyeOpen);
        var min = Math.min(...rightEyeOpen);
        var threshold = avg / 2;
        var hasMoved = false;
        for (let index = 0; index < faceOrigin.length - 1; index++) {
          var displacement = distance(
            faceOrigin[index].x,
            faceOrigin[index].y,
            faceOrigin[index + 1].x,
            faceOrigin[index + 1].y
          );
          if (displacement > 30) {
            hasMoved = true;
            if (stillToast) {
              SnackBar({
                indicationMessage: "Be still like a stone !",
              });
              setmaskedColor("red");
            } else {
              setmaskedColor("red");
              SnackBar({
                indicationMessage: "I can still see you moving",
              });
            }
            break;
          }
        }
        if (avg > 0.5) {
          console.log(avg, min);
          if (faceId === faceArray.faces[0].faceID) {
            setmaskedColor("green");
            SnackBar({
              indicationMessage: "Aww, Thank you",
            });

            faceDetected = true;
            const options = {
              quality: 0.5,
              base64: true,
            };
            const data = await camRef.current.takePictureAsync(options);
            if (data) {
              saveSelectionSecurities();
            }
          } else {
            SnackBar({
              indicationMessage: "I can still see you moving",
            });
          }
        }
        faceOrigin = [];
        faceId = null;
        faceCount = 0;
        rightEyeOpen = [];
      }
    }
  };

  const deleteuserData = async () => {
    const paramsUrl = `${EARTHID_DEV_BASE}/user/deleteUser?earthId=${userDetails?.responseData?.earthId}&publicKey=${userDetails?.responseData?.publicKey}`;
    // await AsyncStorage.removeItem("passcode");
    // await AsyncStorage.removeItem("fingerprint");
    // await AsyncStorage.removeItem("FaceID");
    // await AsyncStorage.removeItem("pageName");
    // await AsyncStorage.removeItem("profilePic");
    // await AsyncStorage.removeItem("vcCred");
    // await AsyncStorage.removeItem("apiCalled");
    // await AsyncStorage.removeItem("signatureKey");
    // await AsyncStorage.clear(); // Clear all AsyncStorage data
    // console.log("All AsyncStorage data cleared successfully.");
    // Log keys before clear
    const keysBefore = await AsyncStorage.getAllKeys();
    console.log("🔑 Keys before clear:", keysBefore);

    // Clear everything
    await AsyncStorage.clear();

    const keysAfter = await AsyncStorage.getAllKeys();
    console.log("✅ Keys after clear:", keysAfter);

    // ✅ Clear Redux document list
  dispatch(saveDocuments([]));

// Dispatch action to clear DocumentList in Redux
// dispatch(saveDocuments([])); // Clear DocumentList by setting it to an empty array
// console.log("Redux DocumentList cleared.");

    const requestBoady = {
      publicKey: userDetails?.responseData?.publicKey,
    };

    deleteFetch(paramsUrl, requestBoady, "DELETE");
    // const bucketName = `idv-sessions-${userDetails?.username.toLowerCase()}`;
    // deleteSingleBucket(bucketName);

    setTimeout(() => {
      navigation.dispatch(StackActions.replace("AuthStack"));
    }, 1000);
  };

  const saveSelectionSecurities = async () => {
    const passcode = await AsyncStorage.getItem("passcode");
    const faceID = await AsyncStorage.getItem("FaceID");
    if (passcode && types === "false") {
      props.navigation.dispatch(
        StackActions.replace("PasswordCheck", {
          type: "facecheck",
        })
      );
    } else if (passcode && types === "true") {
      props.navigation.dispatch(
        StackActions.replace("PasswordCheck", {
          type: "true",
        })
      );
    } else if (types === "true") {
      deleteuserData();
    } else if (types === "false" || types === "facecheck") {
      props.navigation.dispatch(
        StackActions.replace("DrawerNavigator", { type: "Faceid" })
      );
    } else {
      props.navigation.dispatch(
        StackActions.replace("DrawerNavigator", { type: "Faceid" })
      );
    }
  };

  const handleFaceID = async () => {
    rnBiometrics.simplePrompt({ promptMessage: 'Authenticate with Biometrics' })
      .then(async (resultObject) => {
        const { success } = resultObject;
        if (success) {
         // Alert.alert('Authenticated successfully');
         
          saveSelectionSecurities();
        } else {
          //Alert.alert('Authentication failed');
        }
      })
      .catch((error) => {
        //Alert.alert('Authentication error', error.message);
      });
  };

  const { colors } = useTheme();
  const camRef: any = useRef();

  useEffect(() => {
    // if (Platform.OS === 'ios') {
    //   handleFaceID();
    // }
    handleFaceID()
  }, []);

  return (
    <View style={styles.sectionContainer}>
      <View style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}>
        <TouchableOpacity onPress={() => props.navigation.goBack()}>
          <Image
            resizeMode="contain"
            style={[styles.logoContainer]}
            source={LocalImages.closeImage}
          ></Image>
        </TouchableOpacity>
      </View>

      {Platform.OS === 'android' && (
        <RNCamera
          ref={camRef}
          onMountError={(errr) => {
            console.log("onmount error", errr);
          }}
          style={styles.preview}
          androidCameraPermissionOptions={null}
          type={RNCamera.Constants.Type.front}
          focusDepth={1.0}
          trackingEnabled={true}
          faceDetectionClassifications={
            RNCamera.Constants.FaceDetection.Classifications.all
          }
          faceDetectionLandmarks={RNCamera.Constants.FaceDetection.Landmarks.all}
          faceDetectionMode={RNCamera.Constants.FaceDetection.Mode.accurate}
          onFacesDetected={!data && _handleBarCodeRead}
          captureAudio={false}
        >
          <DocumentMask color={maskedColor} />
        </RNCamera>
      )}
      <GenericText
        style={{
          textAlign: "center",
          paddingVertical: 5,
          fontWeight: "bold",
          fontSize: 16,
          color: "#fff",
        }}
      >
        {"capture"}
      </GenericText>
      <GenericText
        style={{ textAlign: "center", paddingVertical: 5, color: "#fff" }}
      >
        {"placeurfacelivebox"}
      </GenericText>
      {/* <Button
        onPress={() => {
          setData(undefined);
        //  props.navigation.goBack()
        }}
        style={{
          buttonContainer: {
            elevation: 5,
            marginHorizontal: 10,
          },
          text: {
            color: Screens.pureWhite,
          },
          iconStyle: {
            tintColor: Screens.pureWhite,
          },
        }}
        title={"Retry"}
      ></Button> */}
       <CustomPopup
      isVisible={isPopupVisible}
      title={popupContent.title}
      message={popupContent.message}
      buttons={popupContent.buttons}
      onClose={() => setPopupVisible(false)}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: Screens.black,
  },
  preview: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  logoContainer: {
    width: 15,
    height: 15,
    tintColor: "#fff",
  },
});

export default LivenessCameraScreen;
