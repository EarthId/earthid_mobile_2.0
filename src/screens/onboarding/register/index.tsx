import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
  Text,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from "../../../components/Header";
import { SCREENS } from "../../../constants/Labels";
import { Screens } from "../../../themes";
const PNF = require("google-libphonenumber").PhoneNumberFormat;
import Button from "../../../components/Button";
import DatePicker from "react-native-date-picker";
import { KeyboardAvoidingScrollView } from "react-native-keyboard-avoiding-scroll-view";
import Info from "../../../components/Info";
import TextInput from "../../../components/TextInput";
import PhoneInput from "react-native-phone-number-input";
import useFormInput from "../../../hooks/use-text-input";
import { emailValidator, nameValidator ,nameValidators} from "../../../utils/inputValidations";
import Loader from "../../../components/Loader";
import {
  createAccount,
  GeneratedKeysAction,
  saveDocuments,
} from "../../../redux/actions/authenticationAction";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { IUserAccountRequest } from "../../../typings/AccountCreation/IUserAccount";
import {
  dateTime,
  getDeviceId,
  getDeviceName,
} from "../../../utils/encryption";
import GenericText from "../../../components/Text";
import { SnackBar } from "../../../components/SnackBar";
import { isArray } from "lodash";
import { useFetch } from "../../../hooks/use-fetch";
import { newssiApiKey, superAdminApi } from "../../../utils/earthid_account";
import { isEarthId } from "../../../utils/PlatFormUtils";
import Spinner from "react-native-loading-spinner-overlay/lib";
import {
  createUserSignaturekey,
  postApi,
} from "../../../utils/createUserSignaturekey";
import { createVerifiableCred } from "../../../utils/createVerifiableCred";
import { SavedCredVerify } from "../../../redux/reducer/saveDataReducer";
import { SaveVerifyCred } from "../../../redux/actions/LocalSavingActions";
import { RouteProp } from "@react-navigation/native";
import axios from "axios";
import CheckBox from "@react-native-community/checkbox";
import { addConsent } from "../../../utils/consentApis";
import CustomPopup from "../../../components/Loader/customPopup";

import RNFetchBlob from "rn-fetch-blob";
import {registernewDID } from "../../../utils/newSSIAPIs";

interface IRegister {
  navigation: any;
  route: RouteProp<{ params: { combinedData: any, registrationOption: any, s3fullPath:any, sessionId:any, getImage:any, user_id:any, uploadDocResponseData: any } }, "params">;
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

const Register = ({ navigation, route }: IRegister) => {
  const phoneInput: any = useRef();
  const dispatch = useAppDispatch();
  const {
    loading: superAdminLoading,
    data: superAdminResponse,
    fetch: getSuperAdminApiCall,
  } = useFetch();
  const [mobileNumber, setmobileNumber] = useState<string>("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);
  const userDetails = useAppSelector((state) => state.account);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const keys = useAppSelector((state) => state.user);
  const [successResponse, setsuccessResponse] = useState(false);
  const [openDatePicker, setopenDatePicker] = useState<boolean>();
  const [callingCode, setcallingCode] = useState<string>("1");
  const [isValidMobileNumber, setValidMobileNumber] = useState<boolean>(false);
  const [isMobileEmpty, setMobileEmpty] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);

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

  console.log("This is for consent:-------------------------------------------------", isChecked)
  //console.log("These are userDetails:-------------------------------------------------", userDetails)
  const saveFeaturesForVc = useAppSelector((state) => state.saveFeatures);
  // createVerifiableCrendital

  const documentsDetailsList = useAppSelector((state) => state.Documents);
  const [signature, setSignature] = useState();
  const [loading, setLoading] = useState(false);
  const [countryCode, setcountryCode] = useState("US");
  const [createVerify, setCreateVerify] = useState({});
  const issurDid = keys?.responseData?.issuerDid;
  const UserDid = keys?.responseData?.newUserDid;
  const privateKey = keys?.responseData?.generateKeyPair?.privateKey;
  const { combinedData, registrationOption, s3fullPath, sessionId, getImage, user_id, uploadDocResponseData } = route.params;
  let url: any = `https://ssi-test.myearth.id/api/user/sign?issuerDID=${issurDid}`;
  let requesturl: any = `https://ssi-test.myearth.id/api/issuer/verifiableCredential?isCryptograph=${false}&downloadCryptograph=${false}`;
 

  const ssiBaseUrl = "https://ssi-test.myearth.id/api"
  const authorizationKey = "01a41742-aa8e-4dd6-8c71-d577ac7d463c"

    const getHistoryReducer = useAppSelector((state) => state.getHistoryReducer);

  useEffect(() => {
    getItem();
  }, []);

  console.log(signature, "sign");
  console.log(createVerify, "createVerify");
  console.log(UserDid, "UserDid");

  const {
    value: firstName,
    isFocused: firstNameFocus,
    validationResult: {
      hasError: isfirstNameError,
      errorMessage: isfirstNameErrorMessage,
    },
    valueChangeHandler: firstNameChangeHandler,
    inputFocusHandler: firstNameFocusHandlur,
    inputBlurHandler: firstNameBlurHandler,
  } = useFormInput("", true, nameValidator);

  const {
    value: lastName,
    isFocused: lastNameFocus,
    validationResult: {
      hasError: islastNameError,
      errorMessage: islastNameErrorMessage,
    },
    valueChangeHandler: lastNameChangeHandler,
    inputFocusHandler: lastNameFocusHandlur,
    inputBlurHandler: lastNameBlurHandler,
  } = useFormInput("", true, nameValidators);


  const {
    valueChangeHandler: dateOfBirthChangeHandler,
    inputBlurHandler: dateOfBirthlurHandler,
  } = useFormInput("", true, nameValidators);
  const {
    value: email,
    isFocused: emailFocus,
    validationResult: {
      hasError: isemailError,
      errorMessage: isemailErrorMessage,
    },
    valueChangeHandler: emailChangeHandler,
    inputFocusHandler: emailFocusHandlur,
    inputBlurHandler: emailBlurHandler,
  } = useFormInput("", false, emailValidator);

  useEffect(() => {
    console.log('superAdminApi',superAdminApi)
    getSuperAdminApiCall(superAdminApi, {}, "GET");
  }, []);



  const getItem = async () => {
    const item = await AsyncStorage.getItem("flow");
    if (item == "documentflow") {
      const name = await AsyncStorage.getItem("userName");
      console.log('Name is:==============================================================', name)
      firstNameChangeHandler(name);
    }
  };

  const _navigateAction = () => {
    setKeyboardVisible(false);
    setButtonPressed(true);
    mobileNumber === "" ? setMobileEmpty(true) : null;
    console.log("isValid()", isValid());
    if (isValid()) {
      auditFlowApi();
      setLoginLoading(true);
      dispatch(GeneratedKeysAction());
    } else {
      console.log("its coming");
      firstNameBlurHandler();
      emailBlurHandler();
      dateOfBirthlurHandler();
    }
  };

  async function auditFlowApi() {
    const min = 1;
    const max = 666666;
    const minid = 1;
    const maxid = 6666667777;
    const randomNumtopic = Math.floor(Math.random() * (max - min + 1)) + min;
    const randomNumtransID =
      Math.floor(Math.random() * (maxid - minid + 1)) + minid;
    const currentTimestamp = new Date().toISOString();
    const urlRequest: any = "https://w3storage.myearth.id/api/subs/publish";

    const postData = {
      topic: "0.0." + randomNumtopic,
      message: JSON.stringify({
        transactionID: randomNumtransID,
        flowName: "loginFlow",
        topicId: "0.0." + randomNumtopic,
        timestamp: currentTimestamp,
      }),
    };

    const headersToSend = {
      "Content-Type": "application/json",
    };

    await postApi(urlRequest, postData, headersToSend)
      .then((res: any) => {
        console.log("resData", res);
      })
      .catch((e: any) => {
        console.log("error", e);
      });
  }

  const isValid = () => {
    if (
      !nameValidator(firstName, true).hasError &&
      !emailValidator(email, true).hasError &&
      mobileNumber !== "" &&
      isValidMobileNumber
    ) {
      return true;
    }
    return false;
  };


        //createDOc VC
        const createUploadDocVc = async (fieldsObject: any) => {
          try {
              //const signature = await createUserIdSignature(profileData);
              const data = {
                  schemaName: 'UploadedDocVCNeww:1',
                  isEncrypted: false,
                  dependantVerifiableCredential: [],
                  credentialSubject: {
                    "gender": fieldsObject.gender !== undefined ? fieldsObject.gender : null,
                    "idNumber": fieldsObject.idNumber !== undefined ? fieldsObject.idNumber : null,
                    "lastName": fieldsObject.lastName !== undefined ? fieldsObject.lastName : null,
                    "firstName": fieldsObject.firstName !== undefined ? fieldsObject.firstName : null,
                    "citizenship": fieldsObject.citizenship !== undefined ? fieldsObject.citizenship : null,
                    "dateOfBirth": fieldsObject.dateOfBirth !== undefined ? fieldsObject.dateOfBirth : null,
                   // "nationality": fieldsObject.nationality !== undefined ? fieldsObject.nationality : null,
                   // "yearOfBirth": fieldsObject.yearOfBirth !== undefined ? fieldsObject.yearOfBirth : null,
                    "placeOfBirth": fieldsObject.placeOfBirth !== undefined ? fieldsObject.placeOfBirth : null,
                   // "pepSanctionMatch": fieldsObject.pepSanctionMatch !== undefined ? fieldsObject.pepSanctionMatch : null,
                    "occupation": fieldsObject.occupation !== undefined ? fieldsObject.occupation : null,
                    "employer": fieldsObject.employer !== undefined ? fieldsObject.employer : null,
                   // "foreginerStatus": fieldsObject.foreginerStatus !== undefined ? fieldsObject.foreginerStatus : null,
                   // "extraNames": fieldsObject.extraNames !== undefined ? fieldsObject.extraNames : null,
                    "address": fieldsObject.addresses !== undefined ? fieldsObject.addresses : null,
                    "type": fieldsObject.type !== undefined ? fieldsObject.type : null,
                    "number": fieldsObject.number !== undefined ? fieldsObject.number : null,
                    "country": fieldsObject.country !== undefined ? fieldsObject.country : null,
                    "validFrom": fieldsObject.validFrom !== undefined ? fieldsObject.validFrom : null,
                    "validUntil": fieldsObject.validUntil !== undefined ? fieldsObject.validUntil : null,
                  //  "placeOfIssue": fieldsObject.placeOfIssue !== undefined ? fieldsObject.placeOfIssue : null,
                  //  "firstIssue": fieldsObject.firstIssue !== undefined ? fieldsObject.firstIssue : null,
                   // "issueNumber": fieldsObject.issueNumber !== undefined ? fieldsObject.issueNumber : null,
                    "issuedBy": fieldsObject.issuedBy !== undefined ? fieldsObject.issuedBy : null,
                   // "nfcValidated": fieldsObject.nfcValidated !== undefined ? fieldsObject.nfcValidated : null,
                   // "residencePermitType": fieldsObject.residencePermitType !== undefined ? fieldsObject.residencePermitType : null
                  }
              };
        
              const config = {
                  method: 'post',
                  url: `${ssiBaseUrl}/issuer/verifiableCredential?isCryptograph=false&downloadCryptograph=false`,
                  headers: {
                      'X-API-KEY': authorizationKey,
                      did: keys.responseData.newUserDid,
                      publicKey: keys.responseData.generateKeyPair.publicKey,
                      'Content-Type': 'application/json',
                  },
                  data: JSON.stringify(data),
              };
        console.log('DocVcApi', config)
              const response = await axios.request(config);
              console.log('VC response', response.data.data.verifiableCredential)
              //const verifiableCredential = response.data.data.verifiableCredential;
            
              return response.data.data.verifiableCredential;
        
          } catch (error) {
              console.log(error);
              throw error;
          }
        };


                     //createAge VC
                     const generateAgeProof = async (userDOB: any) => {
                      try {
        
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
                          console.log('AgeProofVC response', response.data.data.verifiableCredential)
                          //const verifiableCredential = response.data.data.verifiableCredential;
                        
                          return response.data.data;
                    
                      } catch (error) {
                          console.log(error);
                          throw error;
                      }
                    };

                    const generateIdvProof = async (userId: any, idType: any, score: any) => {
                      try {
                          const data = {
                              schemaName: "IDVProofSchema:1",
                              isEncrypted: true,
                              dependantVerifiableCredential: [],
                              credentialSubject: {
                                  earthId: userDetails?.responseData?.earthId,
                                  userId: userId,
                                  idType: idType, // Example, replace with dynamic value if needed
                                  score: score, // Example, replace with a calculated or dynamic score
                                  timestamp: new Date().toISOString(), // Current timestamp in ISO format
                                  metadata: JSON.stringify({
                                      source: "IDVProvider",
                                      details: "Additional metadata information"
                                  }) // Example JSON metadata
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
                  
                          console.log('IDVProofVC Request', config);
                          const response = await axios.request(config);
                          console.log('IDVProofVC Response', response.data.data.verifiableCredential);
                  
                          return response.data.data.verifiableCredential;
                      } catch (error) {
                          console.error('Error generating IDVProof:', error);
                          throw error;
                      }
                  };
      
  const addConsentCall = async () => {
    try{
      console.log('These are userDetails===============================', userDetails)
   const apiData = {
    
      "earthId": userDetails.responseData.earthId,
      "flowName": "New User Registeration",
      "description": "Added new user",
      "relyingParty": "EarthID",
      "timeDuration": 1,
      "isConsentActive": true,
      "purpose": "User Data Storage"
  
   }
const consentApiCall = await addConsent(apiData)
console.log('Consent Api response------:', consentApiCall)
    }catch (error) {
      throw new Error(`Error adding consent: ${error}`);
    }
  }      


  const saveDocVC = async (docVc, ageVc, idvVc) => {
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
         
         var date = dateTime();
         const filePath = RNFetchBlob.fs.dirs.DocumentDir + "/" + "Adhaar";
         var documentDetails: IDocumentProps = {
           id: `ID_VERIFICATION${Math.random()}${selectedDocument}${Math.random()}`,
           // name: selectedDocument,
           documentName: selectedDocument,
           path: filePath,
          // s3Path: s3fullPath,
           date: date?.date,
           time: date?.time,
           //txId: data?.result,
           txId: sessionId,
           docType: "jpg",
           docExt: ".jpg",
           processedDoc: "",
           base64: getImage,
           categoryType: selectedDocument && selectedDocument?.split("(")[0]?.trim(),
           docName: "ID Document",
           isVerifyNeeded: true,
           isLivenessImage: null,
           name: "",
           vc: docVc,
           isVc: false,
           signature: undefined,
           typePDF: undefined,
           verifiableCredential: docVc
         };
  
         var DocumentList = documentsDetailsList?.responseData
           ? documentsDetailsList?.responseData
           : [];
         var documentDetails1: IDocumentProps = {
           id: `ID_VERIFICATION${Math.random()}${"selectedDocument"}${Math.random()}`,
           name: "Proof of Age",
           path: "filePath",
           documentName: "Proof of Age",
           categoryType: "ID",
           date: date?.date,
           time: date?.time,
           txId: "data?.result",
           docType: ageVc?.type[1],
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
           verifiableCredential: ageVc,
           docName: "",
           base64: undefined,
           isLivenessImage: "",
           signature: undefined,
           typePDF: undefined
         };
  
         var DocumentList = documentsDetailsList?.responseData
           ? documentsDetailsList?.responseData
           : [];

           
          var documentDetails2: IDocumentProps = {
                     id: `ID_VERIFICATION${Math.random()}${"selectedDocument"}${Math.random()}`,
                     name: "Proof of IDV",
                     path: "filePath",
                     documentName: "Proof of IDV",
                     categoryType: "ID",
                     date: date?.date,
                     time: date?.time,
                     txId: "data?.result",
                     docType: idvVc?.type[1],
                     docExt: ".jpg",
                     processedDoc: "",
                     isVc: true,
                     vc: JSON.stringify({
                       name: "Proof of IDV",
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
                     verifiableCredential: idvVc,
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
                DocumentList.push(documentDetails1);
                DocumentList.push(documentDetails2);

         dispatch(saveDocuments(DocumentList));
        
         //setsuccessResponse(true);
         getHistoryReducer.isSuccess = false;
       //}
     }, 200);
  }


  const _registerAction = async ({ publicKey }: any) => {
    const token = await getDeviceId();
    const deviceName = await getDeviceName();

    const newDidDetails = await registernewDID();
    console.log('NewDIDDetails-------------:', newDidDetails)

    console.log('superAdminResponse',superAdminResponse)
    if (superAdminResponse && superAdminResponse[0]?.Id) {
      const payLoad: IUserAccountRequest = {
        firstname: firstName,
        username: email,
        lastname: lastName,
        deviceID: token + Math.random(),
        deviceIMEI: token,
        deviceName: deviceName,
        email: email,
        orgId: superAdminResponse[0]?.Id,
        phone: mobileNumber,
        countryCode: "+" + callingCode,
        publicKey,
        deviceOS: Platform.OS === "android" ? "android" : "ios",
      };
      console.log('payLoad',JSON.stringify(payLoad))
      dispatch(createAccount(payLoad)).then(async () => {
        await AsyncStorage.setItem("flow", "loginflow");
      });
    } else {
      SnackBar({
        indicationMessage: "Registered Id is not generated ,please try again",
        doRetry: getSuperAdminApiCall(superAdminApi, {}, "GET"),
      });
    }
  };
  console.log("keys", keys);
  if (keys && keys?.isGeneratedKeySuccess) {
    keys.isGeneratedKeySuccess = false;

    _registerAction(keys?.responseData?.result);
  }

  if (userDetails && userDetails?.isAccountCreatedSuccess) {
    if(registrationOption=="RegisterWithDoc"){
      (async () => {
      console.log('Sending details to the api2')
      const uploadDocVcResponse = await createUploadDocVc(combinedData)
      console.log('UploadedDocVc is:::::::::::', uploadDocVcResponse)

      if(uploadDocVcResponse){
       // await AsyncStorage.setItem("uploadedDocVc", JSON.stringify(uploadDocVcResponse));
       console.log('Sending details to the api3')
      }
      let ageProofVC
        
      if(combinedData.dateOfBirth!==null){
      const ageProofVcFull = await generateAgeProof(combinedData.dateOfBirth)
await AsyncStorage.setItem("ageProofVC", JSON.stringify(ageProofVcFull));
ageProofVC = ageProofVcFull.verifiableCredential
console.log('this is ageProofVC----->', ageProofVC)
      }
      const idvVc = await generateIdvProof(user_id, uploadDocResponseData.document.type.value, uploadDocResponseData.decisionScore)
  console.log('This is idvVc',idvVc)
      
  await saveDocVC(uploadDocVcResponse, ageProofVC, idvVc)  
  await AsyncStorage.setItem("setIDVFlag", "false");
    })();
    }
    (async () => {
   await addConsentCall()
  })();
    setsuccessResponse(true);
    userDetails.isAccountCreatedSuccess = false;
    console.log(
      "saveFeaturesForVc?.isVCFeatureEnabled===>",
      saveFeaturesForVc?.isVCFeatureEnabled
    );
    if (saveFeaturesForVc?.isVCFeatureEnabled) {
      createVerifiableCredentials().then(() => {
        setLoading(false);
        setLoginLoading(false)
        setTimeout(() => {
          setsuccessResponse(false);
          navigation.navigate("BackupIdentity");
        }, 7000);
      });
    } else {
      setLoading(false);
      setLoginLoading(false)
      setTimeout(() => {
        setsuccessResponse(false);
        navigation.navigate("BackupIdentity");
      }, 7000);
    }
  }
  if (userDetails && userDetails?.isAccountCreatedFailure) {
    userDetails.isAccountCreatedFailure = false;
    if (userDetails?.errorMesssage && isArray(userDetails?.errorMesssage)) {
      console.log("userDetails?.errorMesssage1", userDetails?.errorMesssage);
      SnackBar({
        indicationMessage: userDetails?.errorMesssage[0],
      });
    } else {
      console.log("userDetails?.errorMesssage2", userDetails?.errorMesssage);
      showPopup(
        "Warning",
        "Your EarthID already exists. Please recover it using your QR code generated during the registration process. If you have lost your QR code, please create a new EarthID using a different email, and phone number.",
        [
          {
            text: "OK",
            onPress: () => {
              setPopupVisible(false);
            },
          },
        ]
      );
    }
  }





  const Footer = () => (
    <View style={{ marginHorizontal: 20, backgroundColor: "#fff" }}>
       {/* Checkbox with text */}
       <View style={{ flexDirection: 'row', alignItems: 'center', marginTop:10  }}>
        <CheckBox
          value={isChecked}

          onValueChange={(newValue) => setIsChecked(newValue)}
        />
        <GenericText style={{marginLeft: 10,marginRight: 35, fontSize: 11}}>
        {isEarthId() ? "earthidconsent" : "globalidconsent"}
</GenericText>
      </View>
      <Button
        disabled={!isChecked || !isValidMobileNumber || islastNameError || isfirstNameError || isemailError || firstName==='' || email==='' || lastName === '' }
        onPress={_navigateAction}
        style={{
          buttonContainer: {
            elevation: 5,
            opacity:isChecked && isValidMobileNumber && !islastNameError && !isfirstNameError && !isemailError &&  lastName!==''&& firstName!=='' && email !=='' ?1:0.5
          },
          text: {
            color: Screens.pureWhite,
          },
          iconStyle: {
            tintColor: Screens.pureWhite,
          },
        }}
        title={isEarthId() ? "generateeathid" : "generateglobalid"}
      ></Button>
      <TouchableOpacity onPress={() => navigation.goBack(null)}>
        <View style={{ flexDirection: "row", alignSelf: "center" }}>
          <GenericText
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
            {"alreadyhavemy"}
          </GenericText>
          <GenericText
            style={{
              color: Screens.colors.primary,
              alignSelf: "center",
              textDecorationLine: "underline",
            }}
          >
            {isEarthId() ? "EarthID" : "GlobaliD"}
          </GenericText>
        </View>
      </TouchableOpacity>
    </View>
  );

  const onchangeFirstNameHandler = () => {
    setKeyboardVisible(true);
    firstNameFocusHandlur();
  };
  const onBlurFirstName = () => {
    setKeyboardVisible(false);
    firstNameBlurHandler();
  };
  const onchangelastNameHandler = () => {
    setKeyboardVisible(true);
    lastNameFocusHandlur();
  };
  const onBlurlastName = () => {
    setKeyboardVisible(false);
    lastNameBlurHandler();
  };
  const onchangeEmailHandler = () => {
    setKeyboardVisible(true);
    emailFocusHandlur();
  };
  const onBlurEmailName = () => {
    setKeyboardVisible(false);
    emailBlurHandler();
  };
  const onMobileNumberFocus = () => {
    setKeyboardVisible(true);
  };
  const onMobileNumberBlur = () => {
    setKeyboardVisible(false);
    setButtonPressed(true);
  };
  function containsSpecialChars(str: string) {
    const specialChars = /^[0-9]+$/;
    return specialChars.test(str);
  }

  const isMobileNumberValid = () => {
    if (isValidMobileNumber || isMobileEmpty) {
      return false;
    } else if (phoneInput.current.isFocused) {
      if (mobileNumber.length < 10) {
        console.log("its coming here");
        return false;
      }
    } else {
      return true;
    }
  };

  console.log("mobileNumber====?", mobileNumber.length);
  console.log("isValidMobileNumber", isValidMobileNumber);

  const getSignature = async () => {
    const params = {
      payload: {
        credentialSubject: {
          id: UserDid,
        },
      },
    };
    const headersToSend = {
      "Content-Type": "application/json",
      privateKey: privateKey,
      "x-api-key": newssiApiKey,
    };

    await createUserSignaturekey(url, params, headersToSend)
      .then((res: any) => setSignature(res.Signature))
      .catch((e) => console.log(e));
  };

  async function createVerifiableCredentials() {
    const hasApiBeenCalled = await AsyncStorage.getItem("apiCalled");
    console.log("hasApiBeenCalled", hasApiBeenCalled);

    setLoading(true);

    if (!hasApiBeenCalled) {
      console.log("hasApiBeenCalled++++++vicky1", hasApiBeenCalled);
      setTimeout(() => {
        setLoading(true);
      }, 100);
      getSignature().then(() => {
        const params = {
          schemaName: "EarthIdVCSchema:1",
          isEncrypted: false,
          dependantVerifiableCredential: [],
          credentialSubject: {
            earthId: userDetails?.responseData?.earthId,
            userName: userDetails?.responseData?.username,
            userEmail: userDetails?.responseData?.email,
            userMobileNo: userDetails?.responseData?.phone,
          },
        };

        const headersToSend = {
          "Content-Type": "application/json",
          did: UserDid,
          "x-api-key": newssiApiKey,
          publicKey: userDetails?.responseData?.publicKey,
          signature: signature,
        };

        createVerifiableCred(requesturl, params, headersToSend)
          .then(async (res: any) => {
            console.log("res.data======>", res.data);
            if (res.data) {
              setLoading(false);
              setCreateVerify(res?.data);
              dispatch(SaveVerifyCred(res.data));
              AsyncStorage.setItem(
                "vcCred",
                JSON.stringify(res?.data?.verifiableCredential)
              );
              await AsyncStorage.setItem("apiCalled", "true");
              var date = dateTime();
              var documentDetails: IDocumentProps = {
                id: res?.data?.verifiableCredential?.id,
                name: isEarthId()
                  ? `VC - EarthId Token`
                  : "VC - GlobalId Token",
                path: "filePath",
                date: date?.date,
                time: date?.time,
                txId: "data?.result",
                docType: res?.data?.verifiableCredential?.type[1],
                docExt: ".jpg",
                processedDoc: "",
                isVc: true,
                vc: JSON.stringify({
                  name: isEarthId()
                    ? `VC - EarthId Token`
                    : "VC - GlobalId Token",
                  documentName: isEarthId()
                    ? `VC - EarthId Token`
                    : "VC - GlobalId Token",
                  path: "filePath",
                  date: date?.date,
                  time: date?.time,
                  txId: "data?.result",
                  docType: "pdf",
                  docExt: ".jpg",
                  processedDoc: "",
                  isVc: true,
                }),
                verifiableCredential: res?.data?.verifiableCredential,
                documentName: isEarthId()
                  ? `VC - EarthId Token`
                  : "VC - GlobalId Token",
                docName: isEarthId()
                  ? `VC - EarthId Token`
                  : "VC - GlobalId Token",
                base64: undefined,
              };

              var DocumentList = documentsDetailsList?.responseData
                ? documentsDetailsList?.responseData
                : [];
              DocumentList.push(documentDetails);
              console.log("DocumentList===>", DocumentList);
              dispatch(saveDocuments(DocumentList));
            }
          })
          .catch((e) => console.log("error=====>vicky", e));
      });
    } else {
      setLoading(false);
      console.log("API hit already", "praveen");
    }
  }

  useEffect(()=>{
    setValidMobileNumber(phoneInput.current?.isValidNumber(mobileNumber));
  },[countryCode])

  return (
    <KeyboardAvoidingScrollView
      style={{ flex: 1, backgroundColor: Screens.colors.background }}
    >
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
      <View
        style={{ backgroundColor: Screens.colors.background, marginBottom: 50 }}
      >
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

            <View style={{ flexDirection: "row" }}>
              <Info
                title={"First Name"}
                style={{
                  title: styles.title,
                  subtitle: styles.subtitle,
                  container: styles.textContainer,
                }}
              />

              <GenericText
                style={{
                  color: "red",
                  position: "absolute",
                  alignSelf: "center",
                  left: 75,
                }}
              >
                {"*"}
              </GenericText>
            </View>
            <TextInput
              style={{
                container: styles.textInputContainer,
              }}
              placeholder={"Enter First Name"}
              isError={isfirstNameError}
              errorText={isfirstNameErrorMessage}
              onFocus={onchangeFirstNameHandler}
              onBlur={onBlurFirstName}
              maxLength={60}
              isFocused={firstNameFocus}
              value={firstName}
              onChangeText={firstNameChangeHandler}
            />

<View style={{ flexDirection: "row" }}>
              <Info
                title={"Last Name"}
                style={{
                  title: styles.title,
                  subtitle: styles.subtitle,
                  container: styles.textContainer,
                }}
              />

              <GenericText
                style={{
                  color: "red",
                  position: "absolute",
                  alignSelf: "center",
                  left: 75,
                }}
              >
                {"*"}
              </GenericText>
            </View>
            <TextInput
              style={{
                container: styles.textInputContainer,
              }}
              placeholder={"Enter Last Name"}
              isError={islastNameError}
              errorText={islastNameErrorMessage}
              onFocus={onchangelastNameHandler}
              onBlur={onBlurlastName}
              maxLength={60}
              isFocused={lastNameFocus}
              value={lastName}
              onChangeText={lastNameChangeHandler}
            />
            <View style={{ flexDirection: "row" }}>
              <Info
                title={"mobileno"}
                style={{
                  title: styles.title,
                  subtitle: styles.subtitle,
                  container: styles.textContainer,
                }}
              />

              <GenericText
                style={{
                  color: "red",
                  position: "absolute",
                  alignSelf: "center",
                  left: 105,
                }}
              >
                {"*"}
              </GenericText>
            </View>

            <PhoneInput
              textInputProps={{
                onFocus: onMobileNumberFocus,
                onBlur: onMobileNumberBlur,
                allowFontScaling: false,
              }}
              onChangeCountry={(code) => {
                console.log("code======>", code);
                const { callingCode, cca2 } = code;
               
                setcountryCode(cca2);
                setcallingCode(callingCode[0]);
                console.log("code==>", callingCode[0]);
              }}
              autoFocus={false}
              placeholder="Mobile number"
              ref={phoneInput}
              defaultCode="US"
              layout="first"
             
              onChangeText={(text: any) => {
                setValidMobileNumber(phoneInput.current?.isValidNumber(text));
                setmobileNumber(text);
                setMobileEmpty(false);
                setButtonPressed(false);
              }}
              containerStyle={{
                borderColor: isValidMobileNumber
                  ?mobileNumber.length != 0?Screens.colors.primary: Screens.darkGray
                  : 
                  mobileNumber.length != 0?  Screens.red:Screens.darkGray
               ,
                borderWidth: isValidMobileNumber
                  ? mobileNumber.length != 0?2.2: 1
                  : mobileNumber.length != 0
                  ? 2.2
                  : 2,
                borderRadius: 10,
                height: 60,
                marginHorizontal: 10,
              }}
              flagButtonStyle={{
                backgroundColor: Screens.thickGray,
                borderBottomLeftRadius: 9,
                borderTopLeftRadius: 9,
              }}
              textInputStyle={{ fontSize: 16, padding: 0, margin: 0 }}
              codeTextStyle={{ fontSize: 16, padding: 0, margin: 0 }}
              textContainerStyle={{
                height: 55,
                padding: 0,
                margin: 0,
                borderBottomEndRadius: 9,
                borderTopRightRadius: 9,
                backgroundColor: "#fff",
              }}
              filterProps={{ placeholder: "Search country" }}
            />
            {!isValidMobileNumber && mobileNumber.length != 0 && (
                  <Text allowFontScaling={false} style={styles.errorText}>
                    {"Please enter Valid mobile number"}
                  </Text>
                )}
            <View style={{ flexDirection: "row" }}>
              <Info
                title={"email"}
                style={{
                  title: styles.title,
                  subtitle: styles.subtitle,
                  container: styles.textContainer,
                }}
              />

              <GenericText
                style={{
                  color: "red",
                  position: "absolute",
                  alignSelf: "center",
                  left: 48,
                }}
              >
                {"*"}
              </GenericText>
            </View>
            <TextInput
              style={{
                container: styles.textInputContainer,
              }}
              placeholder={"Enter your Email"}
              isError={isemailError}
              errorText={isemailErrorMessage}
              onFocus={onchangeEmailHandler}
              onBlur={onBlurEmailName}
              maxLength={60}
              isFocused={emailFocus}
              value={email}
              onChangeText={emailChangeHandler}
            />
          </View>
          <Footer />

          <Loader
            loadingText={
              isEarthId() ? "earthidgeneratesuccess" : "globalgeneratesuccess"
            }
            Status="status"
            isLoaderVisible={successResponse}
          ></Loader>

          <Spinner
            visible={userDetails?.isLoading || keys?.isLoading || loading || loginLoading}
            textContent={"Loading..."}
            textStyle={styles.spinnerTextStyle}
          />
        </View>
        <DatePicker
          modal
          open={openDatePicker}
          date={new Date()}
          onConfirm={(date) => {
            console.log("date");
            setopenDatePicker(false);
            dateOfBirthChangeHandler(date.toDateString());
          }}
          onCancel={() => {
            setopenDatePicker(false);
          }}
        />
      </View>
      <CustomPopup
      isVisible={isPopupVisible}
      title={popupContent.title}
      message={popupContent.message}
      buttons={popupContent.buttons}
      onClose={() => setPopupVisible(false)}
    />
    </KeyboardAvoidingScrollView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flexGrow: 1,
    backgroundColor: Screens.colors.background,
  },
  title: {
    color: Screens.black,
    fontWeight: "400",
    fontSize: 13,
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
  spinnerTextStyle: {
    color: "#fff",
  },
  linearStyle: {
    height: 400,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
  },
  categoryHeaderText: {
    marginVertical: 10,

    color: Screens.headingtextColor,
  },

  flatPanel: {
    marginHorizontal: 25,
    height: 80,
    borderRadius: 15,
    backgroundColor: Screens.colors.background,
    elevation: 15,
    marginTop: -40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
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
    backgroundColor: Screens.pureWhite,
    padding: 5,
    marginTop: -260,
    marginHorizontal: 15,
    elevation: 5,
    borderRadius: 25,
    justifyContent: "space-between",
    shadowColor: "#171717",
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 8,
    flexDirection: "row",
    backgroundColor: Screens.lightGray,
  },
  avatarImageContainer: {
    width: 25,
    height: 30,
    marginTop: 5,
  },
  avatarTextContainer: {
    fontSize: 13,
    fontWeight: "500",
  },
  cardContainer: {
    flex: 1,
    paddingVertical: 9,
    title: {
      color: Screens.grayShadeColor,
    },
  },
  textInputContainer: {
    borderRadius: 10,
    borderColor: Screens.colors.primary,
    borderWidth: 2,
    marginLeft: 10,
    marginTop: -2,
    height: 60,
  },
  errorText: {
    color: Screens.red,
    marginBottom: 10,
    marginHorizontal: 20,
  },
});

export default Register;
