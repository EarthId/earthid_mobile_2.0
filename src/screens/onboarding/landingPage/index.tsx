import React, { useContext, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Linking,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  InteractionManager,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from "../../../components/Header";
import { LocalImages } from "../../../constants/imageUrlConstants";
import { SCREENS } from "../../../constants/Labels";
import { Screens } from "../../../themes";
import Button from "../../../components/Button";

import { LanguageContext } from "../../../components/LanguageContext/LanguageContextProvider";
import il8n, { getUserLanguagePreference } from "../.././../utils/i18n";
import GenericText from "../../../components/Text";
import BottomSheet from "../../../components/Bottomsheet";
import { AppLanguage } from "../../../typings/enums/AppLanguage";
import { useTranslation } from "react-i18next";
import DocumentPicker from "react-native-document-picker";
import RNFS from "react-native-fs";
import { isEarthId } from "../../../utils/PlatFormUtils";
import ToggleSwitch from "toggle-switch-react-native";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { saveDocuments, saveFeature, updateDocuments } from "../../../redux/actions/authenticationAction";
import VeriffSdk from '@veriff/react-native-sdk';
import { createVerification, getMediaData, getMediaImage, getSessionDecision } from "../../../utils/veriffApis";
import { dateTime } from "../../../utils/encryption";
import RNFetchBlob from "rn-fetch-blob";
import AnimatedLoader from "../../../components/Loader/AnimatedLoader";
import SuccessPopUp from "../../../components/Loader";
import ErrorPopUp from "../../../components/Loader/errorPopup";
import axios from "axios";

import GLOBALS from "../../../utils/globals";
import { AWS_API_BASE } from "../../../constants/URLContstants";
import { TextInput } from "react-native-gesture-handler";
import IDVNewLaunchScreen from "../../../screens/bottomTabs/documentTab/IDVNewLaunchScreen";
import CustomPopupIDV from "../../../components/Loader/idvPopup";

const resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');
const earthIDLogo = require('../../../../resources/images/earthidLogoBlack.png');
const globalIDLogo = require('../../../../resources/images/logo.png')

interface IHomeScreenProps {
  navigation?: any;
}

export interface IDocumentProps {
  id: string;
  name: string;
  path: string;
  date: string;
  time: string;
  txId: string;
  documentName: string;
  docName: string;
  isLivenessImage: string;
  docType: string;
  docExt: string;
  processedDoc: string;
  vc: any;
  isVc: boolean;
  base64: any;
  pdf?: boolean;
  categoryType?: any;
  color?: string;
  isVerifyNeeded?: boolean;
  signature: any;
  typePDF: any;
  verifiableCredential: any;
}
console.log('globals', GLOBALS)
const landingPage = ({ navigation }: IHomeScreenProps) => {
  const { t } = useTranslation();
  const navigateAction = async () => {

     const registrationOption = "RegisterManually"
           const combinedData = null
            navigation.navigate("RegisterScreen", {combinedData, registrationOption});
  };
  const dispatch = useAppDispatch();
  const saveFeaturesForVc = useAppSelector((state) => state.saveFeatures);
  const [languageVisible, setLanguageVisible] = useState(false);
  const [selectedLanguage, setselectedLanguage] = useState(AppLanguage.ENGLISH);
  const [flag, setflag] = useState(61);
  const [loading, setLoading] = useState(true);
  console.log("flag==>", flag);
  const [load, setLoad] = useState(false);
  const [successResponse, setsuccessResponse] = useState(false);
  const [errorResponse, seterrorResponse] = useState(false);
  const userDetails = useAppSelector((state) => state.account);
  const keys = useAppSelector((state) => state.user);
  const getHistoryReducer = useAppSelector((state) => state.getHistoryReducer);
  let documentsDetailsList = useAppSelector((state) => state.Documents);
  const [verifyVcCred, setverifyVcCred] = useState<any>();

  const [code, setCode] = useState("");
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isIdvLoading, setIDVLoading] = useState(false);

  const [isLaunchVisible, setIsLaunchVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
  

  const clientId = 'earthid-client-12345';
const apiKey = '8f8e28b6-7a6a-4ad2-9ef7-b2c2d10e6a4e';

  useEffect(()=>{
    defaultVcFeature()
  },[])

  const defaultVcFeature =()=>{
    dispatch(saveFeature(false));
  }

  const [langugeList, setLanguageList] = useState([
    {
      flag: LocalImages.englishflag,
      label: "English",
      value: AppLanguage.ENGLISH,
      display:'ENG',
      selection: true,
    },
    {
      flag: LocalImages.spainflag,
      label: "Spanish",
      display:'SPA',
      value: AppLanguage.SPANISH,
    },
    {
      flag: LocalImages.portugalflag,
      label: "Portuguese",
      display:'POR',
      value: AppLanguage.PORTUGUESE,
    },
  ]);
  useEffect(() => {
    getLanguageSelection();
  }, []);

  const getLanguageSelection = async () => {
    const language = await AsyncStorage.getItem("setLanguage");
    if (language) {
      const localList = langugeList.map((item) => {
        if (item.value === language) {
          il8n.changeLanguage(item.value);
          item.selection = true;
        } else {
          item.selection = false;
        }
        return item;
      });
      setLanguageList([...localList]);
    }

    setTimeout(() => {
      setLanguageVisible(true);
    }, 500);
  };
  useEffect(() => {
    navigationCheck();
  }, []);

  const veriffSdkIdvLaunch = async () => {
    console.log('Clicked register with doc')
    const idvFlag = await AsyncStorage.getItem("setIDVFlag");

    // Check if the flag is true
    if (idvFlag === "true") {
      console.log('Got IDV flag')
      const user_id =  await AsyncStorage.getItem("user_id");
      // Launch Veriff SDK
      await AsyncStorage.setItem("sdkStatus", "false"); 
     // veriffSdkLaunch(user_id);
     setIsLaunchVisible(true)
    } else {
      console.log('No IDV flag')
      await AsyncStorage.setItem("sdkStatus", "false"); 
     //setIsLaunchVisible(true)
      // Show the IDV modal
      setPopupVisible(true);
    }
  };


  const updateFeatureFlag = async (user_id, feature_name, status, valid_years) => {
    try {
      const response = await axios.post('https://activate.myearth.id/feature-flags', {
        user_id,
        feature_name,
        status,
        valid_years,
      }, {
        headers: {
          'Content-Type': 'application/json',
          "client-id": clientId, 
            "x-api-key": apiKey,
        },
      });
  
      console.log('Feature flag updated successfully:', response.data);
      return response.data; // Return response for further use if needed
    } catch (error) {
      console.error('Error updating feature flag:', error.response?.data || error.message);
      throw error;
    }
  }



const handleVerifyCode = async () => {
  if (!code) {
    setPopupVisible(false);
    Alert.alert("Error", "Please enter a code.");
    return;
  }

  try {
    setPopupVisible(false);
   // setIDVLoading(true);
    // Call the verification API
    const response = await axios.post(
      "https://activate.myearth.id/verify-idv-code",
      { code },
      {
        headers: {
          "Content-Type": "application/json",
          "client-id": clientId, // Pass client-id from the function parameter
          "x-api-key": apiKey, // Pass x-api-key from the function parameter
        },
      }
    );
    const { status, message, user_id } = response.data;

    if (status === "success") {
      // Code is valid, launch Veriff SDK
      console.log("Verification Successful");
      //Alert.alert("Success", "Code verified. Launching Veriff SDK...");
await updateFeatureFlag(user_id, "IDV", "true", "1")
await AsyncStorage.setItem("user_id", user_id);
await AsyncStorage.setItem("setIDVFlag", "true");
    //  setPopupVisible(false);
     InteractionManager.runAfterInteractions(() => {
       setTimeout(() => {
         setIsLaunchVisible(true);
       }, 300); // 300ms delay for smoother transition
     });
     //await veriffSdkLaunch(user_id);
    } else {
      // Code is invalid
      setPopupVisible(false);
      Alert.alert("Error", "Invalid code. Please try again.");
      return
    }
  } catch (error) {
    console.error("Verification Error:", error);
    setPopupVisible(false);
    Alert.alert("Error", "Failed to verify the code. Please try again later.");
    return
  } finally {
   // setIDVLoading(false);
   setPopupVisible(false);
  }
};

  const navigationCheck = async () => {
    const pageName = await AsyncStorage.getItem("pageName");
    if (pageName) {
      if (pageName === "Security") {
        navigation.navigate("Security");
      } else if (pageName === "BackupIdentity") {
        navigation.navigate("BackupIdentity");
      }
    }
    setLoading(false);
  };

  const initializeUserPreferences = async () => {
    const { languageCode, changeLanguagePreference } =
      useContext(LanguageContext);
    const storedUserLanguagePref = await getUserLanguagePreference();
    console.log("storedUserLanguagePref", storedUserLanguagePref);

    if (languageCode !== storedUserLanguagePref) {
      changeLanguagePreference(storedUserLanguagePref, "SplashScreen");
    }
  };

  const selectLanguage = async (item: any) => {
    il8n.changeLanguage(item.value);
    await AsyncStorage.setItem("setLanguage", item.value);
    const languageList = langugeList.map((itemData, inde) => {
      if (itemData.label === item.label) {
        itemData.selection = true;
        setselectedLanguage(item.value);
        setflag(item.flag);
      } else {
        itemData.selection = false;
      }
      return itemData;
    });
    setLanguageList(languageList);
    setLanguageVisible(false);
  };

  useEffect(() => {
    initializeUserPreferences();
  }, []);

  const openFilePicker = async () => {
    try {
      const resp: any = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
        readContent: true,
      });

      let fileUri = resp[0].uri;
      RNFS.readFile(fileUri, "base64").then((res) => {
        console.log("res", resp);
        navigation.navigate("UploadDocumentPreviewScreen", {
          fileUri: {
            uri: `data:image/png;base64,${res}`,
            base64: res,
            file: resp[0],
            type: "qrRreader",
          },
        });
      });
    } catch (err) {}
  };

  const _handleBarCodeRead = (barCodeData: any) => {
    console.log("barcodedata", barCodeData);
  };
  const onToggelchange = (data: boolean) => {
    dispatch(saveFeature(data));
  };


  const uploadToS3 = async (base64: any, category: any, name: any, type: any) => {
    if (category === "ID") { category = "Identification"; }
    const response = await fetch("https://" + AWS_API_BASE + "documents/upload", {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64: base64,
        category: category,
        name: name,
        type: type,
        credentials: GLOBALS.credentials,
        awsID: GLOBALS.awsID,
      }),
    });
    console.log('this is s3 response:', response)
    let myJson = await response.json();
    console.log('Uploaded to s3', myJson)
  }
  
  


  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  
        const veriffSdkLaunch = async () => {
          setIsLoading(true);
          let user_id = await AsyncStorage.getItem("user_id");

        if (!user_id && userDetails?.responseData?.earthId) {
          user_id = userDetails.responseData.earthId;
        }
        
        console.log("Resolved user_id:", user_id);

              const sessionRes = await createVerification()
  
             

   // Alert.alert("Alert1", "Created Veriff's session");
    // Properly displaying sessionRes
//Alert.alert("Alert2", JSON.stringify(sessionRes, null, 2));
setIsLoading(false)
setIsLaunchVisible(false);

await delay(1000); // Waits for 2 seconds
console.log('Added delay of 2 secs');

    if(sessionRes.status=="success"){
     // Alert.alert("Alert3", "Session success");
      const sessionUrl = sessionRes.verification.url
      const sessionId = sessionRes.verification.id
  
     // Alert.alert("Alert4", `Session ID: ${sessionId}\nSession URL: ${sessionUrl}`);
    
      var result = await VeriffSdk.launchVeriff({
        sessionUrl: sessionUrl,
        customIntroScreen: true,
        branding: {
          logo: resolveAssetSource(isEarthId() ? earthIDLogo : globalIDLogo), // see alternative options for logo below
          //background: '#fffff',
          //onBackground: '#ffffff',
         // onBackgroundSecondary: '#000',
         // onBackgroundTertiary: '#000000',
          primary: '#293fee',
          onPrimary: '#ffffff',
          secondary: '#00bbf9',
          onSecondary: '#ffffff',
          outline: '#444444',
          cameraOverlay: '#863ded',
          onCameraOverlay: '#ffffff',
          error: '#d90429',
          success: '#00bbf9',
          buttonRadius: 28,
          iOSFont: {
            regular: 'Font-Regular',
            medium: 'Font-Medium',
            bold: 'Font-Bold',
          },
          androidFont: {
            regular: 'font_regular',
            medium: 'font-medium',
            bold: 'font_bold',
          }
        },
      });
    
  
  console.log('Response of sdk:', result )
  
  let uploadDocResponseData
  let getDocImages
  let getImage
  let s3fullPath
  
  if(result.status=="STATUS_DONE"){
    setLoad(true);
    await new Promise(resolve => setTimeout(resolve, 8000));
  
      uploadDocResponseData = await getSessionDecision(sessionId);

      if(uploadDocResponseData.decision=="approved"){
        if(uploadDocResponseData.decisionScore>=0.5){
      getDocImages = await getMediaData(sessionId);
  
      const documentFront = getDocImages.images.find(image => image.name === 'document-front-pre');
      console.log(documentFront);
      getImage = await getMediaImage(documentFront.id)
  
      console.log("Document Data", uploadDocResponseData)
   console.log("Document Images", getDocImages)
   console.log("Media Image", getImage)

 //await uploadToS3(getImage, "ID", "ID Document", ".jpg");
  //const fileNameWithExtension = selectedDocument.includes('.') ? selectedDocument : `${selectedDocument}.jpg`;
        // s3fullPath = `cognito/${GLOBALS.awsID}/ID/ID Document.jpg`;
        // console.log('fullPath----------------:', s3fullPath);
  
   await createPayLoadFromDocumentData(uploadDocResponseData )
  
   // await new Promise(resolve => setTimeout(resolve, 5000));
  // const sessionId = "90c1146a-5f81-4c9a-8993-ad0675341a04";
  // const mediaId = "7b752371-0bba-48c1-b283-f50b5c8c4628";
  // const uploadDocResponseData = await getSessionDecision(sessionId);
  // const getDocImages = await getMediaData(sessionId);
  
  // await createPayLoadFromDocumentData(uploadDocResponseData )
  
  //    console.log("Document Data", uploadDocResponseData)
  //  console.log("Document Images", getDocImages)
  //  console.log("Media Image", getImage)
  
  
  
  console.log("UploadDocData:", uploadDocResponseData)
      
  // Extracting data from the person object
  const personData: { [key: string]: string } = {};
  for (const key in uploadDocResponseData.person) {
    if (typeof uploadDocResponseData.person[key]?.value === "string") {
      personData[key] = uploadDocResponseData.person[key].value;
    }
  }
  
  // Extracting data from the document object
  const documentData: { [key: string]: string } = {};
  for (const key in uploadDocResponseData.document) {
    if (typeof uploadDocResponseData.document[key]?.value === "string") {
      documentData[key] = uploadDocResponseData.document[key].value;
    }
  }
  
  // Combining the extracted data into one object
  const combinedData = {
    ...personData,
    ...documentData
  };
  
  // Logging the combined data
  console.log("Combined Data:", combinedData);
  
  
  
  const username = uploadDocResponseData.person?.firstName?.value ?? null;
  
  //  const docFrontBase64 = await urlToBase64(documentFront.url)
  //  console.log(docFrontBase64);
  
  const selectedDocument = "ID"
      // verifiAPICall()
   
      setTimeout(async() => {
       // const index = documentsDetailsList?.responseData?.findIndex(
       //   (obj: { id: any; }) => obj?.id === selectedItem?.id
       // );
       // console.log("index", index);
       // if (selectedItem) {
       //   console.log("indexData", "index1");
       //   setsuccessResponse(true);
  
       //   const obj = documentsDetailsList?.responseData[index];
       //   obj.documentName = selectedDocument;
       //   obj.categoryType =
       //     selectedDocument && selectedDocument?.split("(")[0]?.trim();
       //   dispatch(
       //     updateDocuments(documentsDetailsList?.responseData, index, obj)
       //   );
       //   setTimeout(async () => {
       //     setsuccessResponse(false);
       //     const item = await AsyncStorage.getItem("flow");
       //     //const userDetails = await AsyncStorage.getItem("userDetails");
       //     if (userDetails.responseData) {
       //       //props.navigation.navigate("Documents");
       //     } else {
       //       // generateVc()
       //       navigation.navigate("RegisterScreen");
             
       //     }
       //   }, 2000);
       // } else {
         console.log("indexData", "index2");
         
        //  var date = dateTime();
        //  const filePath = RNFetchBlob.fs.dirs.DocumentDir + "/" + "Adhaar";
        //  var documentDetails: IDocumentProps = {
        //    id: `ID_VERIFICATION${Math.random()}${selectedDocument}${Math.random()}`,
        //    // name: selectedDocument,
        //    documentName: selectedDocument,
        //    path: filePath,
        //    s3Path: s3fullPath,
        //    date: date?.date,
        //    time: date?.time,
        //    //txId: data?.result,
        //    txId: sessionId,
        //    docType: "jpg",
        //    docExt: ".jpg",
        //    processedDoc: "",
        //    base64: getImage,
        //    categoryType: selectedDocument && selectedDocument?.split("(")[0]?.trim(),
        //    docName: "ID Document",
        //    isVerifyNeeded: true,
        //    isLivenessImage: null,
        //    name: "",
        //    vc: undefined,
        //    isVc: false,
        //    signature: undefined,
        //    typePDF: undefined,
        //    verifiableCredential: undefined
        //  };
  
        //  var DocumentList = documentsDetailsList?.responseData
        //    ? documentsDetailsList?.responseData
        //    : [];
        //  var documentDetails1: IDocumentProps = {
        //    id: `ID_VERIFICATION${Math.random()}${"selectedDocument"}${Math.random()}`,
        //    name: "Proof of age",
        //    path: "filePath",
        //    documentName: "Proof of age",
        //    categoryType: "ID",
        //    date: date?.date,
        //    time: date?.time,
        //    txId: "data?.result",
        //    docType: verifyVcCred?.type[1],
        //    docExt: ".jpg",
        //    processedDoc: "",
        //    isVc: true,
        //    vc: JSON.stringify({
        //      name: "Proof of age",
        //      documentName: "Acknowledgement Token",
        //      path: "filePath",
        //      date: date?.date,
        //      time: date?.time,
        //      txId: "data?.result",
        //      docType: "pdf",
        //      docExt: ".jpg",
        //      processedDoc: "",
        //      isVc: true,
        //    }),
        //    verifiableCredential: verifyVcCred,
        //    docName: "",
        //    base64: undefined,
        //    isLivenessImage: "",
        //    signature: undefined,
        //    typePDF: undefined
        //  };
  
        //  var DocumentList = documentsDetailsList?.responseData
        //    ? documentsDetailsList?.responseData
        //    : [];
        //  DocumentList.push(documentDetails);
        // DocumentList.push(documentDetails1);
        //  dispatch(saveDocuments(DocumentList));
        
        //  setsuccessResponse(true);
        //  getHistoryReducer.isSuccess = false;
         setTimeout(async () => {
           setsuccessResponse(false);
           const item = await AsyncStorage.getItem("flow");
            const registrationOption = "RegisterWithDoc"
             // generateVc()
             navigation.navigate("RegisterScreen", {combinedData, registrationOption, s3fullPath, sessionId, getImage, user_id, uploadDocResponseData});
             
           
         }, 2000);
       //}
     }, 200);
     setLoad(false);
  
  //  navigation.navigate("RegisterScreen", {
  //   uploadDocResponseData, getDocImages
  // });

}else{
  console.log("Didn't recieve uploaded doc data")
 seterrorResponse(true)
  throw new Error('An error occurred during image validation');
} }else{
  console.log("Didn't recieve uploaded doc data")
 seterrorResponse(true)
  throw new Error('An error occurred during image validation');
}
  
  }else if(result.status=="STATUS_CANCELED"){
    console.log("Veriff SDK closed by user")
    setLoad(false);
    // seterrorResponse(true)
    // throw new Error('An error occurred during image validation');
  }else{
    console.log("Veriff SDK closed unexpectedly")
    setLoad(false);
   //seterrorResponse(true)
    //throw new Error('An error occurred during image validation');
  }
  
  

    }else{
      //Alert.alert("Alert5", JSON.stringify(sessionRes, null, 2));
      console.log("Didn't recieve uploaded doc data")
     seterrorResponse(true)
      throw new Error('An error occurred during image validation');
    }
 

  }

  const hideErrorPopup = () => {
   // navigation.goBack(); // Use the navigation prop to go back
   seterrorResponse(false)
   setLoad(false);
  }

  const urlToBase64 = async (url: any) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting URL to Base64:', error);
      throw error;
    }
  }

  const createPayLoadFromDocumentData = async (documentResponseData: any) => {
    console.log("Username:", documentResponseData?.person?.firstName?.value);
    console.log("Date of Birth:", documentResponseData?.person?.dateOfBirth?.value);
  
    const username = documentResponseData?.person?.firstName?.value ?? null;
    const userDOB = documentResponseData?.person?.dateOfBirth?.value ?? null;
  
    await AsyncStorage.setItem("userDOB", userDOB);
    await AsyncStorage.setItem("userName", username);
    await AsyncStorage.setItem("uploadedDocReg", JSON.stringify(documentResponseData));
    await AsyncStorage.setItem("flow", "documentflow");
  };
  
  


  return (
    <View style={styles.sectionContainer}>
      <ScrollView contentContainerStyle={styles.sectionContainer}>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <Header
            isLogoAlone={true}
            linearStyle={styles.linearStyle}
            containerStyle={{
              iconStyle: {
                width: 205,
                height: 72,
                marginTop: 30,
              },
              iconContainer: styles.alignCenter,
            }}
          ></Header>
          <View style={styles.category}>
            <View>
              <GenericText
                style={[
                  styles.categoryHeaderText,
                  {
                    fontSize: 18,
                    fontWeight: "bold",
                    textAlign: "center",
                    color: Screens.black,
                  },
                ]}
              >
                {SCREENS.LANDINGSCREEN.setUpId}
              </GenericText>
              <GenericText
                style={[
                  styles.categoryHeaderText,
                  {
                    fontSize: 15,
                    fontWeight: "500",
                    textAlign: "center",
                    color: Screens.grayShadeColor,
                  },
                ]}
              >
                {SCREENS.LANDINGSCREEN.instruction}
              </GenericText>
              <Button
                // onPress={() =>
                //   navigation.navigate("UploadDocument", {
                //     type: { data: "reg" },
                //   })
                // }
                onPress={veriffSdkIdvLaunch}
                style={{
                  buttonContainer: {
                    backgroundColor: Screens.pureWhite,
                    elevation: 5,
                  },
                  iconStyle: {
                    tintColor: Screens.colors.primary,
                  },
                }}
                leftIcon={LocalImages.registerdocumentImage}
                title={"registerwithdoc"}
              ></Button>
              <View style={{ marginTop: -20 }}>
                <Button
                  onPress={navigateAction}
                  style={{
                    buttonContainer: {
                      backgroundColor: Screens.pureWhite,
                      elevation: 5,
                    },
                    iconStyle: {
                      tintColor: Screens.colors.primary,
                    },
                  }}
                  leftIcon={LocalImages.manualIcon}
                  title={"registermanually"}
                ></Button>
              </View>
            </View>
            <View style={{ marginTop: 30 }}>
              <GenericText
                style={[
                  styles.categoryHeaderText,
                  {
                    fontSize: 16,
                    fontWeight: "500",
                    textAlign: "center",
                    color: Screens.black,
                  },
                ]}
              >
                {isEarthId() ? "alreadyhaveearthid" : "alreadyhaveglobalid"}
              </GenericText>
              <Button
                onPress={() => navigation.navigate("UploadQr")}
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
                leftIcon={LocalImages.uploadqrimage}
                title={SCREENS.LANDINGSCREEN.BUTTON_LABEL}
              ></Button>

              <View style={{ paddingHorizontal: 15 }}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.categoryHeaderText,
                    {
                      fontSize: 13,
                      fontWeight: "500",
                      textAlign: "center",
                      color: Screens.black,
                    },
                  ]}
                >
                  {t("continuetoagrees")}

                  <Text
                    allowFontScaling={false}
                    style={{ color: Screens.colors.primary, fontSize: 13 }}
                    onPress={() =>
                      Linking.openURL("https://globalidiq.com/terms-of-use-3/")
                    }
                  >
                    {"Terms & Conditions and Privacy Policy "}
                  </Text>
                </Text>
              </View>
            </View>
            <BottomSheet
              onClose={() => setLanguageVisible(false)}
              height={250}
              isVisible={languageVisible}
            >
              <View
                style={{
                  height: 280,
                  width: "100%",
                  paddingHorizontal: 10,
                }}
              >
                <GenericText
                  style={[
                    {
                      fontSize: 18,
                      marginHorizontal: 20,
                      marginVertical: 25,
                      color: Screens.black,
                      fontWeight: "500",
                    },
                  ]}
                >
                  {"selectLanguages"}
                </GenericText>
                {langugeList.map((item, index) => (
                  <TouchableOpacity onPress={() => selectLanguage(item)}>
                    <View
                      style={{
                        marginVertical: 7,
                        backgroundColor: item.selection ? "#e6ffe6" : "#fff",
                        padding: 10,
                        borderRadius: 8,
                        justifyContent: "space-between",
                        flexDirection: "row",
                      }}
                    >
                      <View style={{ flexDirection: "row" }}>
                        <Image
                          resizeMode="contain"
                          source={item?.flag}
                          style={{ height: 25, width: 25 }}
                        ></Image>
                        <GenericText
                          style={[
                            {
                              fontSize: 18,
                              marginHorizontal: 20,
                              color: Screens.black,
                              fontWeight: "500",
                            },
                          ]}
                        >
                          {item?.label}
                        </GenericText>
                      </View>
                      <Image
                        resizeMode="contain"
                        style={[
                          styles.avatarImageContainer,
                          { tintColor: item.selection ? "green" : "#fff" },
                        ]}
                        source={LocalImages.successTikImage}
                      ></Image>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </BottomSheet>
          </View>
          {/* <View>
            {!__DEV__ &&<View
              style={{
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              <GenericText
                style={[
                  {
                    fontSize: 18,
                    marginHorizontal: 20,
                    color: Screens.black,
                    fontWeight: "500",
                  },
                ]}
              >
                {"VC Features"}
              </GenericText>
              <ToggleSwitch
                onToggle={(value) => onToggelchange(value)}
                isOn={saveFeaturesForVc?.isVCFeatureEnabled}
                size={"small"}
                onColor={Screens.colors.primary}
                offColor={Screens.darkGray}
              />
            </View>}
          </View> */}
          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => setLanguageVisible(true)}
          >
            <View
              style={{
                width: 120,
                height: 40,
                alignSelf: "center",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 15,
                borderRadius: 20,
                backgroundColor:isEarthId()? "#BBC1F6":Screens.colors.primary,
                flexDirection: "row",
                elevation: 5,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 2,
              }}
            >
              <Image
                resizeMode="contain"
                style={{
                  width: 25,
                  height: 25,
                  resizeMode: "contain",
                  // tintColor: "#fff",
                }}
                source={flag}
              ></Image>
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <GenericText
                  style={[
                    styles.categoryHeaderText,
                    {
                      fontSize: 12,
                      fontWeight: "bold",
                      textAlign: "center",
                      color: Screens.pureWhite,
                      marginHorizontal: 5,
                    },
                  ]}
                >
                  {selectedLanguage}
                </GenericText>
              </View>
              <Image
                resizeMode="contain"
                style={{
                  width: 25,
                  height: 25,
                  resizeMode: "contain",
                  tintColor: "#fff",
                }}
                source={LocalImages.down}
              ></Image>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={Screens.colors.primary} size="large" />
        </View>
      )}

<AnimatedLoader
        isLoaderVisible={load || getHistoryReducer?.isLoading}
        loadingText={"verifying"}
      />
      <SuccessPopUp
        isLoaderVisible={successResponse}
        loadingText={"verificationsuccess"}
      />

<ErrorPopUp // Error popup component
  isLoaderVisible={errorResponse}
  loadingText={"An error occurred. Please try again."}
  onHide={hideErrorPopup}
/>

{/* <CustomPopupIDV
  isVisible={isPopupVisible}
  title="Enter IDV Code"
  inputValue={code}
  onInputChange={setCode}
  buttons={[
    { text: "Verify", onPress: handleVerifyCode },
  ]}
  onClose={() => setPopupVisible(false)}
/> */}

 {/* IDV Verification Popup */}
 <IDVNewLaunchScreen isVisible={isLaunchVisible} isLoading={isLoading} onClose={() => setIsLaunchVisible(false)} onStartVerification={veriffSdkLaunch} />
   
   {/* Popup for Code Entry */}
   <BottomSheet
        isVisible={isPopupVisible}
        onClose={() => setPopupVisible(false)}
        height={200}
      >
        <View style={styles.popupContainer}>
  <TextInput
    style={[
      styles.input,
      { width: 300, alignSelf: "center", textAlign: "center" }, // 90% width and center alignment
    ]}
    placeholder="Enter Your Code"
    value={code}
    onChangeText={setCode}
  />
  <TouchableOpacity
    style={{
      marginTop: 10,
      backgroundColor: Screens.colors.primary, // Set the background color
      padding: 15,
      borderRadius: 50,
      alignItems: "center",
      width: 300, // 90% width
      alignSelf: "center", // Center the button
    }}
    onPress={handleVerifyCode}
  >
    <Text
      style={{
        color: "#FFFFFF", // Set the text color
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center"
      }}
    >
      Verify
    </Text>
  </TouchableOpacity>
</View>

      </BottomSheet> 

      {isIdvLoading && <AnimatedLoader isLoaderVisible={isIdvLoading} loadingText="Verifying..." />}
    
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flexGrow: 1,
    backgroundColor: Screens.colors.background,
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
  title: {
    color: Screens.grayShadeColor,
  },
  subtitle: {
    color: Screens.black,
    paddingLeft: 20,
    fontWeight: "bold",
    fontSize: 15,
    opacity: 1,
  },
  containerForSocialMedia: {
    marginTop: 10,
    marginHorizontal: 10,
    borderColor: Screens.grayShadeColor,
    borderWidth: 0.5,
    borderRadius: 10,
    justifyContent: "center",
  },

  textContainer: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  linearStyle: {
    height: 250,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
  },
  categoryHeaderText: {
    // marginHorizontal: 20,
    // marginVertical: 10,

    color: Screens.headingtextColor,
  },

  logoContainers: {
    width: 30,
    height: 30,
    tintColor: Screens.grayShadeColor,
  },
  alignCenter: { justifyContent: "center", alignItems: "center" },
  label: {
    fontWeight: "bold",
    color: Screens.black,
  },
  category: {
    marginTop: -120,
    backgroundColor: Screens.pureWhite,
    padding: 10,
    marginHorizontal: 15,
    paddingVertical: 30,
    elevation: 5,
    borderRadius: 30,

    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 8,
    flexDirection: "row",
    backgroundColor: Screens.lightGray,
  },
  avatarImageContainer: {
    width: 22,
    height: 28,
    bottom: 3,
  },
  avatarTextContainer: {
    fontSize: 13,
    fontWeight: "500",
  },

  textInputContainer: {
    borderRadius: 10,
    borderColor: Screens.colors.primary,
    borderWidth: 2,
    marginLeft: 10,
    marginTop: -2,
  },
  popupContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    height: 50,
    width: 300,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});

export default landingPage;
