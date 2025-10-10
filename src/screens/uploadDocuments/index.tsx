import { useTheme } from "@react-navigation/native";
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  PermissionsAndroid,
  Pressable,
  Alert,
  Text,
  Dimensions,
  TouchableWithoutFeedback,
  LayoutAnimation, UIManager,
} from "react-native";
import { RNCamera } from "react-native-camera";
import DocumentPicker from "react-native-document-picker";
import Button from "../../components/Button";
import { LocalImages } from "../../constants/imageUrlConstants";
import { Screens } from "../../themes/index";
import DocumentMasks from "../uploadDocuments/DocumentMasks";
import RNFS from "react-native-fs";
import GenericText from "../../components/Text";
import { useFetch } from "../../hooks/use-fetch";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import SuccessPopUp from "../../components/Loader";
import { encodeBase64 } from "react-native-image-base64";
import Spinner from "react-native-loading-spinner-overlay/lib";
import { saveDocuments } from "../../redux/actions/authenticationAction";
import { dateTime } from "../../utils/encryption";
import CustomPopup from "../../components/Loader/customPopup";
import ImagePicker from "react-native-image-crop-picker";
import { IDocumentProps } from "../uploadDocuments/VerifiDocumentScreen";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;


if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const useForceUpdate = () => {
  console.log("Simulated Alert triggered for UI fix1");
  setTimeout(() => {
    Alert.alert(
      '',  // Empty title
      '',  // Empty message
      [],  // No buttons
      { cancelable: true }
    );
    console.log("Simulated Alert triggered for UI fix2");
    // Immediately trigger layout animation to force UI update
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    console.log("Simulated Alert triggered for UI fix3");
  }, 0);
};

const UploadScreen = (props: any) => {
  
 

  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [layoutFixKey, setLayoutFixKey] = useState(0);

  const camRef: any = useRef();
  const { loading } = useFetch();
  const [successResponse, setsuccessResponse] = useState(false);
  const getHistoryReducer = useAppSelector((state) => state.getHistoryReducer);
  const [message, Setmessage] = useState<string>("ooo");
  const [source, setSource] = useState({});
  const [filePath, setFilePath] = useState();

  const [url, setUrl] = useState("");
  const [isLoading, setisLoading] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const documentsDetailsList = useAppSelector((state) => state.Documents);
  const dispatch = useAppDispatch();

  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isDocumentPickerActive, setDocumentPickerActive] = useState(false);
 const userDetails = useAppSelector((state) => state.account);
  const keys = useAppSelector((state) => state.user);

const ssiBaseUrl = "https://ssi-test.myearth.id/api"
          const authorizationKey = "01a41742-aa8e-4dd6-8c71-d577ac7d463c"

  const [popupContent, setPopupContent] = useState({
    title: '',
    message: '',
    buttons: []
  });

  const showPopup = (title, message, buttons) => {
    setPopupContent({ title, message, buttons });
    setPopupVisible(true);
  };

  const _takePicture = async () => {
    const options = { quality: 0.1, base64: true };
    const data = await camRef.current.takePictureAsync(options);

    if (data) {
      props.navigation.navigate("DocumentPreviewScreen", { fileUri: data });
    }
  };
  const requestPermission = async () => {
    try {
    } catch (err) {
      console.log(err);
    }
  };

  const _handleBarCodeRead = async (barCodeData: any) => {
    let barcodeData = await barCodeData.data;
    console.log("barcodeData", barcodeData);
    setUrl(barcodeData);
  };

  const formatDOB = (dob: string): string => {
    if (typeof dob === 'string' && dob.length === 8 && /^\d{8}$/.test(dob)) {
      const year = dob.substring(0, 4);
      const month = dob.substring(4, 6);
      const day = dob.substring(6, 8);
      return `${year}/${month}/${day}`; // ✅ 09/01/1998
    } else {
      console.warn("Invalid DOB format:", dob);
      return dob;
    }
  };
  
      //createAge VC
      const generateAgeProof = async (userData:any) => {
        try {
          let userDOB = userData.response[0].vc.credentialSubject[0].dateOfBirth;
          console.log('Raw DOB:', userDOB);
          
          const formattedDOB = formatDOB(String(userDOB));
          console.log('Formatted DOB:', formattedDOB);
          
          await AsyncStorage.setItem("userDOB", String(userDOB));
            //const signature = await createUserIdSignature(profileData);
            const data = {"schemaName": "UserAgeSchema:1",
            "isEncrypted": true,
            "dependantVerifiableCredential": [
            ],
            "credentialSubject": {
              "earthId":userDetails?.responseData?.earthId,
              "dateOfBirth": userDOB
            }
          };
      
            const config = {
                method: 'post',
                url: `${ssiBaseUrl}/issuer/verifiableCredential`,
                headers: {
                    'X-API-KEY': authorizationKey,
                    did: keys.responseData.newUserDid,
                    publicKey: keys.responseData.generateKeyPair.publicKey,
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(data),
            };
      console.log('AgeProofVC', config)
            const response = await axios.request(config);
            console.log('AgeProofVC response', response.data.data)
            //const verifiableCredential = response.data.data.verifiableCredential;
          
            return response.data.data;
      
        } catch (error) {
            console.log(error);
            throw error;
        }
      };

  const fetchData = async () => {
    setisLoading(true);
    try {
      const response = await fetch(url);
      console.log("response", response);

      if (response) {
        
        const data = await response.json();
        console.log("Fetched data:", data);

        const ageProofVcFull = await generateAgeProof(data)

        await AsyncStorage.setItem("ageProofVC", JSON.stringify(ageProofVcFull));

        const ageProofVC = ageProofVcFull.verifiableCredential
        console.log('this is ageProofVC----->', ageProofVC)

        setisLoading(false);
        var date = dateTime();
        var documentDetails: IDocumentProps = {
                  id: `ID_VERIFICATION${Math.random()}${"selectedDocument"}${Math.random()}`,
                  name: "Proof of Age",
                  path: "filePath",
                  documentName: "Proof of Age",
                  categoryType: "ID",
                  date: date?.date,
                  time: date?.time,
                  txId: "data?.result",
                  docType: ageProofVC?.type[1],
                  docExt: ".jpg",
                  processedDoc: "",
                  isVc: true,
                  vc: JSON.stringify({
                    name: "Proof of Age",
                    documentName: "Acknowledgement Token",
                    path: "filePath",
                    date: date?.date,
                    time: date?.time,
                    txId: "data?.result",
                    docType: "pdf",
                    docExt: ".jpg",
                    processedDoc: "",
                    isVc: true,
                  }),
                  verifiableCredential: ageProofVC,
                  docName: "",
                  base64: undefined,
                  isLivenessImage: "",
                  signature: undefined,
                  typePDF: undefined
                };

        var DocumentList = documentsDetailsList?.responseData
          ? documentsDetailsList?.responseData
          : [];

        DocumentList.push(documentDetails);
        dispatch(saveDocuments(DocumentList));
        props.navigation.goBack();
      } else {
        setisLoading(false);
        console.log("Error fetching data:", response);
      }
    } catch (error) {
      setisLoading(false);
      console.log("Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  async function requestMediaPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: "Media Permission",
          message: "App needs access to your media files.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Media permission granted");
      } else {
        console.log("Media permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  }

  const openFilePicker = async () => {

    
    if (isDocumentPickerActive) return; // Prevents multiple calls

    setDocumentPickerActive(true); // Set active state

    console.log("Open file picker 1");
    if (Platform.OS == "android") {
      console.log("Open file picker 2");
      requestMediaPermission();
      console.log("Open file picker 3");
    }
    console.log("Open file picker 4");
    try {
      
      console.log("Open file picker 5");
      const resp: any = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles]
      });

      //useForceUpdate()
    //   // Force a re-render by updating the state after DocumentPicker closes
    //   setLayoutFixKey(prevKey => prevKey + 1);

    //   // Optionally, trigger a layout animation to ensure layout updates
    // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

     // const resp: any = [{"fileCopyUri": null, "name": "sample.pdf", "size": 18810, "type": "application/pdf", "uri": "file:///Users/vaibhav/Library/Developer/CoreSimulator/Devices/CB3B813A-80B2-4AF8-BB9D-5D538C589AA8/data/Containers/Data/Application/019A7237-C78A-4E22-8307-034B95CDE3A4/tmp/com.globalidiq.main-Inbox/sample.pdf"}]
      console.log("Open file picker 6");
      console.log("resp===>", resp);
  
      // Get the file size in MB
      const fileSizeInMB = resp[0].size / (1024 * 1024);
  
      // Check if file size exceeds 100MB
      if (fileSizeInMB > 100) {
        setVisible(true);
        Setmessage("File size exceeds 100MB. Please choose a smaller file.");
        return;
      }
  
      let decodedFileName = resp[0].uri;
      decodedFileName = resp[0]?.uri?.replaceAll("%20", " ");
      console.log("Open file picker 7");
      if (Platform.OS == "android") {
      } else {
        decodedFileName = decodeURIComponent(decodedFileName);
      }
  
      if (
        resp[0]?.type === "image/jpeg" ||
        resp[0]?.type === "image/jpg" ||
        resp[0]?.type === "image/png" ||
        resp[0]?.type === "application/pdf"
      ) {
        RNFS.readFile(decodedFileName, "base64")
          .then(async (res) => {
            console.log("res", resp);
            console.log("typePDF", resp[0].uri);
  
            if (resp[0].type == "application/pdf") {
              props.navigation.navigate("DocumentPreviewScreen", {
                fileUri: {
                  uri: `data:image/png;base64,${res}`,
                  base64: res,
                  file: resp[0],
                  type: "application/pdf",
                  imageName: resp[0]?.name,
                  route: "gallery",
                  typePDF: resp[0].uri,
                },
              });
            } else if (resp[0].type == "application/msword") {
              props.navigation.navigate("DocumentPreviewScreen", {
                fileUri: {
                  uri: `data:image/png;base64,${res}`,
                  base64: res,
                  file: resp[0],
                  type: "application/msword",
                  imageName: resp[0]?.name,
                  route: "gallery",
                  typePDF: resp[0].uri,
                },
              });
            } else if (
              resp[0].type ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ) {
              props.navigation.navigate("DocumentPreviewScreen", {
                fileUri: {
                  uri: `data:image/png;base64,${res}`,
                  base64: res,
                  file: resp[0],
                  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  imageName: resp[0]?.name,
                  route: "gallery",
                  typePDF: resp[0].uri,
                },
              });
            } else {
              console.log("check==>####", resp[0]);
              props.navigation.navigate("DocumentPreviewScreen", {
                fileUri: {
                  uri: `data:image/png;base64,${res}`,
                  base64: res,
                  file: resp[0],
                  type: "qrRreader",
                  imageName: resp[0]?.name,
                  route: "gallery",
                },
              });
            }
          })
          .catch((out) => {
            console.log("real error====>", out);
          });
      } else {
        setVisible(true);
        Setmessage("This format is not supported");
      }
      // Force a layout update after file picker closes
    //setLayoutFixKey(layoutFixKey + 1);
    
    setPopupVisible(false);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log("User canceled the picker");
      } else {
        console.log("Error with document picker", err);
      }

      // Ensure the modal is closed even if the document picker is canceled
      setPopupVisible(false);
    } finally {
      setDocumentPickerActive(false); // Reset active state after completion
    }
  };
  
  // const openFilePicker2 = async () => {
  //   if (isDocumentPickerActive) return; // Prevent multiple calls

  //   setDocumentPickerActive(true); // Set active state

  //   try {
  //     console.log("Open file picker");

  //     const resp = await DocumentPicker.pick({
  //       type: [DocumentPicker.types.allFiles],
  //     });
  //     setPopupVisible(false); 
  //     console.log("File selected:", resp);

  //     // Handle the selected document here

  //   } catch (err) {
  //     setPopupVisible(false); 
  //     if (DocumentPicker.isCancel(err)) {
  //       console.log("User canceled the picker");
  //     } else {
  //       console.log("Error with document picker", err);
  //     }
  //   } finally {
  //     setPopupVisible(false); 
  //     setDocumentPickerActive(false); // Reset active state after completion
  //   }
  // };

  // const handleDocumentSelection = async () => {
  //  // setPopupVisible(false); // Close the modal first

  //   // Wait for the modal to close before opening the document picker
  //   setTimeout(async () => {
  //     await openFilePicker2(); // Open the document picker
  //   }, 300); // Small delay to ensure the modal is closed
  // };

  // const openModal = () => {
  //   setPopupVisible(true);
  //   showPopup(
  //     "Please select the document you wish to add:",
  //     '',
  //     [
  //       {
  //         text: 'Select Document',
  //         onPress: handleDocumentSelection, // Handle document selection with delay
  //       },
  //       { text: "Close", onPress: () => setPopupVisible(false) }
  //     ]
  //   );
  // };

  // const openFilePicker = async () => {
  //   let options:any = {
  //     title: 'Select Image',
  //     customButtons: [
  //       {
  //         name: 'customOptionKey',
  //         title: 'Choose Photo from Custom Option'
  //       },
  //     ],
  //     storageOptions: {
  //       skipBackup: true,
  //       path: 'images',
  //     },
  //   };
  //   launchImageLibrary(options,(response: { didCancel: any; }) => {
  //     console.log('Response = ', response);

  //     if (response.didCancel) {
  //       console.log('User cancelled image picker');
  //     }else {
  //       let items:any=""
  //       let source :any =response;
  //       var item =source.assets.map((i:any)=>{
  //         Setmessage(i.bitrate)
  //         setFilePath(i.uri);
  //         items=i.uri
  //       })
  //       // You can also display the image using data:
  //       // let source = {
  //       //   uri: 'data:image/jpeg;base64,' + response.data
  //       // };

  //       console.log(item)

  //       props.navigation.navigate("DocumentPreviewScreen", {
  //                  value: {
  //                     path:items
  //                  },
  //                });
  //     }
  //   });
  // };

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

      <RNCamera
        ref={camRef}
        style={styles.preview}
        androidCameraPermissionOptions={null}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
        onBarCodeRead={(data) => _handleBarCodeRead(data)}
      >
        <DocumentMasks />
      </RNCamera>
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
        {"placethedoc"}
      </GenericText>
      <TouchableOpacity onPress={() => _takePicture()}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            marginBottom: 30,
            backgroundColor: Screens.colors.primary,
            alignSelf: "center",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderColor: "#fff",
              borderWidth: 1,
              borderRadius: 25,
              backgroundColor: "transparent",
            }}
          ></View>
        </View>
      </TouchableOpacity>
      <GenericText
        style={{
          textAlign: "center",
          paddingVertical: 5,
          fontWeight: "bold",
          fontSize: 18,
          color: "#fff",
        }}
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
      {loading ||
        (getHistoryReducer?.isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator color={Screens.colors.primary} size="large" />
          </View>
        ))}

      <SuccessPopUp
        isLoaderVisible={successResponse}
        loadingText={"Pdf uploaded successfully"}
      />

      <Spinner
        visible={isLoading}
        textContent={"Loading..."}
        textStyle={styles.spinnerTextStyle}
      />

<Modal
  animationType="slide"
  transparent={true}
  visible={visible}
  onRequestClose={() => {
    showPopup(
      "Modal Closed",
      "Modal has been closed.",
      [{ text: "OK", onPress: () => setPopupVisible(false) }]
    );
    setVisible(!visible);
  }}
>
  <View style={styles.centeredView}>
    <View style={styles.modalView}>
      <Image
        resizeMode="contain"
        style={{ height: "35%", width: "40%" }}
        source={LocalImages.condition}
      ></Image>
      <Text
        style={{
          fontFamily: "Roboto",
          fontSize: 20,
          fontWeight: "bold",
          color: "#000",
          top: 2,
        }}
      >
        {message}
      </Text>
      <TouchableOpacity
        style={{
          top: 10,
          height: (windowHeight / 80) * 3.5,
          width: (windowWidth / 80) * 9,
          borderColor: "#357AB4",
          borderRadius: 6,
          borderWidth: 1,
          justifyContent: "center",
          backgroundColor: "#357AB4",
        }}
        onPress={() => setVisible(!visible)}
      >
        <Text
          style={{
            fontFamily: "Roboto",
            fontSize: 12,
            fontWeight: "bold",
            color: "#fff",
            textAlign: "center",
          }}
        >
          OK
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

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
    justifyContent: "flex-end",
    alignItems: "center",
  },
  logoContainer: {
    width: 15,
    height: 15,
    tintColor: "#fff",
  },
  //Modal
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 30,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: (windowWidth / 6) * 4.8,
    height: (windowHeight / 20) * 6,
  },

  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});

export default UploadScreen;
