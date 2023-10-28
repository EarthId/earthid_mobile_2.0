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


const UploadQr = (props: any) => {
  const { colors } = useTheme();
  const camRef: any = useRef();

  const [message, Setmessage] = useState<string>("ooo");
  const [data, SetData] = useState(null);
  const [source, setSource] = useState({});
  const [filePath, setFilePath] = useState();
  const [isBarcodeScanned,setBarCodeScanned] = useState(false)
  const [imageResponse, setImageResponse] = useState<any>('');
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
      Alert.alert(
        `${isEarthId()?"EarthId":"GlobaliD"} does'nt exist,please Re-try with some valid QR Identity`,
        '',
        [
          {
            text: "Back",
            onPress: async () => {
              props.navigation.goBack(null)
            },
            style: "cancel",
          },
          {
            text: "Retry",
            onPress: async () => {
              setBarCodeScanned(false)
            },
          },
        ],
        { cancelable: false }
      );
   
    }

  },[getUserError])

  const getDetailsForBucket = async()=>{
    const bucketName = `idv-sessions-${getUserResponse.username.toLowerCase()}`;

    dispatch(byPassUserDetailsRedux(getUserResponse,bucketName)).then(() => {
      props.navigation.navigate("Security");
     
    });
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
        let serviceData = JSON.parse(barCodeData?.data);
        detectedBarCodes(serviceData);
      }
      catch (error) {
        Alert.alert(
          `${isEarthId()?"EarthId":"GlobaliD"} does'nt exist,please Re-try with some valid QR Identity`,
          '',
          [
            {
              text: "Back",
              onPress: async () => {
                props.navigation.goBack(null)
              },
              style: "cancel",
            },
            {
              text: "Retry",
              onPress: async () => {
                setBarCodeScanned(false)
              },
            },
          ],
          { cancelable: false }
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
