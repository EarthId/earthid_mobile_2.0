import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RNCamera } from "react-native-camera";
import Button from "../../components/Button";

import axios from "axios";
import SuccessPopUp from "../../components/Loader";
import ModalView from "../../components/Modal";
import { LocalImages } from "../../constants/imageUrlConstants";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { useFetch } from "../../hooks/use-fetch";
import { Dropdown } from "react-native-element-dropdown";
import CheckBox from "@react-native-community/checkbox";

import { Screens } from "../../themes/index";
import {
  serviceProviderApi,
  QrcodeApis,
  newssiApiKey,
} from "../../utils/earthid_account";
import QrScannerMaskedWidget from "../Camera/QrScannerMaskedWidget";
import {
  saveDocuments,
} from "../../redux/actions/authenticationAction";
import { IDocumentProps } from "../uploadDocuments/VerifiDocumentScreen";
import GenericText from "../../components/Text";
import Loader from "../../components/Loader";
import { isEarthId } from "../../utils/PlatFormUtils";
import { dateTime } from "../../utils/encryption";
import { postApi } from "../../utils/createUserSignaturekey";
import ZkbScreen from "./DisclosureScreen";
import SelctiveDisclosure from "./ZkbScreen";
import { addConsent } from "../../utils/consentApis";
import LinearGradients from "../../components/GradientsPanel/LinearGradient";
import CustomPopup from "../../components/Loader/customPopup";
import { Platform } from 'react-native';

import { getDidDetails } from '../../utils/newSSIAPIs';
import {  signPkceSecp256k1_raw } from '../../utils/signature';

const data = [
  { label: " 1", value: "1" },
  { label: " 2", value: "2" },
  { label: " 3", value: "3" },
  { label: " 4", value: "4" },
  { label: " 5", value: "5" },
  { label: " 6", value: "6" },
  { label: " 7", value: "7" },
  { label: " 8", value: "8" },
];

const deviceWidth = Dimensions.get("window").width;
const CameraScreen = (props: any) => {
  const {
    loading: serviceProviderLoading,
    data: serviceProviderResponse,
    fetch: serviceProviderFetch,
  } = useFetch();
  const {
    loading: shareCredientialLoading,
    data: shareCredientialData,
    fetch: shareCredientialFetch,
  } = useFetch();

  const {
    loading: schemaLoding,
    data: schemaList,
    fetch: getScheme,
  } = useFetch();

  const {
    loading: sendDatatoServiceProviderLoading,
    fetch: sendDatatoServiceProvider,
    data: sendDatatoServiceProviderData,
  } = useFetch();

  const dispatch = useAppDispatch();
  const userDetails = useAppSelector((state) => state.account);
  const keys = useAppSelector((state) => state.user);
  const [successResponse, setsuccessResponse] = useState(false);
  const [isCameraVisible, setIsCamerVisible] = useState(true);
  const [isLoading,setisLoading] = useState(false)
  const [isDocumentModal, setisDocumentModal] = useState(false);
  const documentsDetailsList = useAppSelector((state) => state.Documents);
  const [selectedCheckBox, setselectedCheckBox] = useState(
    documentsDetailsList.responseData
  );
  const [issuerSchemaJSON, setissuerSchemaJSON] = useState();
  const [issuerSchemaName, setissuerSchemaName] = useState([{}]);
  const [issuerSchemaDropDown, setissuerSchemaDropDown] = useState(false);
  const [selectedSchema, setselectedSchema] = useState();
  const [verifyVcCred, setverifyVcCred] = useState<any>();
  const [loadingforGentSchemaAPI, setloadingforGentSchemaAPI] = useState(false);
  const [value, setValue] = useState(null);
  const [isDocumentModalkyc, setisDocumentModalkyc] = useState(false);
  const [
    isDocumentModalGenerateCredientials,
    setisDocumentModalGenerateCredientials,
  ] = useState(false);
  const [checkbox1, setcheckbox1] = useState(true);
  const [checkbox2, setcheckbox2] = useState(true);
  const [issuerLogin, setissuerLogin] = useState(false);
  const [barCodeDataDetails, setbarCodeData] = useState<any>();
  const [ZkpSignature, setZkpSignature] = useState(null);
  const [successMessage, setsuccessMessage] = useState(
    "verification successfully"
  );

  const [createSignatureKey, setCreateSignatureKey] = useState();

  const [isChecked, setIsChecked] = useState<boolean>(false);

  console.log("This is for consent:-------------------------------------------------", isChecked)

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

  //const [sharedData, setSharedData] = useState<{ selectedFields: any, documentVc: any } | null>(null);
  // const [selectedFields, setSelectedFields] = useState(null);
  // const [documentVc, setDocumentVc] = useState(null);

  // useEffect(() => {
  //   if (sharedData) {
  //     console.log('Shared data received...:', sharedData);
  //     if (sharedData && sharedData.selectedFields && sharedData.documentVc) {
  //       getData(); // Call getData when sharedData is available
  //     }
  //   }
  // }, [sharedData]);

  const issurDid = keys?.responseData?.issuerDid;
  const UserDid = keys?.responseData?.newUserDid;
  const privateKey = keys?.responseData?.generateKeyPair?.privateKey;
  const publicKey = keys?.responseData?.generateKeyPair?.publicKey;

  console.log("issuerDid", keys?.responseData);
  console.log("issuerDid", keys?.responseData?.issuerDid);
  console.log("UserDid", keys?.responseData?.newUserDid);
  console.log("privatekey", keys?.responseData?.generateKeyPair?.privateKey);
  console.log("publicKey", keys?.responseData?.generateKeyPair?.publicKey);
  console.log("createSignatureKey", createSignatureKey);
  var barcodeScanned = true;
  let url: any = `https://ssi-test.myearth.id/api/user/sign?issuerDID=${issurDid}`;
  let key = privateKey;
  var base64Pic = documentsDetailsList?.responseData
    ? documentsDetailsList?.responseData[0]?.base64
    : null;
  //console.log("baseee", base64Pic);

  console.log("url===>", url);

  // const verifyData = verifyCredDatas?.credVerifydata?.verifiableCredential

  useEffect(() => {
    setIsCamerVisible(true);
    getVcdata();
  }, []);

 

  const getSDDData = async () => {
    const selectedFields: any = await AsyncStorage.getItem("selectedFields");
    const documentVc: any = await AsyncStorage.getItem("selectedVc");
    console.log('these are sdd items:', selectedFields)
    const selectedFieldsjson: any = JSON.parse(selectedFields)
    const selectedVcjson: any = JSON.parse(documentVc)
    console.log('these are sdd items paresed data:', selectedFieldsjson)
   const data = {
      sessionKey: barCodeDataDetails?.sessionKey,
      encrypted_object: {
        earthId: userDetails?.responseData?.earthId,
        pressed: false,
        userName: userDetails?.responseData?.username,
        userEmail: userDetails?.responseData?.email,
        userMobileNo: userDetails?.responseData?.phone,
        OrganizationID: userDetails?.responseData?.orgId,
        selectedFields: selectedFieldsjson,
  documentVc: selectedVcjson, 
  publicKey: keys?.responseData?.result?.publicKey,
        // countryCode: userDetails?.responseData?.countryCode,
        // emailVerified: userDetails?.responseData?.emailVerified,
        // mobileVerified: userDetails?.responseData?.mobileVerified,
        //documents: documentsDetailsList?.responseData,
        requestType: barCodeDataDetails?.requestType,
        reqNo: barCodeDataDetails?.reqNo,
        //signature: createSignatureKey,
        //base64: getArrayOfBase64(),
        //docName:getArrayOfDocName(),
        //type:getTypesOfDoc(),
        //kycToken: "6hrFDATxrG9w14QY9wwnmVhLE0Wg6LIvwOwUaxz761m1JfRp4rs8Mzozk5xhSkw0_MQz6bpcJnrFUDwp5lPPFC157dHxbkKlDiQ9XY3ZIP8zAGCsS8ruN2uKjIaIargX",
      },
    };

  console.log('earthid req==>',JSON.stringify(data))
    sendDatatoServiceProvider(QrcodeApis, data, "POST");

    
    await AsyncStorage.removeItem("selectedFields");
    await AsyncStorage.removeItem("selectedVc");
    // Check if the request was successful
    if (!response.ok) {
      setisLoading(false)
      throw new Error('Network response was not ok');
    }
    
   
    
  

   // return {selectedFields, documentVc}
  };

  const addConsentCall = async () => {
    try{
      console.log('These are userDetails===============================', userDetails)
   const apiData = {
    
      "earthId": userDetails.responseData.earthId,
      "flowName": "Login",
      "description": "Authorization for login",
      "relyingParty": "EarthID",
      "timeDuration": 1,
      "isConsentActive": true,
      "purpose": "Login info share"
  
   }
const consentApiCall = await addConsent(apiData)
console.log('Consent Api response------:', consentApiCall)
    }catch (error) {
      throw new Error(`Error adding consent: ${error}`);
    }
  } 

  const addConsentCallDoc = async () => {
    try{
      console.log('These are userDetails===============================', userDetails)
   const apiData = {
    
      "earthId": userDetails.responseData.earthId,
      "flowName": "Document Share",
      "description": "To share document",
      "relyingParty": "EarthID",
      "timeDuration": 1,
      "isConsentActive": true,
      "purpose": "Sharing document and its information"
  
   }
const consentApiCall = await addConsent(apiData)
console.log('Consent Api response------:', consentApiCall)
    }catch (error) {
      throw new Error(`Error adding consent: ${error}`);
    }
  } 

  const getVcdata = async () => {
    const getvcCred: any = await AsyncStorage.getItem("vcCred");
    const parseData = JSON.parse(getvcCred);
    console.log("parseData", parseData);
    setverifyVcCred(parseData);
  };


  const generateAgeVC = async (success: { request: string; value: string; } | undefined) => {
    //const amount =  documentsDetailsList?.responseData?.filter((item: { amount: any; })=>item?.amount)[0]?.amount
    const dateOfBirth : any = await AsyncStorage.getItem("userDOB");
    const ageProofvc = await AsyncStorage.getItem("ageProofVC");
    const ageProof = JSON.parse(ageProofvc)
    console.log('Userdetails for dob:.............', dateOfBirth)
    console.log('AgeProofVC for dob:.............', ageProof)
    // console.log('datapayload===>12345',JSON.stringify({
    //   "Content-Type": "application/json",
    //   "publicKey": publicKey,
    //   "did":UserDid,
    //   "X-API-KEY": '01a41742-aa8e-4dd6-8c71-d577ac7d463c',
    // }))
    try {
      // Replace 'YOUR_API_ENDPOINT' with the actual API endpoint
      // const response = await fetch("https://ssi-test.myearth.id/api/issuer/verifiableCredential", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "publicKey": publicKey,
      //     "did":UserDid,
      //     "X-API-KEY": '01a41742-aa8e-4dd6-8c71-d577ac7d463c',
      //   },
      //   body:JSON.stringify({"schemaName": "UserAgeSchema:1",
      //   "isEncrypted": true,
      //   "dependantVerifiableCredential": [
      //   ],
      //   "credentialSubject": {
      //     "earthId":userDetails?.responseData?.earthId,
      //     "dateOfBirth": dateOfBirth
      //   }
      // }),
      // });
   
      // console.log("Response Status:", response);
      // // Check if the request was successful
      // if (!response.ok) {
       
      //   throw new Error("Network response was not ok");
      // }

      // Get the response text directly
     // const resulst = await response.json();
const ageProofJSON = ageProof
     // console.log('response?.data?.verifiableCredential',resulst?.data?.verifiableCredential)
      let payload 
   
     if(success?.request === 'minAge'){

      payload ={dateOfBirth: {
        type: "date",
        value:parseInt(success?.value),
        unit: "years"
      },
      verifyParams: [
        `dateOfBirth=${(dateOfBirth)}`
      ],
      //credentials:resulst?.data?.verifiableCredential
      credentials: ageProofJSON.verifiableCredential
    }
     } else if (success?.request === 'ageRange') {
      payload = {
        dateOfBirth: {
          type: "date",
            minimum: parseInt(success?.minValue),
            maximum: parseInt(success?.maxValue),
          unit: "years"
        },
        verifyParams: [
          `dateOfBirth=${(dateOfBirth)}`
        ],
        credentials: ageProofJSON.verifiableCredential
      };
    }
    
     else{
       payload ={
        dateOfBirth: success,
        verifyParams: [
          "dateOfBirth=1998-01-09"
        ],
        credentials:  {
          "@context": [
              "https://www.w3.org/2018/credentials/v1"
          ],
          id: "UserBalanceSchema:1:1b4efb3c-f39d-4890-b9c6-c1c2f42517c5",
          type: [
              "VerifiableCredential",
              "UserBalanceSchema:1",
              "Encrypted"
          ],
          version: "UserBalanceSchema:1",
          credentialSchema: {
              id: "http://ssi-test.myearth.id/schema/UserBalanceSchema",
              type: "JsonSchemaValidator2018"
          },
          issuer: "did:earthid:testnet:H8xsGiJMKq9D3KewDwCMnTo8Xs7PexCivnZyC9EgUkdV;earthid:testnet:fid=0.0.2239011",
          credentialSubject: [
              {
                  id: "MzMsMTU1LDg1LDU5LDEzMywzNSwxNzMsNTgsMTA1LDg0LDQ4LDIxNSwxOTAsNDMsMjMsMjA1LDIwMSwxOCwxMzcsMTgxLDEwNCwxNjUsMTgxLDg4LDM4LDIyNywxNTEsMjEwLDE1OSw5NywzNCw2Nw==",
                  earthId: "MjA4LDIwNCw5MSwxNzAsNzMsMTQ5LDI0OCwyMjIsNzQsMjAxLDE4MSw5MiwxNCw4LDg5LDI0LDEyOCw0MCwxNjcsMjMsMTU0LDE2NCwxMiwyMDUsMTc0LDcyLDIyOSwzOSwxMTEsNDUsMTExLDIyNQ==",
                  balance: "MTM3LDI1LDU1LDIwMyw1MSw4MCwyMiwyMzMsMTk5LDcsNzYsNTUsMTI5LDIyMCwxNzcsNTQsNzgsMTIsMTAyLDcsNTEsMTY4LDEzNiwxNTUsMTkwLDE3NCwxMzEsMjMwLDE3MCwxMTcsMTU1LDIzMA=="
              }
          ],
          issuanceDate: "2023-11-24T07:00:18.993Z",
          expirationDate: "2024-11-24T07:00:17.504Z",
          proof: {
              type: "Ed25519Signature2018",
              creator: "did:earthid:testnet:H8xsGiJMKq9D3KewDwCMnTo8Xs7PexCivnZyC9EgUkdV;earthid:testnet:fid=0.0.2239011",
              created: "2023-11-24T07:00:18.993Z",
              proofPurpose: "assertionMethod",
              vcVerificationMethod: "did:earthid:testnet:H8xsGiJMKq9D3KewDwCMnTo8Xs7PexCivnZyC9EgUkdV;earthid:testnet:fid=0.0.2239011#did-root-key",
              jws: "eyJjcml0IjpbImI2NCJdLCJiNjQiOmZhbHNlLCJhbGciOiJFZERTQSJ9..MDQ4YzQzZmYzYmJjMzYxZDI5NTkwNWE2YWMwMWMwNmFkZTdmZmMzMWNiYWI0MjFjNWVhYmY1ZjUzODkxZTIwZDg1YTdlMjA0MWEzNjdkYjhmNjlkYTM1ZWY1ZmM4YmM5OWYzYjQwODFhNWY1N2RlOWUxZWQ0YzRlZjUxMzlhMGM="
          },
          biometrics: {
              face: null,
              iris: null,
              finger: null
          },
          credentialStatus: ""
      }
      }
    }
      try {
        console.log('payload=====>',JSON.stringify(payload))
        
        // Replace 'YOUR_API_ENDPOINT' with the actual API endpoint
        const response = await fetch('https://ssi-test.myearth.id/api/issuer/createZkp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY':'01a41742-aa8e-4dd6-8c71-d577ac7d463c'
            // You may need to include additional headers here, such as authentication headers
          },
          body: JSON.stringify(payload),
        });
    
        const result = await response.json();
        console.log('zkpResult-------->',result)
        if(result){
          if(success?.request === 'balance'){
            documentsDetailsList?.responseData?.filter((item: { amount: any; })=>item?.amount)[0]?.amount
            
            if(result?.data){
              if(result?.data?.certificate?.balance){
                setTimeout(()=>{    
                  setisLoading(false)            
                 // Alert.alert('Proof of Funds is verified successfully')
                  showPopup(
                    "Success",
                    "Proof of Funds is verified successfully",
                    [{ text: "OK", onPress: () => setPopupVisible(false) }]
                  );
                },5000)
              }
              else{
                setTimeout(()=>{    
                  setisLoading(false)            
                //  Alert.alert('Proof of Funds verification failed')
                  showPopup(
                    "Verification Failed",
                    "Proof of Funds verification failed",
                    [{ text: "OK", onPress: () => setPopupVisible(false) }]
                  );
                },5000)
               
              }
            }
          }
          if(success?.request === 'minAge'){
            if(result?.data){
              if(result?.data?.certificate?.dateOfBirth){
                setTimeout(()=>{    
                  setisLoading(false)            
                 // Alert.alert('Proof of age is verified successfully')
                  showPopup(
                    "Success",
                    "Proof of age is verified successfully",
                    [{ text: "OK", onPress: () => setPopupVisible(false) }]
                  );
                },5000)
              }
              else{
                setTimeout(()=>{    
                  setisLoading(false)            
                //  Alert.alert('Proof of age verification failed')
                  showPopup(
                    "Verification Failed",
                    "Proof of age verification failed",
                    [{ text: "OK", onPress: () => setPopupVisible(false) }]
                  );
                },5000)
               
              }
            }
          }
          if(success?.request === 'ageRange'){
            if(result?.data){
              if(result?.data?.certificate?.dateOfBirth){
                setTimeout(()=>{    
                  setisLoading(false)            
                 // Alert.alert('Proof of age is verified successfully')
                  showPopup(
                    "Success",
                    "Proof of age is verified successfully",
                    [{ text: "OK", onPress: () => setPopupVisible(false) }]
                  );
                },5000)
              }
              else{
                setTimeout(()=>{    
                  setisLoading(false)            
                //  Alert.alert('Proof of age verification failed')
                  showPopup(
                    "Verification Failed",
                    "Proof of age verification failed",
                    [{ text: "OK", onPress: () => setPopupVisible(false) }]
                  );
                },5000)
               
              }
            }
          }
        }
        setZkpSignature(result)
      
       const  data = {
          sessionKey: barCodeDataDetails?.sessionKey,
          encrypted_object:{
            earthId: userDetails?.responseData?.earthId,
            pressed: false,
            userName: userDetails?.responseData?.username,
            userEmail: userDetails?.responseData?.email,
            userMobileNo: userDetails?.responseData?.phone,
            OrganizationID: userDetails?.responseData?.orgId,
            zkpVc: ageProof,
            zkpResult: result?.data
          },
            zkbType:success?.request
        };

      console.log('earthid req==>',JSON.stringify(data))
        sendDatatoServiceProvider(QrcodeApis, data, "POST");
        // Check if the request was successful
        if (!response.ok) {
          setisLoading(false)
          throw new Error('Network response was not ok');
        }
        console.log('setZkpSignature',result)
       
        
        // Set the data in the state
        //setData(result);
      } catch (error) {
        setisLoading(false)
        console.error('Error fetching data:', error);
      }
      console.log("result:::::", result);
      

      // Set the data in the state
      // Depending on your use case, you may handle the result here
    } catch (error) {
  
      console.error("Error fetching data:1234", error);
    }


   
      
  };


  const generateBalanceVC = async (success: { request: string; minimum: string; } | undefined) => {
    const amount =  documentsDetailsList?.responseData?.filter((item: { amount: any; })=>item?.amount)[0]?.amount
    console.log('datapayload===>12345',JSON.stringify({
      "Content-Type": "application/json",
      "publicKey": publicKey,
      "did":UserDid,
      "X-API-KEY": '01a41742-aa8e-4dd6-8c71-d577ac7d463c',
    }))
    try {
      // Replace 'YOUR_API_ENDPOINT' with the actual API endpoint
      const response = await fetch("https://ssi-test.myearth.id/api/issuer/verifiableCredential", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "publicKey": publicKey,
          "did":UserDid,
          "X-API-KEY": '01a41742-aa8e-4dd6-8c71-d577ac7d463c',
        },
        body:JSON.stringify({"schemaName": "UserBalanceSchema:1",
        "isEncrypted": true,
        "dependantVerifiableCredential": [
        ],
        "credentialSubject": {
          "earthId":userDetails?.responseData?.earthId,
          "balance": `${Math.round(amount)}`
        }
      }),
      });
   
      console.log("Response Status:", response.status);
      // Check if the request was successful
      if (!response.ok) {
       
        throw new Error("Network response was not ok");
      }

      // Get the response text directly
      const resulst = await response.json();

      console.log('response?.data?.verifiableCredential',resulst?.data?.verifiableCredential)
      let payload 
   
     if(success?.request === 'balance'){

      payload ={balance: {
        type: "number",
        minimum:parseInt(success?.minimum)
      },
      verifyParams: [
        `balance=${Math.round(amount)}`
      ],
      credentials:resulst?.data?.verifiableCredential
    }
     }else{
       payload ={
        dateOfBirth: success,
        verifyParams: [
          "dateOfBirth=1998-01-09"
        ],
        credentials:  {
          "@context": [
              "https://www.w3.org/2018/credentials/v1"
          ],
          id: "UserBalanceSchema:1:1b4efb3c-f39d-4890-b9c6-c1c2f42517c5",
          type: [
              "VerifiableCredential",
              "UserBalanceSchema:1",
              "Encrypted"
          ],
          version: "UserBalanceSchema:1",
          credentialSchema: {
              id: "http://ssi-test.myearth.id/schema/UserBalanceSchema",
              type: "JsonSchemaValidator2018"
          },
          issuer: "did:earthid:testnet:H8xsGiJMKq9D3KewDwCMnTo8Xs7PexCivnZyC9EgUkdV;earthid:testnet:fid=0.0.2239011",
          credentialSubject: [
              {
                  id: "MzMsMTU1LDg1LDU5LDEzMywzNSwxNzMsNTgsMTA1LDg0LDQ4LDIxNSwxOTAsNDMsMjMsMjA1LDIwMSwxOCwxMzcsMTgxLDEwNCwxNjUsMTgxLDg4LDM4LDIyNywxNTEsMjEwLDE1OSw5NywzNCw2Nw==",
                  earthId: "MjA4LDIwNCw5MSwxNzAsNzMsMTQ5LDI0OCwyMjIsNzQsMjAxLDE4MSw5MiwxNCw4LDg5LDI0LDEyOCw0MCwxNjcsMjMsMTU0LDE2NCwxMiwyMDUsMTc0LDcyLDIyOSwzOSwxMTEsNDUsMTExLDIyNQ==",
                  balance: "MTM3LDI1LDU1LDIwMyw1MSw4MCwyMiwyMzMsMTk5LDcsNzYsNTUsMTI5LDIyMCwxNzcsNTQsNzgsMTIsMTAyLDcsNTEsMTY4LDEzNiwxNTUsMTkwLDE3NCwxMzEsMjMwLDE3MCwxMTcsMTU1LDIzMA=="
              }
          ],
          issuanceDate: "2023-11-24T07:00:18.993Z",
          expirationDate: "2024-11-24T07:00:17.504Z",
          proof: {
              type: "Ed25519Signature2018",
              creator: "did:earthid:testnet:H8xsGiJMKq9D3KewDwCMnTo8Xs7PexCivnZyC9EgUkdV;earthid:testnet:fid=0.0.2239011",
              created: "2023-11-24T07:00:18.993Z",
              proofPurpose: "assertionMethod",
              vcVerificationMethod: "did:earthid:testnet:H8xsGiJMKq9D3KewDwCMnTo8Xs7PexCivnZyC9EgUkdV;earthid:testnet:fid=0.0.2239011#did-root-key",
              jws: "eyJjcml0IjpbImI2NCJdLCJiNjQiOmZhbHNlLCJhbGciOiJFZERTQSJ9..MDQ4YzQzZmYzYmJjMzYxZDI5NTkwNWE2YWMwMWMwNmFkZTdmZmMzMWNiYWI0MjFjNWVhYmY1ZjUzODkxZTIwZDg1YTdlMjA0MWEzNjdkYjhmNjlkYTM1ZWY1ZmM4YmM5OWYzYjQwODFhNWY1N2RlOWUxZWQ0YzRlZjUxMzlhMGM="
          },
          biometrics: {
              face: null,
              iris: null,
              finger: null
          },
          credentialStatus: ""
      }
      }
    }
      try {
        console.log('payload=====>',JSON.stringify(payload))
        
        // Replace 'YOUR_API_ENDPOINT' with the actual API endpoint
        const response = await fetch('https://ssi-test.myearth.id/api/issuer/createZkp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY':'01a41742-aa8e-4dd6-8c71-d577ac7d463c'
            // You may need to include additional headers here, such as authentication headers
          },
          body: JSON.stringify(payload),
        });
    
        const result = await response.json();
        console.log('setZkpSignature1')
        console.log('setZkpSignature',result)
        console.log('request is',success?.request)
        if(result){
          if(success?.request === 'balance'){
            console.log('Balance1-----------')
            documentsDetailsList?.responseData?.filter((item: { amount: any; })=>item?.amount)[0]?.amount
            
            if(result?.data){
              if(result?.data?.certificate?.balance){
                setTimeout(()=>{    
                  setisLoading(false)            
                 // Alert.alert('Proof of Funds is verified successfully')
                  showPopup(
                    "Success",
                    "Proof of Funds is verified successfully",
                    [{ text: "OK", onPress: () => setPopupVisible(false) }]
                  );
                },5000)
              }
              else{
                setTimeout(()=>{    
                  setisLoading(false)            
                 // Alert.alert('Proof of Funds verification failed')
                  showPopup(
                    "Verification Failed",
                    "Proof of Funds verification failed",
                    [{ text: "OK", onPress: () => setPopupVisible(false) }]
                  );
                },5000)
               
              }
            }
          }
          if(success?.request === 'minAge'){
            if(result?.data){
              if(result?.data?.certificate?.dateOfBirth){
                setTimeout(()=>{    
                  setisLoading(false)            
                 // Alert.alert('Proof of age is verified successfully')
                  showPopup(
                    "Success",
                    "Proof of age is verified successfully",
                    [{ text: "OK", onPress: () => setPopupVisible(false) }]
                  );
                },5000)
              }
              else{
                setTimeout(()=>{    
                  setisLoading(false)            
                 // Alert.alert('Proof of age verification failed')
                 showPopup(
                  "Verification Failed",
                  "Proof of age verification failed",
                  [{ text: "OK", onPress: () => setPopupVisible(false) }]
                );
                },5000)
               
              }
            }
          }
        }
        setZkpSignature(result)
      
       const  data = {
          sessionKey: barCodeDataDetails?.sessionKey,
          encrypted_object:{
            earthId: userDetails?.responseData?.earthId,
            pressed: false,
            userName: userDetails?.responseData?.username,
            userEmail: userDetails?.responseData?.email,
            userMobileNo: userDetails?.responseData?.phone,
            OrganizationID: userDetails?.responseData?.orgId,...result?.data},
            zkbType:success?.request
        };

      console.log('earthid req==>',JSON.stringify(data))
        sendDatatoServiceProvider(QrcodeApis, data, "POST");
        // Check if the request was successful
        if (!response.ok) {
          setisLoading(false)
          throw new Error('Network response was not ok');
        }
        console.log('setZkpSignature',result)
       
        
        // Set the data in the state
        //setData(result);
      } catch (error) {
        setisLoading(false)
        console.error('Error fetching data:', error);
      }
      //console.log("result:::::", result);
      

      // Set the data in the state
      // Depending on your use case, you may handle the result here
    } catch (error) {
  
      console.error("Error fetching data:1234", error);
    }


   
      
  };

// make the function accept the inner requestType object AND the sessionKey directly
// async function handlePkceLogin(parsedRequestType: any, barCodeDataDetails: any, didDetails: any) {
//   const { sessionId, codeChallenge } = parsedRequestType; // requestType is already parsed into an object
//   if (!didDetails?.privateKey || !didDetails?.did) {
//     throw new Error('Missing DID/privateKey');
//   }

//   // Sign with the SAME keys you showed in the log
//   const { signatureBase64, publicKeyHex } =
//     await signChallengeSecp256k1(codeChallenge, didDetails.privateKey);

//   // Send to your relay/backend so the portal can complete login
//   const relayPayload = {
//     sessionKey: barCodeDataDetails?.sessionKey,
//     encrypted_object: {
//       did: didDetails.did,
//       sessionId,
//       codeChallenge,                 // echo back what you signed
//       signature: signatureBase64,    // base64 64-byte sig (r||s)
//       alg: 'secp256k1-sha256',       // or whatever your server expects
//       publicKey: publicKeyHex,       // compressed hex by default
//     },
//   };

//   await sendDatatoServiceProvider(QrcodeApis, relayPayload, 'POST');
// }



  const generateUserSignature = async () => {
    const data = {
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

    axios
      .post(url, data, { headers: headersToSend })
      .then(async (response) => {
        // Handle the API response
        console.log("Response==>", response.data);
        let data = await response.data.Signature;
        setCreateSignatureKey(data);
      })
      .catch((error) => {
        // Handle any errors
        console.error("Error:", error);
      });
  };
  function isValidJSON(jsonString: string) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  }
  const getDropDownList = () => {
    let filteredDocuments = [];
  
    if (barCodeDataDetails?.requestType?.request === "idvProof") {
      // For IDV, only include documents where documentName is "Proof of IDV"
      filteredDocuments = documentsDetailsList?.responseData?.filter(
        (item) => item?.documentName === "Proof of IDV"
      );
    } else if (barCodeDataDetails?.requestType === "shareCredentials") {
      // For shareCredentials, include only verifiable credentials
      filteredDocuments = documentsDetailsList?.responseData?.filter(
        (item) => item.isVc
      );
    } else {
      // For other cases, return all documents
      filteredDocuments = documentsDetailsList?.responseData || [];
    }
  
    return filteredDocuments;
  };
  

  const _handleBarCodeRead = async(barCodeData: any) => {
    console.log("barcodedatappppp", barCodeData?.data);  
    setisLoading(true)
      if (barCodeData?.data === undefined) {
        setisLoading(false)
        setIsCamerVisible(false);
        showPopup(
          "Invalid QR Code",
          "This is not the type of QR we are expecting",
          [{ text: "Go Back", onPress: () => getBack() }]
        );
      //   Alert.alert(
      //     //This is title
      //    "Invalid QR Code",
      //      //This is body text
      //    "This is not the type of QR we expecting",
      //    [
      //      {text: 'Go Back', onPress: () => getBack() },
          
      //    ],
      //    //on clicking out side, Alert will not dismiss
      //  );
      }
      // else if(!barCodeData.data.requestType){
      //   console.log('Started vc for student')
      //   createVcForIccaStudent(barCodeData.data)
      // }
       else {
        try {
       
           const stringWithDoubleBackslashes = barCodeData?.data?.replace(/'/g, '\\"');

          let parsedRequestType = JSON.parse(stringWithDoubleBackslashes)  
           let isValid =isValidJSON(parsedRequestType.requestType)   
           if(isValid){
            parsedRequestType.requestType = JSON.parse(parsedRequestType.requestType);
           }
       
          console.log('stringWithDoubleBackslashesggvicky1234567',parsedRequestType?.requestType)
          let serviceData =parsedRequestType
        
      
          if (!serviceProviderLoading) {
            setbarCodeData(serviceData);
        //   const parsedRequestType = JSON.parse(serviceData.requestType);
            if (serviceData.requestType === "login") {
              serviceProviderApiCall(serviceData);
            }
            if (serviceData.requestType === "generateCredentials") {
              serviceProviderApiCall(serviceData);
            }
            if (serviceData.requestType === "document") {
              serviceProviderApiCall(serviceData);

            }if (parsedRequestType?.requestType?.request === "idvProof") {
              console.log('idvbarcode scan------------------------', parsedRequestType.requestType)
              serviceProviderApiCallForapi(parsedRequestType);
            }
            if (serviceData.requestType === "selectiveData") {
              serviceProviderApiCall(serviceData);
            }
            if (parsedRequestType?.requestType?.request === "balance") {
              console.log('balance scan------------------------', parsedRequestType.requestType)
              serviceProviderApiCallForapi(parsedRequestType);
            }
            if (parsedRequestType?.requestType?.request === "minAge") {
              serviceProviderApiCallForapi(parsedRequestType);
            }
            if (parsedRequestType?.requestType?.request === "ageRange") {
              serviceProviderApiCallForapi(parsedRequestType);
            }
            if (parsedRequestType?.requestType?.request === 'login') {
  serviceProviderApiCallForapi(parsedRequestType);
 // const didDetails = await getDidDetails();        // returns the SAME keys you logged
//  await handlePkceLogin(parsedRequestType.requestType, barCodeDataDetails, didDetails);

}
           
            if(!serviceData.requestType){
              setisLoading(false)
              setIsCamerVisible(false);
              showPopup(
                "Invalid QR Code",
                "This is not the type of QR we are expecting",
                [{ text: "Go Back", onPress: () => getBack() }]
              );
            //   Alert.alert(
            //     //This is title
            //    "Invalid QR Code",
            //      //This is body text
            //    "This is not the type of QR we expecting",
            //    [
            //      {text: 'Go Back', onPress: () => getBack() },
                
            //    ],
            //    //on clicking out side, Alert will not dismiss
            //  );
            }
          }
          else{
            setIsCamerVisible(false);
            setisLoading(false)
            showPopup(
              "Invalid QR Code",
              "This is not the type of QR we are expecting",
              [{ text: "Go Back", onPress: () => getBack() }]
            );
          //   Alert.alert(
          //     //This is title
          //    "Invalid QR Code",
          //      //This is body text
          //    "This is not the type of QR we expecting",
          //    [
          //      {text: 'Go Back', onPress: () => getBack() },
              
          //    ],
          //    //on clicking out side, Alert will not dismiss
          //  );
          }
          setIsCamerVisible(false);
        } catch (error) {
          console.log('errorvicky',error)
          setisLoading(false)
          setIsCamerVisible(false);
          showPopup(
            "Invalid QR Code",
            "This is not the type of QR we are expecting",
            [{ text: "Go Back", onPress: () => getBack() }]
          );
        //   Alert.alert(
        //     //This is title
        //    "Invalid QR Code",
        //      //This is body text
        //    "This is not the type of QR we expecting",
        //    [
        //      {text: 'Go Back', onPress: () => getBack() },
            
        //    ],
        //    //on clicking out side, Alert will not dismiss
        //  );
       }
        }
      
    }


    const createVcForIccaStudent=(url: any)=>{
      //setloading(true)
      fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log('This is certificate response', data)
        console.log("thiss","this is log")
        var dataNew = data.response[0].vc
        console.log('This is certificate vc', dataNew)
          var date = dateTime();
          var documentDetails: IDocumentProps = {
            id: `ID_VERIFICATION${Math.random()}${"selectedDocument"}${Math.random()}`,
          name: data.response[0].company,
          path: "filePath",
          documentName: data.response[0].company,
          categoryType: "ID",
          date: date?.date,
          time: date?.time,
          txId: "data?.result",
          docType: dataNew.type,
          docExt: ".jpg",
          processedDoc: "",
          isVc: true,
          vc: JSON.stringify({
            dataNew
          }),
          verifiableCredential: dataNew,
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
            setTimeout(() => {
             // setloading(false)
              setIsCamerVisible(true);
              setloadingforGentSchemaAPI(false);
              setissuerSchemaDropDown(false);
              //Alert.alert(data?.verifiableCredential[0]?.message);
              props.navigation.navigate("Documents");
            }, 3000);

          });
        }
        

  
    const getBack =()=>{
   
      props.navigation.goBack(null)
    }


  useEffect(() => {
    const selectedCheckBoxs = documentsDetailsList?.responseData?.map(
      (item: { selectedForCheckBox: boolean }, _index: any) => {
        item.selectedForCheckBox = true;
        return item;
      }
    );
    setselectedCheckBox(selectedCheckBoxs);
  }, [isDocumentModalkyc]);
  //service provider API responses handled
  useEffect(() => {
    if (
      serviceProviderResponse &&
      serviceProviderResponse?.values &&
      serviceProviderResponse?.values?.length > 0
    ) {
      setisDocumentModalkyc(false);
      setisLoading(false)
      if (barCodeDataDetails?.requestType === "login") {
        setTimeout(() => {
          setissuerLogin(true);
        }, 100);
      } else if (barCodeDataDetails?.requestType === "shareCredentials") {
        setisDocumentModalkyc(true);
      } else if (barCodeDataDetails?.requestType === "document") {
        setisDocumentModalkyc(true);
      }else if (barCodeDataDetails?.requestType?.request === "idvProof") {
        setisDocumentModalkyc(true);
      } else if (barCodeDataDetails?.requestType === "selectiveData") {
        setisDocumentModalkyc(true);
      } else if (barCodeDataDetails?.requestType === "generateCredentials") {
        setisDocumentModalkyc(true);
      }
      else if (barCodeDataDetails?.requestType?.request === "minAge") {
        setisDocumentModalkyc(true);
      }
      else if (barCodeDataDetails?.requestType?.request === "ageRange") {
        setisDocumentModalkyc(true);
      }
      else if (barCodeDataDetails?.requestType?.request === "balance") {
        setisDocumentModalkyc(true);
      }
      else if (barCodeDataDetails?.requestType?.request === "login") {
         setTimeout(() => {
          setissuerLogin(true);
        }, 100);
      }

    }
  }, [serviceProviderResponse]);

  useEffect(() => {
    console.log(
      "sendDatatoServiceProviderData==>",
      sendDatatoServiceProviderData
    );
    if (sendDatatoServiceProviderData) {
      //passwordless login flow
      console.log(
        "barCodeDataDetails?.requestType?.request==>",
        barCodeDataDetails?.requestType?.request
      );
      if (barCodeDataDetails?.requestType === "login") {
        setisDocumentModalkyc(false);
        setisLoading(false)
        setIsCamerVisible(true);
        generateUserSignature();
       // Alert.alert("Login is successful");
       showPopup(
        "Success",
        "Login is successful",
        [{ text: "OK", onPress: () => setPopupVisible(false) }]
      );
      }
      if (barCodeDataDetails?.requestType?.request === "login") {
        setisDocumentModalkyc(false);
        setisLoading(false)
        setIsCamerVisible(true);
        
       // Alert.alert("Login is successful");
       showPopup(
        "Success",
        "Login is successful",
        [{ text: "OK", onPress: () => setPopupVisible(false) }]
      );
      }
      if (barCodeDataDetails?.requestType === "generateCredentials") {
        setisDocumentModalkyc(false);
        setisLoading(false)
        setIsCamerVisible(true);
      }
      if (barCodeDataDetails?.requestType === "selectiveData") {
        setisDocumentModalkyc(false);
        setisLoading(false)
        setIsCamerVisible(true);
       // Alert.alert("Selected information has been shared successfully");
        showPopup(
          "Success",
          "Selected information has been shared successfully",
          [{ text: "OK", onPress: () => setPopupVisible(false) }]
        );
      }
      if (barCodeDataDetails?.requestType === "shareCredentials") {
        setisDocumentModalkyc(false);
        setisLoading(false)
        setIsCamerVisible(true);
        //Alert.alert("credential has been shared successfully");
        showPopup(
          "Success",
          "Credential has been shared successfully",
          [{ text: "OK", onPress: () => setPopupVisible(false) }]
        );
      }
      if (barCodeDataDetails?.requestType?.request === "balance") {
        setisDocumentModalkyc(false);
        setIsCamerVisible(true);
        setisLoading(false)
       // Alert.alert("Proof of Funds has been shared successfully");
        showPopup(
          "Success",
          "Proof of Funds has been shared successfully",
          [{ text: "OK", onPress: () => setPopupVisible(false) }]
        );
      }
      if (barCodeDataDetails?.requestType?.request === "minAge") {
        setisDocumentModalkyc(false);
        setIsCamerVisible(true);
        setisLoading(false)
       // Alert.alert("Proof of age has been shared successfully");
        showPopup(
          "Success",
          "Proof of age has been shared successfully",
          [{ text: "OK", onPress: () => setPopupVisible(false) }]
        );
      }
      if (barCodeDataDetails?.requestType?.request === "ageRange") {
        setisDocumentModalkyc(false);
        setIsCamerVisible(true);
        setisLoading(false)
       // Alert.alert("Proof of age has been shared successfully");
        showPopup(
          "Success",
          "Proof of age has been shared successfully",
          [{ text: "OK", onPress: () => setPopupVisible(false) }]
        );
      }
      if (barCodeDataDetails?.requestType === "document") {
        setIsCamerVisible(true);
      }
      if (barCodeDataDetails?.requestType?.request === "idvProof") {
        setIsCamerVisible(true);
      }
    }
  }, [sendDatatoServiceProviderData]);

  useEffect(() => {
    return () => {
      setIsCamerVisible(true);
      setisDocumentModalkyc(false);
    };
  }, []);
  const getZKPSignature =(success: any)=>{
    generateBalanceVC(success)

  }
  useEffect(() => {
    console.log("sharecredientials", shareCredientialData);
    if (shareCredientialData?.status === "success") {
      setisDocumentModalkyc(false);
      props.navigation.goBack(null);
    }
  }, [shareCredientialData]);

  const getSchemeDetails = () => {
    setisDocumentModalkyc(false);
    getData();
  };

  const getArrayOfBase64 =()=>{
    let datas: any[] =[]
      documentsDetailsList?.responseData.map((item: { base64: string; isVc: any; selectedForCheckBox: any; isVerifyNeeded: any; },_index: any)=>{
      // console.log('itemselected for docShare------------------',item)
        if(item?.base64 && !item.isVc && item.selectedForCheckBox){
          if(item?.isVerifyNeeded){
            if(item.base64.startsWith('data:')){
              console.log('baase64 of selected docuemnt for sharing----------',item.base64)
              const baseImage =item?.base64?.split('data:image/png;base64,')[1]
              console.log('this is base image-------', baseImage)
              datas.push(baseImage)
            }else{
              datas.push(item.base64)
            }
            
          }
          else{
            datas.push(item.base64)
          }
         
        }
      })
   return datas
  };

  const getTypesOfDoc =()=>{
    let datas: any[] =[]
    documentsDetailsList?.responseData.map((item: { selectedForCheckBox: any; base64: any; isVc: any; docType: any; },_index: any)=>{
     // console.log('itemselected',item.selectedForCheckBox)
      if(item?.base64 && !item.isVc && item.selectedForCheckBox){
        datas.push(item.docType)
      }
    })
 return datas
  }

  const getIdvVc =()=>{
    let datas: any[] =[]
    documentsDetailsList?.responseData.map((item: { selectedForCheckBox: any; base64: any; isVc: any; verifiableCredential: any; },_index: any)=>{
     // console.log('itemselected',item.selectedForCheckBox)
      if(item.isVc && item.verifiableCredential.version=="IDVProofSchema:1" && item.selectedForCheckBox){
        datas.push(item.verifiableCredential)
      }
    })
 return datas
  }

  // const getIdvVc = () => {
  //   // Filter the selected items and ensure only VC items are included
  //   const selectedVCs = selectedCheckBox
  //     ?.filter(item => item.isVc && item.selectedForCheckBox)
  //     ?.map(item => item.verifiableCredential);
  
  //   return selectedVCs || [];
  // };

  const getArrayOfDocName =()=>{
    let datas: any[] =[]
      documentsDetailsList?.responseData.map((item: { docName: any; isVc: any; selectedForCheckBox: any; },_index: any)=>{
        if(item?.docName && !item.isVc && item.selectedForCheckBox){
          datas.push(item.docName)
        }
      })
   return datas
  };
  
  

  useEffect(() => {}, []);


  async function auditFlowApi(){

    const min = 1;
    const max = 666666;
    const minid = 1;
    const maxid = 6666667777;
    const randomNumtopic = Math.floor(Math.random() * (max - min + 1)) + min;
    const randomNumtransID = Math.floor(Math.random() * (maxid - minid + 1)) + minid;
    const currentTimestamp = new Date().toISOString();
    const urlRequest:any = "https://w3storage.myearth.id/api/subs/publish"

    const postData = {
      topic: '0.0.'+randomNumtopic,
      message: JSON.stringify({
        transactionID: randomNumtransID,
        flowName: 'DocumentVcFlow',
        topicId: '0.0.'+randomNumtopic,
        timestamp:currentTimestamp
      })
    };

    const headersToSend = {
      'Content-Type': 'application/json',
    };

   await postApi(urlRequest,postData,headersToSend)
    .then((res:any)=>{
      console.log("resData",res)
    })
    .catch((e:any)=>{
      console.log("error",e);
    })
  }




  const createVerifiableCredentials = async () => {
    setisLoading(true)
     auditFlowApi()
    generateUserSignature();
 getData()
    await addConsentCallDoc();
    setloadingforGentSchemaAPI(true);

    if (barCodeDataDetails?.requestType === "document") {
      var date = dateTime();

      var documentDetails: IDocumentProps = {
        id: `ID_VERIFICATION${Math.random()}${"selectedDocument"}${Math.random()}`,
        name: "Acknowledgement Token",
        path: "filePath",
        documentName: "Acknowledgement Token",
        date: date?.date,
        time: date?.time,
        categoryType: 'ID',
        txId: "data?.result",
        docType: verifyVcCred?.type[1],
        docExt: ".jpg",
        processedDoc: "",
        isVc: true,
        vc: JSON.stringify({
          name: "Acknowledgement Token",
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
        verifiableCredential: verifyVcCred,
        docName: "",
        base64: undefined,
      };

      var DocumentList = documentsDetailsList?.responseData
        ? documentsDetailsList?.responseData
        : [];
        if(documentsDetailsList?.responseData?.length === 0){
          DocumentList.push(documentDetails);
        }
        if(documentsDetailsList?.responseData?.length>0){
          documentsDetailsList?.responseData?.map((item: { isVc: any; selectedForCheckBox: any; },_index: any)=>{
            if(!item?.isVc && item?.selectedForCheckBox){
              DocumentList.push(documentDetails);
            }
          })
        }
   
      dispatch(saveDocuments(DocumentList)).then(()=>{
        setTimeout(() => {
          setisDocumentModalkyc(false);
          setisLoading(false)
          setIsCamerVisible(true);
          setloadingforGentSchemaAPI(false);
          setissuerSchemaDropDown(false);
          //    Alert.alert("KYC token Saved successfully");
         // Alert.alert("Document uploaded successfully");
          showPopup(
            "Success",
            "Document uploaded successfully",
            [{ text: "OK", onPress: () => setPopupVisible(false) }]
          );
          props.navigation.navigate("Documents");
        }, 15000);
      })

    
    
    } 
    else {
    

      setIsCamerVisible(true);
      setTimeout(() => {
        setisLoading(false)
        setloadingforGentSchemaAPI(false);
        setissuerSchemaDropDown(false);
       // Alert.alert("Proof verified successfully");
        props.navigation.navigate("Documents");
      }, 5000);
    }
  };

  const serviceProviderApiCall = (serviceData: any) => {
    const { apikey, reqNo, requestType } = serviceData;
    console.log(
      "getUrl===>>>::::",
      `${serviceProviderApi}?apikey=${apikey}&reqNo=${reqNo}&requestType=${requestType}`
    );
    serviceProviderFetch(
      `${serviceProviderApi}?apikey=${apikey}&reqNo=${reqNo}&requestType=${requestType}`,
      {},
      "GET"
    );
  };

  const serviceProviderApiCallForapi = (serviceData: any) => {
    const { apikey, reqNo, requestType } = serviceData;
    console.log(
      "getUrl===>>>::::",
      `${serviceProviderApi}?apikey=${apikey}&reqNo=${reqNo}&requestType=${JSON.stringify(requestType)}`
    );
    serviceProviderFetch(
      `${serviceProviderApi}?apikey=${apikey}&reqNo=${reqNo}&requestType=${JSON.stringify(requestType)}`,
      {},
      "GET"
    );
  };
  const shareCredientials = () => {
    getSchemeDetails();
  };

  const navigateToCamerScreen = () => {
    setisDocumentModalkyc(false);
    setIsCamerVisible(true);
    props.navigation.navigate("uploadDocumentsScreen");
  };

  const checkDisable = () => {
    //console.log('selectedCheckBox',selectedCheckBox)
    let trap = false;
    if (
      documentsDetailsList?.responseData?.length === 0 ||
      documentsDetailsList?.responseData === undefined
    ) {
      trap = true;
    }
    if (
      selectedCheckBox?.some((item: { selectedForCheckBox: any; }) => item?.selectedForCheckBox)
    ) {
      trap = false;
    }
    return trap;
  };

  const getData = async () => {
    console.log("userDetails", userDetails);
    if (barCodeDataDetails) {
      let data;
      if (barCodeDataDetails?.requestType === "login") {
        console.log("type===>", "login");
        data = {
          sessionKey: barCodeDataDetails?.sessionKey,
          encrypted_object: {
            earthId: userDetails?.responseData?.earthId,
            pressed: false,
            userName: userDetails?.responseData?.username,
            userEmail: userDetails?.responseData?.email,
            userMobileNo: userDetails?.responseData?.phone,
            publicKey: publicKey,
            userDid: keys?.responseData?.newUserDid,
          },
        };
      }else if (barCodeDataDetails?.requestType?.request === "login") {
        console.log("type===>", "login", barCodeDataDetails);
const sessionKey = barCodeDataDetails?.sessionKey;
  const { sessionId, codeChallenge } = barCodeDataDetails?.requestType || {};

  const didDetails = await getDidDetails();
  console.log('these are the did details:', didDetails);

  if (!didDetails?.did || !didDetails?.privateKey) {
    throw new Error('Missing DID or privateKey');
  }

  const did = didDetails.did;
  const privHex = didDetails.privateKey;
  const pubUncompressedHex = didDetails.publicKey;

  const signature = await signPkceSecp256k1_raw(codeChallenge, privHex);

  data = {
    sessionKey,
    encrypted_object: {
      earthId: userDetails?.responseData?.earthId,
      did,
      sessionId,
      challenge: codeChallenge,
      signature,                    // base64url(r||s)
      algorithm: 'secp256k1',
      publicKey: pubUncompressedHex,// uncompressed hex (starts with 04)
      publicKeyEncoding: 'hex-uncompressed',
      signatureEncoding: 'base64url-compact'
    },
  };

//await sendDatatoServiceProvider(QrcodeApis, data, 'POST');


      }
       else if (barCodeDataDetails?.requestType === "generateCredentials") {
        console.log("type===>", "generateCredentials");
        data = {
          sessionKey: barCodeDataDetails?.sessionKey,
          encrypted_object: {
            earthId: userDetails?.responseData?.earthId,
            pressed: false,
            publicKey: keys?.responseData?.result?.publicKey,
            userDid: keys?.responseData?.newUserDid,
            signature: createSignatureKey,
            base64: getArrayOfBase64(),
            docName:getArrayOfDocName(),
            type:getTypesOfDoc()
          },
        };
      } else if (barCodeDataDetails?.requestType === "document") {
        console.log("type===>", "document");
        data = {
          sessionKey: barCodeDataDetails?.sessionKey,
          encrypted_object: {
            earthId: userDetails?.responseData?.earthId,
            pressed: false,
            userName: userDetails?.responseData?.username,
            userEmail: userDetails?.responseData?.email,
            userMobileNo: userDetails?.responseData?.phone,
            OrganizationID: userDetails?.responseData?.orgId,
            requestType: barCodeDataDetails?.requestType,
            reqNo: barCodeDataDetails?.reqNo,
            kycToken:
              "6hrFDATxrG9w14QY9wwnmVhLE0Wg6LIvwOwUaxz761m1JfRp4rs8Mzozk5xhSkw0_MQz6bpcJnrFUDwp5lPPFC157dHxbkKlDiQ9XY3ZIP8zAGCsS8ruN2uKjIaIargX",
            publicKey: keys?.responseData?.result?.publicKey,
            userDid: keys?.responseData?.newUserDid,
            docName:getArrayOfDocName(),
            signature: createSignatureKey,
            base64: getArrayOfBase64(),
            type:getTypesOfDoc()
            
          },
        };
        console.log('vicky+++data123',data)
      }else if (barCodeDataDetails?.requestType?.request === "idvProof") {
        console.log("type===>", "idv");
        
        data = {
          sessionKey: barCodeDataDetails?.sessionKey,
          encrypted_object: {
            earthId: userDetails?.responseData?.earthId,
            pressed: false,
            userName: userDetails?.responseData?.username,
            userEmail: userDetails?.responseData?.email,
            userMobileNo: userDetails?.responseData?.phone,
            OrganizationID: userDetails?.responseData?.orgId,
            requestType: barCodeDataDetails?.requestType,
            reqNo: barCodeDataDetails?.reqNo,
            kycToken:
              "6hrFDATxrG9w14QY9wwnmVhLE0Wg6LIvwOwUaxz761m1JfRp4rs8Mzozk5xhSkw0_MQz6bpcJnrFUDwp5lPPFC157dHxbkKlDiQ9XY3ZIP8zAGCsS8ruN2uKjIaIargX",
            publicKey: keys?.responseData?.result?.publicKey,
            userDid: keys?.responseData?.newUserDid,
            idvVc: getIdvVc()
          },
        };
        console.log('vicky+++data123',data)
      } else if (barCodeDataDetails.requestType === "shareCredentials") {
        console.log("type===>", "shareCredentials");
        data = {
          sessionKey: barCodeDataDetails?.sessionKey,
          encrypted_object: {
            earthId: userDetails?.responseData?.earthId,
            pressed: false,
            userName: userDetails?.responseData?.username,
            userEmail: userDetails?.responseData?.email,
            userMobileNo: userDetails?.responseData?.phone,
            OrganizationID: userDetails?.responseData?.orgId,
             //countryCode: userDetails?.responseData?.countryCode,
            // emailVerified: userDetails?.responseData?.emailVerified,
            // mobileVerified: userDetails?.responseData?.mobileVerified,
            documents: documentsDetailsList?.responseData,
            requestType: barCodeDataDetails?.requestType,
            reqNo: barCodeDataDetails?.reqNo,
            signature: createSignatureKey,
            base64: getArrayOfBase64(),
            docName:getArrayOfDocName(),
            type:getTypesOfDoc(),
            kycToken: "6hrFDATxrG9w14QY9wwnmVhLE0Wg6LIvwOwUaxz761m1JfRp4rs8Mzozk5xhSkw0_MQz6bpcJnrFUDwp5lPPFC157dHxbkKlDiQ9XY3ZIP8zAGCsS8ruN2uKjIaIargX",
          },
        };
      }
      else if (barCodeDataDetails.requestType === "selectiveData") {

        getSDDData()
        return
      //   console.log("type===>", "shareCredentials");

      //  if(documentVc && selectedFields){
      //   data = {
      //     sessionKey: barCodeDataDetails?.sessionKey,
      //     encrypted_object: {
      //       earthId: userDetails?.responseData?.earthId,
      //       pressed: false,
      //       userName: userDetails?.responseData?.username,
      //       userEmail: userDetails?.responseData?.email,
      //       userMobileNo: userDetails?.responseData?.phone,
      //       OrganizationID: userDetails?.responseData?.orgId,
      //       selectedFields: selectedFields,
      // documentVc: documentVc, 
      
      //       // countryCode: userDetails?.responseData?.countryCode,
      //       // emailVerified: userDetails?.responseData?.emailVerified,
      //       // mobileVerified: userDetails?.responseData?.mobileVerified,
      //       //documents: documentsDetailsList?.responseData,
      //       requestType: barCodeDataDetails?.requestType,
      //       reqNo: barCodeDataDetails?.reqNo,
      //       //signature: createSignatureKey,
      //       //base64: getArrayOfBase64(),
      //       //docName:getArrayOfDocName(),
      //       //type:getTypesOfDoc(),
      //       //kycToken: "6hrFDATxrG9w14QY9wwnmVhLE0Wg6LIvwOwUaxz761m1JfRp4rs8Mzozk5xhSkw0_MQz6bpcJnrFUDwp5lPPFC157dHxbkKlDiQ9XY3ZIP8zAGCsS8ruN2uKjIaIargX",
      //     },
      //   };
      //  }else{
      //   console.log('Null data recieved............................')
      //  }
            

      }
      else if (barCodeDataDetails?.requestType.request === "minAge") {
        generateAgeVC(barCodeDataDetails?.requestType)
        return
      }
      else if (barCodeDataDetails?.requestType.request === "ageRange") {
        generateAgeVC(barCodeDataDetails?.requestType)
        return
      }
      else if (barCodeDataDetails?.requestType.request === "balance") {
        getZKPSignature(barCodeDataDetails?.requestType)
        return
     
      }
      sendDatatoServiceProvider(QrcodeApis, data, "POST");
    }
  };

  const onDataShare = (selectedFields: any, documentVc: any) => {
    if(selectedFields && documentVc){
      console.log("Selected Fields:", selectedFields);
      console.log("Document VC:", documentVc);
    //  setSelectedFields(selectedFields);
    //  setDocumentVc(documentVc)
    }else{
      throw(console.error())
    }
  };

  // Determine the required document based on the request type
const requiredDocument = barCodeDataDetails?.requestType?.request === 'minAge' 
? 'Proof of Age' 
: barCodeDataDetails?.requestType?.request === 'balance' 
  ? 'Proof of Funds' 
  : null;

// Initialize the variable for checking if the required document is not present
let requiredDocumentNotPresent;

// Check if the required document is not present in the wallet
if (requiredDocument && documentsDetailsList?.responseData?.length > 0) {
requiredDocumentNotPresent = documentsDetailsList?.responseData?.every(
  item => !(item.isVc && item?.documentName === requiredDocument)
);
}



  return (
    <View style={styles.sectionContainer}>
      <View style={{ position: "absolute", top: 20, left: 20, zIndex: 100 }}>
        <TouchableOpacity
          onPress={() =>
            props.navigation.navigate("DrawerStacks", {
              screen: "ShowQrScreen",
            })
          }
        >
          <Image
            resizeMode="contain"
            style={[styles.logoContainer]}
            source={LocalImages.scanbarcodeImg}
          ></Image>
        </TouchableOpacity>
      </View>
      <View
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 100,
        }}
      >
        <TouchableOpacity onPress={() => props.navigation.goBack()}>
          <Image
            resizeMode="contain"
            style={[
              styles.logoContainer,
              { tintColor: Screens.pureWhite, width: 15, height: 15 },
            ]}
            source={LocalImages.closeImage}
          ></Image>
        </TouchableOpacity>
      </View>
   
      {isCameraVisible &&!isLoading && (
        <RNCamera

          style={styles.preview}
          androidCameraPermissionOptions={null}
          type={RNCamera.Constants.Type.back}
          captureAudio={false}
          onBarCodeRead={(data) =>_handleBarCodeRead(data)}
        >
          <QrScannerMaskedWidget />
        </RNCamera>
      )}
 
      <SuccessPopUp
        isLoaderVisible={successResponse}
        loadingText={successMessage}
      />
      <ModalView
        width={deviceWidth / 1.2}
        height={480}
        left={30}
        isModalVisible={issuerLogin}
        style={{ marginRight: 20 }}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
            { isLoading &&
       <View style={styles.loading}>
       <ActivityIndicator color={'red'} size='large' />
     </View>
}
<LinearGradients
          endColor={Screens.colors.header.endColor}
          // middleColor={Screens.colors.header.middleColor}
          startColor={Screens.colors.header.startColor}
          style={{borderTopLeftRadius: 18,
            borderTopRightRadius: 18,}}
          horizontalGradient={false}
        >
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              // backgroundColor: isEarthId()
              //   ? Screens.colors.ScanButton.startColor
              //   : "#fff",
                borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
            }}
          >
            <Image
              resizeMode="contain"
              style={[styles.imageLogo]}
              source={LocalImages.logoImage}
            ></Image>
          </View>
        </LinearGradients>
          
          <GenericText
            style={{
              textAlign: "center",
              padding: 5,
              color: "#000",
              fontSize: 14,
              fontWeight: "900",
              marginTop: 20,
            }}
          >
            {"plsauthorizeit"}
          </GenericText>


          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop:10, marginLeft:22  }}>
        <CheckBox
          value={isChecked}

          onValueChange={(newValue) => setIsChecked(newValue)}
        />
        <GenericText style={{marginLeft: 10,marginRight: 60, fontSize: 11}}>
        {isEarthId() ? "earthidconsent" : "globalidconsent"}
</GenericText>
      </View>

          <Button
            onPress={() => {
              setissuerLogin(false);
              getData();
              addConsentCall()
            }}
            disabled={!isChecked}
            style={{
              buttonContainer: {
                elevation: 5,
                marginHorizontal: 10,
                opacity: isChecked ? 1 : 0.5,
               borderWidth: 2,
   // borderColor: 'transparent',
   backgroundColor: Screens.colors.primary
              },
              text: {
                color: Screens.pureWhite,
                fontSize: 12,
              },
              iconStyle: {
                tintColor: Screens.pureWhite,
              },
            }}
            title={"authorize"}
          ></Button>
          <View style={{ marginTop: -50 }}>
            <Button
              onPress={() => {
                setIsCamerVisible(true);
                setissuerLogin(false);
              }}
              style={{
                buttonContainer: {
                  elevation: 5,
                  marginHorizontal: 10,
                  backgroundColor: "#fff",
                  //borderWidth: 0,
    //borderColor: 'transparent',
                },
                text: {
                  color: Screens.colors.primary,
                  fontSize: 12,
                },
                iconStyle: {
                  tintColor: Screens.pureWhite,
                },
              }}
              title={"cancel"}
            ></Button>
          </View>
        </View>
      </ModalView>
      {isDocumentModalkyc && 
    (barCodeDataDetails?.requestType.request === "balance" || barCodeDataDetails?.requestType.request === "minAge" || barCodeDataDetails?.requestType.request === "ageRange") && 
    documentsDetailsList?.responseData?.length > 0 &&
    !requiredDocumentNotPresent ? 
     <ZkbScreen 
      isLoading={isLoading}
      setisDocumentModalkyc={setisDocumentModalkyc}
       navigateToCamerScreen={navigateToCamerScreen} 
       setIsCamerVisible={setIsCamerVisible}
       selectedCheckBox={selectedCheckBox}
       setselectedCheckBox={setselectedCheckBox}
       setValue={setValue}
       checkDisable={checkDisable}
       createVerifiableCredentials={createVerifiableCredentials}
       barCodeDataDetails={barCodeDataDetails} navigation={props.navigation}/>
      
       :

       barCodeDataDetails?.requestType === "selectiveData" && documentsDetailsList?.responseData?.length > 0 ?
       <SelctiveDisclosure      
       isLoading={isLoading}
       setisDocumentModalkyc={setisDocumentModalkyc}
        navigateToCamerScreen={navigateToCamerScreen} 
        setIsCamerVisible={setIsCamerVisible}
        selectedCheckBox={selectedCheckBox}
        setselectedCheckBox={setselectedCheckBox}
        setValue={setValue}
        checkDisable={checkDisable}
        
        barCodeDataDetails={barCodeDataDetails} 
        onDataShare={onDataShare}
        createVerifiableCredentials={createVerifiableCredentials}
        navigation={props.navigation}
        >
        
        </SelctiveDisclosure>:

barCodeDataDetails?.requestType === "document" ?
       <ModalView
        left={deviceWidth / 12}
        width={deviceWidth / 1.2}
        isModalVisible={isDocumentModalkyc}
        height={520}
      >
          {isLoading ? <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>        
          <ActivityIndicator color={'red'} size='large' />
          </View>:
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          
          {
  documentsDetailsList?.responseData?.length === 0 ||
  documentsDetailsList?.responseData === undefined ? (
    <TouchableOpacity onPress={() => navigateToCamerScreen()}>
      <View style={{ paddingHorizontal: 5, marginTop: 10 }}>
        <GenericText
          style={{
            textAlign: "center",
            color: "#000",
            fontSize: 14,
            fontWeight: "900",
            marginTop: 20,
          }}
        >
          {"+ Add Documents"}
        </GenericText>
      </View>
    </TouchableOpacity>
  ) : (
    <View style={{ paddingHorizontal: 5, marginTop: 10 }}>
      <GenericText
        style={{
          textAlign: "center",
          color: "#000", // Different color for the alternate text
          fontSize: 14,
          fontWeight: "900",
          padding: 5,
          marginTop: 10,
        }}
      >
        {isEarthId() ? "earthidwanttoaccess" : "globalidwanttoaccess"}
      </GenericText>
    </View>
  )
}

          {/* <GenericText
            style={{
              textAlign: "center",
              padding: 5,
              color: "#000",
              fontSize: 14,
              fontWeight: "900",
              marginTop: 10,
            }}
          >
            {isEarthId() ? "earthidwanttoaccess" : "globalidwanttoaccess"}
          </GenericText> */}
          <View style={{ height: 300 }}>
            <ScrollView
              style={{ flexGrow: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View>
                {getDropDownList() &&
                  getDropDownList().length > 0 &&
                  getDropDownList()?.map(
                    (
                      item: {
                        docName:
                          | boolean
                          | React.ReactChild
                          | React.ReactFragment
                          | React.ReactPortal
                          | null
                          | undefined;
                        id: any;
                        name:
                          | boolean
                          | React.ReactChild
                          | React.ReactFragment
                          | React.ReactPortal
                          | null
                          | undefined;
                      },
                      index: any
                    ) => {
                      //console.log("item", item);
                      return (
                        <View
                          style={{ flexDirection: "row", marginVertical: 10, marginLeft: 15 }}
                        >
                          <CheckBox
                            disabled={false}
                            onValueChange={(_value) => {
                              const selectedCheckBoxs = selectedCheckBox?.map(
                                (
                                  itemLocal: {
                                    id: any;
                                    selectedForCheckBox: boolean;
                                  },
                                  _index: any
                                ) => {
                                  if (itemLocal?.id === item?.id) {
                                    itemLocal.selectedForCheckBox =
                                      !itemLocal.selectedForCheckBox;
                                  }

                                  return itemLocal;
                                }
                              );
                              setselectedCheckBox([...selectedCheckBoxs]);
                            }}
                            value={
                              selectedCheckBox && selectedCheckBox.length > 0
                                ? selectedCheckBox[index]?.selectedForCheckBox
                                : false
                            }
                          />
                          <View
                            style={{
                              justifyContent: "center",
                              alignItems: "center",
                              width:230,
                              flexWrap:'wrap'
                            }}
                          >
                            <GenericText
                              style={{
                                textAlign: "center",
                                padding: 5,
                                color: "#000",
                                fontSize: 14,
                                fontWeight: "300",

                              }}
                            >
                              {item?.isVc?item.documentName: item?.docName }
                            </GenericText>
                          </View>
                        </View>
                      );
                    }
                  )}
              </View>
            </ScrollView>

            <GenericText
              style={{
                textAlign: "center",
                padding: 5,
                color: "#000",
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              {"Selected Duration"}
            </GenericText>
            <Dropdown
              style={[styles.dropdown]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={data}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={"Expiry Time (default 1 day)"}
              searchPlaceholder="Search..."
              value={"value"}
              onChange={(item) => {
                setValue(item.value);
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop:10, marginLeft: 20, marginRight: 15  }}>
        <CheckBox
          value={isChecked}

          onValueChange={(newValue) => setIsChecked(newValue)}
        />
        <GenericText style={{marginLeft: 5,marginRight: 15, fontSize: 11, paddingRight: 20}}>
        {isEarthId() ? "earthidconsent" : "globalidconsent"}
</GenericText>
      </View>
         
        <View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    marginHorizontal: 30,
  }}
>
  {/* Cancel Button */}
  <Button
    onPress={() => {
      setisDocumentModalkyc(false);
      setIsCamerVisible(true);
    }}
    style={{
      buttonContainer: {
        elevation: 5,
        marginHorizontal: 10,
        backgroundColor: "#fff",  // White background for Cancel button
        borderWidth: 1,  // Border for the Cancel button
        borderColor: '#D3D3D3',  // Light gray border color
        borderRadius: Platform.OS === 'ios' ? 30 : 30,  // Consistent borderRadius
        paddingVertical: 13,
        paddingHorizontal: 15,
        paddingRight: 25,
        alignItems: 'center',  // Horizontally center the content
        justifyContent: 'center',  // Vertically center the conten
      },
      text: {
        color: '#525252',  // Text color for Cancel button
        fontSize: 13,
        fontWeight: "700",  // Bold text
        textAlign: 'center', 
      },
      iconStyle: {
        tintColor: '#525252',
      },
    }}
    title={"Cancel"}
  />

  {/* Authorize Button */}
  <Button
    onPress={createVerifiableCredentials}
    disabled={checkDisable() || !isChecked}
    style={{
      buttonContainer: {
        elevation: 5,
        marginHorizontal: 10,
        backgroundColor: Screens.colors.primary,  // Primary color for Authorize button
        opacity: checkDisable() || !isChecked ? 0.5 : 1,  // Disabled state opacity
        borderRadius: Platform.OS === 'ios' ? 30 : 30,  // Consistent borderRadius
        paddingVertical: 13,
        paddingHorizontal: 15,
        paddingRight: 25,
        alignItems: 'center',  // Horizontally center the content
        justifyContent: 'center',  // Vertically center the conten
      },
      text: {
        color: Screens.pureWhite,  // White text for Authorize button
        fontSize: 13,
        fontWeight: "700",  // Bold text
        textAlign: 'center', 
      },
      iconStyle: {
        tintColor: Screens.pureWhite,
      },
    }}
    title={"Authorize"}
  />
</View>
          
        </View>}
      </ModalView>:
barCodeDataDetails?.requestType.request === "idvProof" ?
<ModalView
 left={deviceWidth / 12}
 width={deviceWidth / 1.2}
 isModalVisible={isDocumentModalkyc}
 height={520}
>
   {isLoading ? <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>        
   <ActivityIndicator color={'red'} size='large' />
   </View>:
 <View style={{ flex: 1, paddingHorizontal: 5 }}>
   
   {
documentsDetailsList?.responseData?.length === 0 ||
documentsDetailsList?.responseData === undefined ? (
<TouchableOpacity onPress={() => navigateToCamerScreen()}>
<View style={{ paddingHorizontal: 5, marginTop: 10 }}>
 <GenericText
   style={{
     textAlign: "center",
     color: "#000",
     fontSize: 14,
     fontWeight: "900",
     marginTop: 20,
   }}
 >
   {"+ Add Documents"}
 </GenericText>
</View>
</TouchableOpacity>
) : (
<View style={{ paddingHorizontal: 5, marginTop: 10 }}>
<GenericText
 style={{
   textAlign: "center",
   color: "#000", // Different color for the alternate text
   fontSize: 14,
   fontWeight: "900",
   padding: 5,
   marginTop: 10,
 }}
>

 {/* {isEarthId() ? "earthidwanttoaccess" : "globalidwanttoaccess"} */}
 {barCodeDataDetails?.requestType?.company
    ? `${barCodeDataDetails?.requestType?.company} wants to access your following information`
    : "An entity wants to access your information"}
</GenericText>
</View>
)
}

   {/* <GenericText
     style={{
       textAlign: "center",
       padding: 5,
       color: "#000",
       fontSize: 14,
       fontWeight: "900",
       marginTop: 10,
     }}
   >
     {isEarthId() ? "earthidwanttoaccess" : "globalidwanttoaccess"}
   </GenericText> */}
   <View style={{ height: 300 }}>
     <ScrollView
       style={{ flexGrow: 1 }}
       contentContainerStyle={{ flexGrow: 1 }}
     >
       <View>
         {getDropDownList() &&
           getDropDownList().length > 0 &&
           getDropDownList()?.map(
             (
               item: {
                 docName:
                   | boolean
                   | React.ReactChild
                   | React.ReactFragment
                   | React.ReactPortal
                   | null
                   | undefined;
                 id: any;
                 name:
                   | boolean
                   | React.ReactChild
                   | React.ReactFragment
                   | React.ReactPortal
                   | null
                   | undefined;
               },
               index: any
             ) => {
               //console.log("item", item);
               return (
                 <View
                   style={{ flexDirection: "row", marginVertical: 10, marginLeft: 15 }}
                 >
                   <CheckBox
                     disabled={false}
                     onValueChange={(_value) => {
                       const selectedCheckBoxs = selectedCheckBox?.map(
                         (
                           itemLocal: {
                             id: any;
                             selectedForCheckBox: boolean;
                           },
                           _index: any
                         ) => {
                           if (itemLocal?.id === item?.id) {
                             itemLocal.selectedForCheckBox =
                               !itemLocal.selectedForCheckBox;
                           }

                           return itemLocal;
                         }
                       );
                       setselectedCheckBox([...selectedCheckBoxs]);
                     }}
                     value={
                       selectedCheckBox && selectedCheckBox.length > 0
                         ? selectedCheckBox[index]?.selectedForCheckBox
                         : false
                     }
                   />
                   <View
                     style={{
                       justifyContent: "center",
                       alignItems: "center",
                       width:230,
                       flexWrap:'wrap'
                     }}
                   >
                     <GenericText
                       style={{
                         textAlign: "center",
                         padding: 5,
                         color: "#000",
                         fontSize: 14,
                         fontWeight: "300",

                       }}
                     >
                       {item?.isVc?item.documentName: item?.docName }
                     </GenericText>
                   </View>
                 </View>
               );
             }
           )}
       </View>
     </ScrollView>

   </View>

   <View style={{ flexDirection: 'row', alignItems: 'center', marginTop:10, marginLeft: 20, marginRight: 15  }}>
 <CheckBox
   value={isChecked}

   onValueChange={(newValue) => setIsChecked(newValue)}
 />
 <GenericText style={{marginLeft: 5,marginRight: 15, fontSize: 11, paddingRight: 20}}>
 {isEarthId() ? "earthidconsent" : "globalidconsent"}
</GenericText>
</View>
  
 <View
style={{
flexDirection: "row",
justifyContent: "space-between",
marginBottom: 20,
marginHorizontal: 30,
}}
>
{/* Cancel Button */}
<Button
onPress={() => {
setisDocumentModalkyc(false);
setIsCamerVisible(true);
}}
style={{
buttonContainer: {
 elevation: 5,
 marginHorizontal: 10,
 backgroundColor: "#fff",  // White background for Cancel button
 borderWidth: 1,  // Border for the Cancel button
 borderColor: '#D3D3D3',  // Light gray border color
 borderRadius: Platform.OS === 'ios' ? 30 : 30,  // Consistent borderRadius
 paddingVertical: 13,
 paddingHorizontal: 15,
 paddingRight: 25,
 alignItems: 'center',  // Horizontally center the content
 justifyContent: 'center',  // Vertically center the conten
},
text: {
 color: '#525252',  // Text color for Cancel button
 fontSize: 13,
 fontWeight: "700",  // Bold text
 textAlign: 'center', 
},
iconStyle: {
 tintColor: '#525252',
},
}}
title={"Cancel"}
/>

{/* Authorize Button */}
<Button
onPress={createVerifiableCredentials}
disabled={checkDisable() || !isChecked}
style={{
buttonContainer: {
 elevation: 5,
 marginHorizontal: 10,
 backgroundColor: Screens.colors.primary,  // Primary color for Authorize button
 opacity: checkDisable() || !isChecked ? 0.5 : 1,  // Disabled state opacity
 borderRadius: Platform.OS === 'ios' ? 30 : 30,  // Consistent borderRadius
 paddingVertical: 13,
 paddingHorizontal: 15,
 paddingRight: 25,
 alignItems: 'center',  // Horizontally center the content
 justifyContent: 'center',  // Vertically center the conten
},
text: {
 color: Screens.pureWhite,  // White text for Authorize button
 fontSize: 13,
 fontWeight: "700",  // Bold text
 textAlign: 'center', 
},
iconStyle: {
 tintColor: Screens.pureWhite,
},
}}
title={"Authorize"}
/>
</View>
   
 </View>}
</ModalView>:
<ModalView
left={deviceWidth / 12}
width={deviceWidth / 1.2}
isModalVisible={isDocumentModalkyc}
height={520}
>
  {isLoading ? <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>        
  <ActivityIndicator color={'red'} size='large' />
  </View>:
<View style={{ flex: 1, paddingHorizontal: 5 }}>
  
 
<TouchableOpacity onPress={() => navigateToCamerScreen()}>
<View style={{ paddingHorizontal: 5, marginTop: 10 }}>
<GenericText
  style={{
    textAlign: "center",
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 20,
  }}
>
  {"+ Add Documents"}
</GenericText>
</View>
</TouchableOpacity>


  {/* <GenericText
    style={{
      textAlign: "center",
      padding: 5,
      color: "#000",
      fontSize: 14,
      fontWeight: "900",
      marginTop: 10,
    }}
  >
    {isEarthId() ? "earthidwanttoaccess" : "globalidwanttoaccess"}
  </GenericText> */}
  <View style={{ height: 300 }}>
    <ScrollView
      style={{ flexGrow: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
     
    </ScrollView>

    <GenericText
      style={{
        textAlign: "center",
        padding: 5,
        color: "#000",
        fontSize: 16,
        fontWeight: "bold",
      }}
    >
      {"Selected Duration"}
    </GenericText>
    <Dropdown
      style={[styles.dropdown]}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      inputSearchStyle={styles.inputSearchStyle}
      iconStyle={styles.iconStyle}
      data={data}
      search
      maxHeight={300}
      labelField="label"
      valueField="value"
      placeholder={"Expiry Time (default 1 day)"}
      searchPlaceholder="Search..."
      value={"value"}
      onChange={(item) => {
        setValue(item.value);
      }}
    />
  </View>

  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop:10, marginLeft: 20, marginRight: 15  }}>
<CheckBox
  value={isChecked}

  onValueChange={(newValue) => setIsChecked(newValue)}
/>
<GenericText style={{marginLeft: 5,marginRight: 15, fontSize: 11, paddingRight: 20}}>
{isEarthId() ? "earthidconsent" : "globalidconsent"}
</GenericText>
</View>
 
<View
style={{
flexDirection: "row",
justifyContent: "space-between",
marginBottom: 20,
marginHorizontal: 30,
}}
>
{/* Cancel Button */}
<Button
onPress={() => {
setisDocumentModalkyc(false);
setIsCamerVisible(true);
}}
style={{
buttonContainer: {
elevation: 5,
marginHorizontal: 10,
backgroundColor: "#fff",  // White background for Cancel button
borderWidth: 1,  // Border for the Cancel button
borderColor: '#D3D3D3',  // Light gray border color
borderRadius: Platform.OS === 'ios' ? 30 : 30,  // Consistent borderRadius
paddingVertical: 13,
paddingHorizontal: 15,
paddingRight: 25,
alignItems: 'center',  // Horizontally center the content
justifyContent: 'center',  // Vertically center the conten
},
text: {
color: '#525252',  // Text color for Cancel button
fontSize: 13,
fontWeight: "700",  // Bold text
textAlign: 'center', 
},
iconStyle: {
tintColor: '#525252',
},
}}
title={"Cancel"}
/>

{/* Authorize Button */}
<Button
onPress={createVerifiableCredentials}
disabled={true}
style={{
buttonContainer: {
elevation: 5,
marginHorizontal: 10,
backgroundColor: Screens.colors.primary,  // Primary color for Authorize button
opacity:  0.5 ,  // Disabled state opacity
borderRadius: Platform.OS === 'ios' ? 30 : 30,  // Consistent borderRadius
paddingVertical: 13,
paddingHorizontal: 15,
paddingRight: 25,
alignItems: 'center',  // Horizontally center the content
justifyContent: 'center',  // Vertically center the conten
},
text: {
color: Screens.pureWhite,  // White text for Authorize button
fontSize: 13,
fontWeight: "700",  // Bold text
textAlign: 'center', 
},
iconStyle: {
tintColor: Screens.pureWhite,
},
}}
title={"Authorize"}
/>
</View>
  
</View>}
</ModalView>
      }


      <Loader
        loadingText={
          barCodeDataDetails?.requestType === "generateCredentials"
            ? "credential generated successfully"
            : "Login is successful"
        }
        Status="Success !"
        isLoaderVisible={false}
      ></Loader>
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
    width: 30,
    height: 30,
    
  },
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderBottomWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: 20
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: "absolute",
    backgroundColor: "white",
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },

  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  imageLogo: {
    width: 120,
    height: 120,
  },
});

export default CameraScreen;
