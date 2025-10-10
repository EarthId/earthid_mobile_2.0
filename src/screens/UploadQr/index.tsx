import { useTheme } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { RNCamera } from "react-native-camera";
import DocumentPicker from "react-native-document-picker";
import CryptoJS from "react-native-crypto-js";
import Button from "../../components/Button";
import { LocalImages } from "../../constants/imageUrlConstants";
import { Screens } from "../../themes/index";
import DocumentMask, {
  QrScannerMaskedWidget,
} from "../uploadDocuments/DocumentMask";
import RNFS from "react-native-fs";
import GenericText from "../../components/Text";
import { launchImageLibrary } from "react-native-image-picker";
import { BASE_URL } from "../../utils/earthid_account";
import { useFetch } from "../../hooks/use-fetch";
import { useAppDispatch } from "../../hooks/hooks";
import { byPassUserDetailsRedux } from "../../redux/actions/authenticationAction";
import * as ImagePicker from "react-native-image-picker";
import { isEarthId } from "../../utils/PlatFormUtils";
import CustomPopup from "../../components/Loader/customPopup";


const UploadQr = (props: any) => {

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

  const { colors } = useTheme();
  const camRef: any = useRef();
  const { navigation } = props;

  const [message, Setmessage] = useState<string>("ooo");
  const [data, SetData] = useState(null);
  //const [keys, setKeys] = useState(null);
  const [source, setSource] = useState({});
  const [filePath, setFilePath] = useState();
  const [isBarcodeScanned,setBarCodeScanned] = useState(false)
  const [imageResponse, setImageResponse] = useState<any>('');
  const secretKey = 'idv-sessions';
  const {
    loading: getUserLoading,
    data: getUserResponse,
    error: getUserError,
    fetch: getUser,
  } = useFetch();
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (getUserResponse) {
      getDetailsForBucket()
    }
  }, [getUserResponse]);

  useEffect(()=>{
    if(getUserError){
      showPopup(
        `${isEarthId() ? "EarthId" : "GlobaliD"} doesn't exist`,
        'Please re-try with some valid QR Identity',
        [
          {
            text: "Back",
            onPress: async () => {
              props.navigation.goBack(null);
              setPopupVisible(false);
            },
            style: "cancel",
          },
          {
            text: "Retry",
            onPress: async () => {
              setBarCodeScanned(false);
              setPopupVisible(false);
            },
          },
        ]
      );
   
    }

  },[getUserError])

  const getDetailsForBucket = async()=>{
    const bucketName = `idv-sessions-${getUserResponse.username.toLowerCase()}`;
    console.log('This is userdetailsresponse:', getUserResponse)

    // dispatch(byPassUserDetailsRedux(getUserResponse,bucketName)).then(() => {
    //   //navigation.navigate("OTPScreen", { type: "phone" });
    //  // props.navigation.navigate("RegisterOTP", { type: "phone" });
    //   //props.navigation.navigate("Security");
     
    // });
    navigation.navigate("RegisterOTP", { type: "phone", getUserResponse: getUserResponse, bucketName: bucketName });
  }

  const requestPermission = async () => {
    try {
    } catch (err) {
      console.log(err);
    }
  };

  const openFilePicker = async () => {
    if (Platform.OS == "android") {
      await requestPermission();
    }
    try {
      // const resp: any = await DocumentPicker.pick({
      //   type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
      //   readContent: true,
      // });

      //IMAGEPICKER
      ImagePicker.launchImageLibrary(
        ImagePicker.ImageLibraryOptions,
        setImageResponse
      )

      // let fileUri = resp[0].uri;
      // RNFS.readFile(fileUri, "base64").then((res) => {
      //   console.log("res", resp);
      //   props.navigation.navigate("UploadDocumentPreviewScreen", {
      //     fileUri: {
      //       uri: `data:image/png;base64,${res}`,
      //       base64: res,
      //       file: resp[0],
      //       type: "qrRreader",
      //     },
      //   });
      // });

     
    } catch (err) {
      console.log("data==>", err);
    }
  };
  function isValidJSON(jsonString: string) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  useEffect(() => {
    console.log('imageResponse',imageResponse)
    if(imageResponse != '' && !imageResponse?.didCancel){
    console.log('==>result',imageResponse?.assets[0]?.uri)
    let fileUri = imageResponse?.assets[0]?.uri;
    // disPatch(savingProfilePictures(fileUri));
    RNFS.readFile(fileUri, "base64").then((res) => {
      console.log("res", res);
      props.navigation.navigate("UploadDocumentPreviewScreen", {
        fileUri: {
          uri: `data:image/png;base64,${res}`,
          base64: res,
          file: res[0],
          type: "qrRreader",
        },
      });
    });
    }
  }, [imageResponse]);


  const _handleBarCodeRead = (barCodeData: any) => {
     
    if(!isBarcodeScanned){
      setBarCodeScanned(true)
      try{
        const decryptedData = CryptoJS.AES.decrypt(barCodeData?.data, secretKey).toString(CryptoJS.enc.Utf8);

const decryptedJsonObject = JSON.parse(decryptedData);
console.log("this is the retrieved data from qr code:", decryptedJsonObject)
// const keys = {
//   UserDid: decryptedJsonObject.UserDid,

// }
        detectedBarCodes(decryptedJsonObject);
      }
      catch (error) {
        showPopup(
          `${isEarthId() ? "EarthId" : "GlobaliD"} doesn't exist`,
          'Please re-try with some valid QR Identity',
          [
            {
              text: "Back",
              onPress: async () => {
                props.navigation.goBack(null);
                setPopupVisible(false);
              },
              style: "cancel",
            },
            {
              text: "Retry",
              onPress: async () => {
                setBarCodeScanned(false);
                setPopupVisible(false);
              },
            },
          ]
        );
      }
 
    }
 
 
  };

  
  const detectedBarCodes = (barcode: any) => {
    if (getUserResponse === undefined) {
      let url = `${BASE_URL}/user/getUser?earthId=${barcode?.earthId}`;

      getUser(url, {}, "GET");
    }
  };

  const sendOtp = async () => {
    if(getUserResponse){

    }else{
      console.log("Cannot find mobile number to send otp")
    }
  }

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
      <View
        style={{
          flex: 0.8,
        }}
      >
        <RNCamera
          ref={camRef}
          style={styles.preview}
          androidCameraPermissionOptions={null}
          type={RNCamera.Constants.Type.back}
          captureAudio={false}
          onBarCodeRead={(data) => !getUserLoading && _handleBarCodeRead(data)}
        ></RNCamera>
      </View>
      <View>
        <GenericText
          style={{
            textAlign: "center",
            paddingVertical: 5,
            fontWeight: "bold",
            fontSize: 13,
            color: "#fff",
          }}
        >
          {"Please scan the QR code for login the application"}
        </GenericText>
        <GenericText
          style={{ textAlign: "center", paddingVertical: 5, color: "#fff" }}
        >
          {"or"}
        </GenericText>

        <Button
          onPress={openFilePicker}
          leftIcon={LocalImages.upload}
          style={{
            buttonContainer: {
              elevation: 5,
            },
            text: {
              color: Screens.pureWhite,
            },
            iconStyle: {
              tintColor: Screens.pureWhite,
            },
          }}
          title={"uploadgallery"}
        ></Button>
      </View>
      {getUserLoading && (
        <View style={styles.loading}>
          <ActivityIndicator color={Screens.colors.primary} size="large" />
        </View>
      )}
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

    justifyContent: "space-between",
  },
  loading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    flex: 1,
    marginTop: 100,
  },
  logoContainer: {
    width: 15,
    height: 15,
    tintColor: "#fff",
  },
});

export default UploadQr;
