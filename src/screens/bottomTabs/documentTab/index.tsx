import { useIsFocused } from "@react-navigation/native";
import { set, values } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  SectionList,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Button,
  ActivityIndicator,
  InteractionManager
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import Share from "react-native-share";
import Avatar from "../../../components/Avatar";
import CustomBottomSheet from "../../../components/Bottomsheet";
import Card from "../../../components/Card";
import Header from "../../../components/Header";
import GenericText from "../../../components/Text";
import { TextInput } from "react-native-gesture-handler";
import { LocalImages } from "../../../constants/imageUrlConstants";
import { SCREENS } from "../../../constants/Labels";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { saveDocuments, updateDocuments } from "../../../redux/actions/authenticationAction";
import { Screens } from "../../../themes";
import Modal from "react-native-modal";
import QRCode from "react-native-qrcode-image";
import { getColor } from "../../../utils/CommonFuntion";
import zlib from "zlib";
import Spinner from "react-native-loading-spinner-overlay/lib";
import ImageResizer from "react-native-image-resizer";
import RNFS from "react-native-fs";
import AWS from "aws-sdk";
import GLOBALS from "../../../utils/globals";
import { AWS_API_BASE } from "../../../constants/URLContstants";

import axios from "axios";

import VeriffSdk from '@veriff/react-native-sdk';
import { createVerification, getMediaData, getMediaImage, getSessionDecision } from "../../../utils/veriffApis";
import { dateTime } from "../../../utils/encryption";
import { IDocumentProps } from "../../uploadDocuments/VerifiDocumentScreen";
import RNFetchBlob from "rn-fetch-blob";
import AnimatedLoader from "../../../components/Loader/AnimatedLoader";
import SuccessPopUp from "../../../components/Loader";
import ErrorPopUp from "../../../components/Loader/errorPopup";
import CustomPopup from "../../../components/Loader/customPopup";
import { isEarthId } from "../../../utils/PlatFormUtils";
import IDVNewLaunchScreen from "./IDVNewLaunchScreen";
import CustomPopupIDV from "../../../components/Loader/idvPopup";
import TextInputBox from "../../../components/TextInput";

const resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');
const earthIDLogo = require('../../../../resources/images/earthidLogoBlack.png');
const globalIDLogo = require('../../../../resources/images/logo.png')



interface IDocumentScreenProps {
  navigation?: any;
  route?: any;
}

const DocumentScreen = ({ navigation, route }: IDocumentScreenProps) => {
  //wait two seconds then print hello
  // setTimeout(() => {
  //   console.log(userDetails?.responseData);
  // }, 2000);
  const _toggleDrawer = () => {
    navigation.openDrawer();
  };
  const isFoused = useIsFocused();
  let documentsDetailsListData = useAppSelector((state) => state.Documents);
  const [documentsDetailsList, setdocumentsDetailsList] = useState(
    documentsDetailsListData
  );
  //console.log('documentsDetailsListData_doctab===>',documentsDetailsListData)
  const [selectedDocuments, setselectedDocuments] = useState();
  const [isModalVisible, setModalVisible] = useState(false);
  let [qrBase64, setBase64] = useState("");

  const [activityLoader, setActivityLoad] = useState(false);
  const getHistoryReducer = useAppSelector((state) => state.getHistoryReducer);
  console.log("getHistoryReducer===>", getHistoryReducer);

  let categoryTypes = "";

  if (route?.params && route?.params?.category) {
    categoryTypes = route?.params?.category;
  }
  const dispatch = useAppDispatch();
  const [selectedItem, setselectedItem] = useState<any>();
  const [edit, setEdit] = useState();
  const [itemdata, setitemdata] = useState([]);
  const [data, setData] = useState(documentsDetailsList?.responseData);
  const [multiSelectionEnabled, setMultiSelectionEnabled] = useState(false);
  const [clearMultiselection, setClearMultiSelection] = useState(false);
  const [
    isBottomSheetForSideOptionVisible,
    setisBottomSheetForSideOptionVisible,
  ] = useState(false);
  const [multpleDocuments, setMultipleDucuments] = useState({
    isSelected: false,
  });
  const [searchedData, setSearchedData] = useState([]);
  const [s3documentsDetailsList, sets3documentsDetailsList] = useState<any[]>([]);
  const [s3DocFullPath, sets3DocFullPath] = useState([]);
  const [signedUrl, setPreSignedUrl] = useState(undefined);
  const [masterDataSource, setMasterDataSource] = useState([]);
  const [searchText, setsearchText] = useState("");
  const [isCheckBoxEnable, setCheckBoxEnable] = useState(false);
  const [isClear, setIsClear] = useState(false);
  const [loading, setloading] = useState(false);
  const [load, setLoad] = useState(false);
  const [successResponse, setsuccessResponse] = useState(false);
  const [errorResponse, seterrorResponse] = useState(false);
  const [reload, setReload] = useState(false);
  const [sdkStatus, setSdkStatus] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isModalIDVVisible, setIsModalIDVVisible] = useState(false);
  const [code, setCode] = useState("");
  const [isIdvLoading, setIDVLoading] = useState(false);

  const [isLaunchVisible, setIsLaunchVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isPopupVisibleIDV, setPopupVisibleIDV] = useState(false);
  const [isPopupVisible, setPopupVisible] = useState(false);
const [popupContent, setPopupContent] = useState({
  title: '',
  message: '',
  buttons: []
});



const clientId = 'earthid-client-12345';
const apiKey = '8f8e28b6-7a6a-4ad2-9ef7-b2c2d10e6a4e';

  const userDetails = useAppSelector((state) => state.account);
  const keys = useAppSelector((state) => state.user);

  const bucketName: any = userDetails?.responseUserSpecificBucket;
  // const base64Image: any = selectedItem?.base64;
  const imageName: any = selectedItem?.docName + "." + selectedItem?.docType;

  // useEffect(() => {
  //   console.log("DOCUMENTS=====>>>>>>>>>>>", route?.params?.category);
  //   const chek = route?.params?.category;
  //   chek === undefined ? console.log("All posts") : console.log("filtrd");
  // }, [route?.params?.category]);

  const [isBottomSheetForFilterVisible, setisBottomSheetForFilterVisible] =
    useState<boolean>(false);
  const [isBottomSheetForShare, setIsBottomSheetForShare] =
    useState<boolean>(false);


    const selectedItemRef = useRef<any>(null);

    useEffect(() => {
      if (isPopupVisible) {
        console.log("Popup is now visible", isPopupVisible);
      }
    }, [isPopupVisible]);

  const _rightIconOnPress = async (selecteArrayItem: any) => {
    selectedItemRef.current = selecteArrayItem;
   // setselectedDocuments(selecteArrayItem);
    setselectedItem(selecteArrayItem);
    setisBottomSheetForSideOptionVisible(true);
    console.log('I have selected the 3 dots:', selecteArrayItem.docName)
   // await getFullPath(selecteArrayItem.docName)
    
  };


  const _shareIconPress = (selecteArrayItem: any) => {
    setselectedItem(selecteArrayItem);
    setisBottomSheetForSideOptionVisible(true);
  };
  // useEffect(() => {
  //   deleteAllBuckets();
  // }, []);
  useEffect(() => {
    console.log(GLOBALS.credentials);
    async function getAllDocs() {
      const response = await fetch("https://" + AWS_API_BASE + "documents/getall", {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentials: GLOBALS.credentials,
          awsID: GLOBALS.awsID,
        }),
      })
      const myJson = await response.json();
      console.log('this is my json1----------', myJson)
      let result = [];
      let content = myJson.Contents;
      for (let i = 0; i < content.length; i++) {
        let myObject = content[i];

        if (myObject.Key.substr(-1) == "/") {
          continue;
        }

        let myKey = myObject.Key.split("/");
        let date = new Date(Date.parse(myObject.LastModified));
        let myDate = date.getDate();
        myDate = myDate < 10 ? "0" + myDate : myDate;
        let myMonth = date.getMonth() + 1;
        myMonth = myMonth < 10 ? "0" + myMonth : myMonth;
        let myHours = date.getHours();
        myHours = myHours < 10 ? "0" + myHours : myHours;
        let myMinutes = date.getMinutes();
        myMinutes = myMinutes < 10 ? "0" + myMinutes : myMinutes;

        result.push({
          title: myKey[myKey.length - 1],
          name: myKey[myKey.length - 1],
          displayName: myKey[myKey.length - 1].split(".")[0],
          fullPath: myObject.Key,
          upload:
            myDate +
            "/" +
            myMonth +
            "/" +
            date.getFullYear() +
            " " +
            myHours +
            ":" +
            myMinutes,
          uploadTime: date,
          category: myKey[myKey.length - 2],
        });
      }
      documentsDetailsListData = result;
      console.log('this is s3 retrieved documents details::::::::::::::::::' ,result);
      sets3documentsDetailsList(result);
     // setData(result);
      // console.log(getFilteredData());
    }
    getAllDocs();
  }, [reload]);

//   useEffect(() => {
//     const { fileUri, category, docname, docType } = route.params;
// console.log('This is s3 doc upload details', category, docname, docType)
//     const uploadDocument = async () => {
//       try {
//         await uploadToS3(fileUri, category, docname, docType);
       
//       } catch (error) {
//         Alert.alert("Error", "An unexpected error occurred.");
//       }
//     };

//     if (fileUri && category && docname && docType) {
//       uploadDocument();
//     }
//   }, [route.params, navigation]);

  const getFullPath = async (displayName: string) =>{
    for (let i = 0; i < s3documentsDetailsList.length; i++) {
      if (s3documentsDetailsList[i].displayName === displayName) {
        console.log('This is the s3 path:', s3documentsDetailsList[i].fullPath)
        const s3docPath = s3documentsDetailsList[i].fullPath
        console.log('path', s3docPath)
        sets3DocFullPath(s3docPath)
        return s3docPath
      }
    }
    return null;
  }

  // Function to call the verify API
  const verifyCode = async () => {
    try {
      const response = await fetch("http://192.168.1.34:3027/verify-idv-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (response.status === 200) {
        Alert.alert("Success", "Code verified successfully!");
        setSdkStatus(true); // Set flag to true
        setIsModalIDVVisible(false); // Close the modal
       await veriffSdkLaunch(); // Call the SDK function
      } else {
        Alert.alert("Error", "Invalid or expired code. Please try again.");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      Alert.alert("Error", "An error occurred during verification. Please try again.");
    }
  };

  const uploadToS3 = async (base64: any, category: any, name: any, type: any) => {
    if (category === "ID") { category = "Identification"; }
  
    try {
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
  
      if (!response.ok) {
        // If the response is not OK (status code outside 200-299), throw an error
        throw new Error(`Failed to upload to S3. Status Code: ${response.status}`);
      }
  
      let myJson = await response.json();
      console.log('Uploaded to s3', myJson);
  
      // You can add any further success handling code here if needed
  
    } catch (error) {
      // Catch and handle any errors during fetch or response processing
      console.error('Error uploading to S3:', error);
      showPopup('Upload Error', 'An error occurred while uploading document. Please try again later.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate("Documents"),
          }
        ]
      );
      // Optionally, return an error object or value if needed
      return {
        status: 'error',
        message: error.message,
      };
    }
  };
  
  // const uploadToS3 = async (base64: any, category: any, name: any, type: any) => {
  //   if (category === "ID") { category = "Identification"; }
  //   const response = await fetch("https://" + AWS_API_BASE + "documents/upload", {
  //     method: 'POST',
  //     headers: {
  //       Accept: 'application/json',
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       base64: base64,
  //       category: category,
  //       name: name,
  //       type: type,
  //       credentials: GLOBALS.credentials,
  //       awsID: GLOBALS.awsID,
  //       contentDisposition: 'inline'
  //     }),
  //   });
  //   console.log('this is s3 response:', response)
  //   let myJson = await response.json();
  //   console.log('Uploaded to s3', myJson)
  // }
  

  const editS3Doc= async (path, category, name) => {
    if (category === "ID") { category = "Identification"; }
    let suffix = path.split('.').pop();
    name = name + "." + suffix;
    const response = await fetch("https://" + AWS_API_BASE + "documents/edit", {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: category,
        docname: name,
        path: path,
        credentials: GLOBALS.credentials,
        awsID: GLOBALS.awsID,
      }),
    });
    let myJson = await response.json();
    console.log(myJson);
  }

  const getCategoryImages = (item: { categoryType: any; name: any }) => {
    const getItems = SCREENS.HOMESCREEN.categoryList.filter(
      (itemFiltered, index) => {
        return (
          itemFiltered?.TITLE?.toLowerCase() ===
          item?.categoryType?.toLowerCase()
        );
      }
    );

    if (!getItems[0]) {
      return "#D7EFFB";
    }
    return getItems[0];
  };
  const getImagesColor = (item: any) => {
    let colors = item?.documentName;
    let iteName = colors?.trim()?.split("(")[0]?.trim();
    return getColor(iteName);
  };
  useEffect(() => {
    setdocumentsDetailsList(documentsDetailsListData);
  }, [documentsDetailsListData?.responseData]);

  const multiSelect = (item: any) => {
    // console.log(item?.base64, "@@@@@@@@@");
    // setMultipleDucuments(item);
    setCheckBoxEnable(!isCheckBoxEnable);
  };
  const _selectTigger = async (item: any) => {
    item.isSelected = !item.isSelected;
    setselectedDocuments(item);
    setdocumentsDetailsList({ ...documentsDetailsList });
    console.log('Item docname is:', item.docName)
   // await getFullPath(item.docName)
  };
  function convertTimeToAmPmFormat(timeString: {
    split: (arg0: string) => [any, any];
  }) {
   // return "00:00";
    const [hours, minutes] = timeString.split(":");
    let formattedTime = "";

    // Convert the 24-hour format to 12-hour format
    let hoursIn12HourFormat = parseInt(hours, 10) % 12;
    if (hoursIn12HourFormat === 0) {
      hoursIn12HourFormat = 12; // Set 12 for 0 (midnight) in 12-hour format
    }

    // Determine AM or PM
    const amOrPm = parseInt(hours, 10) < 12 ? "am" : "pm";

    // Add leading zero for single-digit minutes
    const paddedMinutes = minutes.padStart(2, "0");

    // Construct the formatted time string
    formattedTime = `${hoursIn12HourFormat}:${paddedMinutes} ${amOrPm}`;

    return formattedTime;
  }
  const getTime = (item: { time: any }) => {
    return convertTimeToAmPmFormat(item?.time);
  };
  function compareTime(a: { time: any; }, b: { time: any; }) {
    const timeA = new Date(`1970-01-01T${a.time}`);
    const timeB = new Date(`1970-01-01T${b.time}`);
    return timeA - timeB;
  }

  const showPopup = (title: any, message: any, buttons: any) => {
    console.log("selectedItem?.id1----");
  
    // Update state first
   setPopupContent({ title, message, buttons });
   setPopupVisible(true); // <- move this up
  
  
  };

  const _renderItem = ({ item, index }: any) => {
   
    return (
      <TouchableOpacity
        onLongPress={() => {
          multiSelect(item);
        }}
        style={{
          marginBottom: 20,
        }}
        onPress={
          isCheckBoxEnable ? () => _selectTigger(item) : async () => {
 //openDoc(item)
 console.log('Item docname is:', item.docName)
//const s3DocFullPath =  await getFullPath(item.docName)
 //console.log('This is the s3 path for view cred page:', s3DocFullPath)
 navigation.navigate("ViewCredential", { documentDetails: item })
          }
         
        }
      >
      

        <View style={{ marginTop: -20 }}>
          <Card
            titleIcon={item?.isVc ? LocalImages.vcImage : null}
            leftAvatar={LocalImages.documentsImage}
            absoluteCircleInnerImage={LocalImages.upImage}
            rightIconSrc={  LocalImages.menuImage}
            rightIconOnPress={() => _rightIconOnPress(item)}
            title={
              //item.name
              item?.isVc
                ? item.name
                : item?.docName?.split("(")[1]?.split(")")[0] == "undefined"
                ? item?.docName?.replaceAll("%20", "")
                : item?.docName?.replaceAll("%20", "")
            }
            subtitle={
              item.isVc
                ? `      Received  : ${item.date}`
                : `      Uploaded  : ${item.date}`
            }
             timeTitle={"   " + `${getTime(item)}`}
            isCheckBoxEnable={isCheckBoxEnable}
            onCheckBoxValueChange={(value: any) => {
              // item.isSelected = value;
              //setdocumentsDetailsList({ ...documentsDetailsList });
            }}
            checkBoxValue={item.isSelected}
            style={{
              ...styles.cardContainer,
              ...{
                avatarContainer: {
                  backgroundColor: getCategoryImages(item)?.COLOR,
                  width: 60,
                  height: 60,
                  borderRadius: 20,
                  marginTop: 25,
                  marginLeft: 10,
                  marginRight: 5,
                },
                uploadImageStyle: {
                  backgroundColor: getCategoryImages(item)?.COLOR,
                  borderRadius: 25,
                  borderWidth: 3,
                  bordercolor: "#fff",
                  borderWidthRadius: 25,
                },
              },
              title: {
                fontSize: 18,
                marginTop: -10,
                fontWeight: "bold",
              },
              subtitle: {
                fontSize: 14,
                marginTop: 5,
                marginLeft: -23
              },
            }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  //AWS3 bucket image store

  const handleUploadImage = async () => {
    setisBottomSheetForSideOptionVisible(false);
   navigation.navigate("ShareQr", { selectedItem: selectedItem, s3DocFullPath: selectedItem.s3Path });
  };

  const RowOption = ({ icon, title, rowAction }: any) => (
    <TouchableOpacity onPress={rowAction}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {icon && (
          <Image
            resizeMode="contain"
            style={styles.logoContainer}
            source={icon}
          ></Image>
        )}

        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <GenericText
            style={[
              styles.categoryHeaderText,
              { fontSize: 13, marginHorizontal: 10, marginVertical: 15 },
            ]}
          >
            {title}
          </GenericText>
        </View>
      </View>
    </TouchableOpacity>
  );

  // let openDoc = async (item: any) => {
  //   try {
  //     // Fetch the metadata first
  //     const response = await fetch(`http://${AWS_API_BASE}/documents/get`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         credentials: GLOBALS.credentials,
  //         path: item.fullPath,
  //       }),
  //     });
  
  //     if (!response.ok) {
  //       throw new Error("Network response was not ok");
  //     }
  
  //     const myJson = await response.json();
  //     console.log('My json--------------11:', myJson);
  
  //     // Assuming myJson.file contains a URL to the actual binary data
  //     const fileUrl = myJson.file;
  //     const binaryResponse = await fetch(fileUrl);
  //     if (!binaryResponse.ok) {
  //       throw new Error("Failed to fetch binary data");
  //     }
  
  //     const arrayBuffer = await binaryResponse.arrayBuffer();
      
  //     // Convert to base64
  //     const base64 = Buffer.from(arrayBuffer).toString("base64");
  //     item.base64 = base64;
  
  //     navigation.navigate("ViewCredential", { documentDetails: item });
  //   } catch (error) {
  //     console.error("Error fetching document:", error);
  //   }
  // };
  
  

  const onChangeHandler = (text: any) => {
    // docName to documentName
    const newDataItem = documentsDetailsList?.responseData || [];
    const filteredData = newDataItem.filter(
      (item: { docName: string; documentName: string; categoryType: string }) =>
        item.docName?.toLowerCase()?.includes(text?.toLowerCase()) ||
        item.documentName?.toLowerCase()?.includes(text?.toLowerCase()) ||
        item.categoryType?.toLowerCase()?.includes(text?.toLowerCase())
    );
    setsearchText(text);

    setSearchedData(filteredData);

    // if (text) {
    //   // Inserted text is not blank
    //   // Filter the masterDataSource
    //   // Update FilteredDataSource
    //   if(documentsDetailsList?.responseData==undefined){

    //     setSearchedData(data);
    //     setsearchText(text);
    //   }else{

    //     const newData = documentsDetailsList?.responseData.filter(
    //       function (item:any) {
    //         const itemData = item.documentName ? item?.documentName.toUpperCase() : "".toUpperCase();
    //         const textData = text.toUpperCase();
    //         return itemData.indexOf(textData) > -1;
    //     });
    //     setsearchText(text);

    //     setSearchedData(newData);
    //   }
    // } else {
    //   // Inserted text is blank
    //   // Update FilteredDataSource with masterDataSource
    //   setSearchedData(itemdata);
    //   setsearchText(text);

    // }
  };

  const shareItem = async () => {
    if (selectedDocuments?.isVc) {
      await Share.open({
        message: selectedItem?.vc,
        title: "Token",
      });
    } else {
      if (selectedItem?.isLivenessImage === "livenessImage") {
        await Share.open({
          url: selectedItem?.base64,
        });
      } else if (selectedItem?.type === "deeplink") {
        await Share.open({
          url: selectedItem?.base64,
        });
      } else if (selectedItem?.docType === "jpg") {
        await Share.open({
          url: `data:image/jpeg;base64,${selectedItem?.base64}`,
        });
      } else {
        await Share.open({
          url: `data:image/png;base64,${selectedItem?.base64}`,
        });
      }
    }
  };

  const qrCodeModal = () => {
    handleUploadImage();
  };

  const shareMultipleItem = async () => {
    let temp = [];
    temp = documentsDetailsList?.responseData.filter((el: { isSelected: boolean; }) => {
      // console.log(i[0].isSelected,'IIII')
      return el.isSelected == true;
    });
    console.log(temp, "IIII");
    let ShareBase64Array: string[] = [];
    temp.map(async (item: any, index: number) => {
      if (item?.docType === "jpg") {
        ShareBase64Array.push(`data:image/jpg;base64,${item?.base64}`);
      } else {
        ShareBase64Array.push(`data:application/pdf;base64,${item?.base64}`);
      }
    });
    setTimeout(async () => {
      await Share.open({
        urls: ShareBase64Array,
      });
    }, 1000);
  };


  const deleteItem = async () => {
    if (!selectedItem?.id) {
      setisBottomSheetForSideOptionVisible(false);
      console.error("❌ Cannot delete: selectedItem is missing an ID", selectedItem);
      return;
    }
  
    try {
      console.log("selectedItem?.id", selectedItem.id);
      setisBottomSheetForSideOptionVisible(false);
  
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          showPopup(
            "Confirmation!",
            "Are you sure you want to delete this document?",
            [
              {
                text: "Yes",
                onPress: async () => {
                  try {
                    let data = new FormData();
                    data.append("path", selectedItem.fullPath);
  
                    // Uncomment this for actual API call
                    // const response = await fetch("https://" + AWS_API_BASE + "documents/delete", {
                    //   method: "DELETE",
                    //   headers: { "Content-Type": "application/json" },
                    //   body: JSON.stringify({
                    //     credentials: GLOBALS.credentials,
                    //     path: selectedItem.s3Path || selectedItem.fullPath,
                    //   }),
                    // });
                    // const json = await response.json();
  
                    const imageName = `${selectedItem?.docName}.${selectedItem?.docType}`;
                    const key = `images/${imageName}`;
  
                    const helpArra = [...documentsDetailsList?.responseData];
                    const findIndex = helpArra.findIndex((item) => item.id === selectedItem?.id);
                    if (findIndex >= 0) helpArra.splice(findIndex, 1);
  
                    dispatch(saveDocuments(helpArra));
                  } catch (error) {
                    console.error("Error during document deletion:", error);
                    showPopup("Error", "Failed to delete document. Please try again later.", [
                      {
                        text: "OK",
                        onPress: () => setisBottomSheetForSideOptionVisible(false),
                      },
                    ]);
                  }
                },
              },
              {
                text: "Cancel",
                onPress: () => {
                  console.log("Cancel Pressed!");
                  setisBottomSheetForSideOptionVisible(false);
                },
                style: "cancel",
              },
            ]
          );
        }, 300); // 300ms delay for smoother popup
      });
  
    } catch (err) {
      console.error("Unexpected error while preparing delete popup:", err);
      setisBottomSheetForSideOptionVisible(false);
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          showPopup("Error", "Something went wrong. Please try again.", [
            {
              text: "OK",
              onPress: () => setisBottomSheetForSideOptionVisible(false),
            },
          ]);
        }, 300);
      });
      return
    }
  };
  
  
  
  // const deleteItem = () => {
  //   console.log("selectedItem?.id", selectedItem);
  //   Alert.alert(
  //     "Confirmation! ",
  //     "Are you sure you want to delete this document ?",
  //     [
  //       {
  //         text: "Cancel",
  //         onPress: () => (
  //           console.log("Cancel Pressed!"),
  //           setisBottomSheetForSideOptionVisible(false)
  //         ),
  //       },
  //       {
  //         text: "OK",
  //         onPress: async () => {
  //           let data = new FormData();
  //           data.append("path", selectedItem.fullPath);

  //           const response = await fetch("https://" + AWS_API_BASE + "documents/delete", {
  //             method: "DELETE",
  //             headers: {
  //               "Content-Type": "application/json",
  //             },
  //             body: JSON.stringify({
  //               credentials: GLOBALS.credentials,
  //               path: selectedItem.fullPath,
  //             }),
  //           });
  //           let json = await response.json();
  //           console.log(json);


  //           setisBottomSheetForSideOptionVisible(false);
  //           const imageName: any =
  //             selectedItem?.docName + "." + selectedItem?.docType;
  //           const key = `images/${imageName}`;
  //           // var s3 = new AWS.S3();
  //           // var params = { Bucket: bucketName, Key: key };

  //           // s3.deleteObject(params, function (err, data) {
  //           //   if (err) console.log(err, err.stack); // error
  //           //   else console.log(); // deleted
  //           // });
  //           const helpArra = [...documentsDetailsList?.responseData];
  //           const findIndex = helpArra?.findIndex(
  //             (item) => item.id === selectedItem?.id
  //           );
  //           findIndex >= -1 && helpArra?.splice(findIndex, 1);
  //           // console.log('helpArra',helpArra)
  //           dispatch(saveDocuments(helpArra));
  //         },
  //       },
  //     ],
  //     { cancelable: false }
  //   );
  // };

  function editItem() {
    setisBottomSheetForSideOptionVisible(false);
    navigation.navigate("categoryScreen", {
      selectedItem: selectedItem,
      editDoc: "editDoc",
      itemData: edit,
      itemVerify: selectedItem?.isLivenessImage,
    });
    // var data : any =selectedItem
    // await AsyncStorage.setItem("userDetails", data);
    // await AsyncStorage.setItem("editDoc", "editDoc");
  }

  const onPressNavigateTo = async () => {

    await alertUploadDoc()
    //navigation.navigate("uploadDocumentsScreen")

      }


      const alertUploadDoc = async () => {
        showPopup(
          "Please select the type of document you wish to add:",
          "For a government-issued photo ID, click 'Photo ID.' For a self-attested document, click 'Self-attested.'",
          [
            {
              text: 'Photo ID',
              onPress: async () => {
                console.log("Document Data-----------------------------------");
                // Retrieve the value of `setIDVFlag` from AsyncStorage
    const idvFlag = await AsyncStorage.getItem("setIDVFlag");
   // await AsyncStorage.setItem("setIDVFlag", "false");
    // Check if the flag is true
    if (idvFlag === "true") {
    //const user_id =  await AsyncStorage.getItem("user_id");
      // Launch Veriff SDK
      await AsyncStorage.setItem("sdkStatus", "false"); 
     // veriffSdkLaunch(user_id);
    setIsLaunchVisible(true)
// setIsModalIDVVisible(true);
    } else {
      // Show the IDV modal
      await AsyncStorage.setItem("sdkStatus", "false"); 
     // setIsLaunchVisible(true)
    setIsModalIDVVisible(true);
    }
              },
            },
            {
              text: 'Self-attested',
              onPress: () => navigation.navigate("uploadDocumentsScreen"),
            }
          ]
        );
      };
      
  //     const alertUploadDoc = async () => {
      
  //       setPopupVisible(true);
  // //       Alert.alert(
  // //         "Please select the type of document you wish to add:",
    
  // //   "For a government-issued photo ID, click 'Photo ID.'\n\n" +
  // //   "For a self-attested document, click 'Self-attested.'",
  // //         [
  // //           {
  // //             text: "Self-attested",
  // //             onPress: () => {
  // //               navigation.navigate("uploadDocumentsScreen");
  // //             },
  // //             style: "cancel",
  // //           },
  // //           {
  // //             text: "Photo ID",
  // //             onPress: () => {
     

  // //  console.log("Document Data-----------------------------------")
  // // veriffSdkLaunch()
                
  // //             },
  // //           },
  // //         ],
  // //         { cancelable: true }
  // //       );
  //     }

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

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


      const veriffSdkLaunch = async () => {
        setIsLoading(true);
        let user_id = await AsyncStorage.getItem("user_id");

        if (!user_id && userDetails?.responseData?.earthId) {
          user_id = userDetails.responseData.earthId;
        }
        
        console.log("Resolved user_id:", user_id);
console.log('Entered the veriff launch')
            const sessionRes = await createVerification()

            
           // Alert.alert("Alert1", "Created Veriff's session");
                // Properly displaying sessionRes
          //  Alert.alert("Alert2", JSON.stringify(sessionRes, null, 2));
          setIsLoading(false)
          await delay(1000);
          setIsLaunchVisible(false);

          await delay(1000); // Waits for 2 seconds
    console.log('Added delay of 2 secs');

            if(sessionRes.status=="success"){
            //  Alert.alert("Alert3", "Session success");
                    const sessionUrl = sessionRes.verification.url
                    const sessionId = sessionRes.verification.id
                
                  //  Alert.alert("Alert4", `Session ID: ${sessionId}\nSession URL: ${sessionUrl}`);

             // setsdkStatus(true)
         // const sdkStatusString = sdkStatus? 'true':'false'
         // console.log('SdkStatus from document screen1:', sdkStatus, sdkStatusString)
              await AsyncStorage.setItem("sdkStatus", "true");

              
          
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
            
            //  await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('Response of sdk:', result )
          
          // setsdkStatus(false)
          // const sdkStatusString2 = sdkStatus? 'true':'false'
          // console.log('SdkStatus from document screen2:', sdkStatus, sdkStatusString2)
          //    await AsyncStorage.setItem("sdkStatus", sdkStatusString2);
         

          let uploadDocResponseData
          let getDocImages
          let getImage
          let uploadDocVcResponse
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
  
  
 // await uploadToS3(getImage, "ID", "ID Document", ".jpg");
 // s3fullPath = `cognito/${GLOBALS.awsID}/Identification/ID Document.jpg`;
 // console.log('fullPath----------------:', s3fullPath);
  
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
  
  
     console.log('Sending details to the api2')
     uploadDocVcResponse = await createUploadDocVc(combinedData)
     console.log('UploadedDocVc is:::::::::::', uploadDocVcResponse)
     await createPayLoadFromDocumentData(uploadDocResponseData, uploadDocVcResponse)
  
  
  
  
  
  
  // const sessionId = "90c1146a-5f81-4c9a-8993-ad0675341a04";
  // const mediaId = "7b752371-0bba-48c1-b283-f50b5c8c4628";
  // const uploadDocResponseData = await getSessionDecision(sessionId);
  // const getDocImages = await getMediaData(sessionId);
  // const getImage = await getMediaImage(mediaId)
  
  
  //    console.log("Document Data", uploadDocResponseData)
  //  console.log("Document Images", getDocImages)
  //  console.log("Media Image", getImage)
  
  
  //  console.log("UploadDocData:", uploadDocResponseData)
  
  
    
   
  
  const username = uploadDocResponseData.person?.firstName?.value ?? null;
  
  const userDOB = uploadDocResponseData?.person?.dateOfBirth?.value ?? null;
  
  let ageProofVC
  if(userDOB!==null){
    const ageProofVcFull = await generateAgeProof(userDOB)
    await AsyncStorage.setItem("ageProofVC", JSON.stringify(ageProofVcFull));
    ageProofVC = ageProofVcFull.verifiableCredential
    console.log('this is ageProofVC----->', ageProofVC)
  }

  const idvVc = await generateIdvProof(user_id, uploadDocResponseData.document.type.value, uploadDocResponseData.decisionScore)
  console.log('This is idvVc',idvVc)
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
  
        var date = dateTime();
        const filePath = RNFetchBlob.fs.dirs.DocumentDir + "/" + "Adhaar";
        var documentDetails: IDocumentProps = {
          id: `ID_VERIFICATION${Math.random()}${selectedDocument}${Math.random()}`,
          // name: selectedDocument,
          documentName: selectedDocument,
          path: filePath,
          //s3Path: s3fullPath,
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
          vc: uploadDocVcResponse,
          isVc: false,
          signature: undefined,
          typePDF: undefined,
          verifiableCredential: uploadDocVcResponse
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
       // 
        dispatch(saveDocuments(DocumentList));
       
        setsuccessResponse(true);
        getHistoryReducer.isSuccess = false;
        setTimeout(async () => {
          setsuccessResponse(false);
          const item = await AsyncStorage.getItem("flow");
          await AsyncStorage.setItem("setIDVFlag", "false");
            // generateVc()
           // navigation.navigate("Documents");
            
          
        }, 2000);
      //}
    }, 2000);
    setLoad(false);
    setReload(!reload)
  }else{
    seterrorResponse(true)
    throw new Error('An error occurred during image validation');
  }
              }else{
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
              // seterrorResponse(true)
              // throw new Error('An error occurred during image validation');
            }
            }else{
            //  Alert.alert("Alert5", JSON.stringify(sessionRes, null, 2));
              seterrorResponse(true)
              throw new Error('An error occurred during image validation');
            }
            setLoad(false);
        
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
        
          const createPayLoadFromDocumentData = async (documentResponseData: any, uploadDocVcResponse: any) => {
            console.log("Username:", documentResponseData?.person?.firstName?.value);
            console.log("Date of Birth:", documentResponseData?.person?.dateOfBirth?.value);
          
            const username = documentResponseData?.person?.firstName?.value ?? null;
            const userDOB = documentResponseData?.person?.dateOfBirth?.value ?? null;
          
            await AsyncStorage.setItem("userDOB", userDOB);
            await AsyncStorage.setItem("userName", username);
            await AsyncStorage.setItem("uploadedDocReg", JSON.stringify(documentResponseData));
            //await AsyncStorage.setItem("flow", "documentflow");
          
      
              await AsyncStorage.setItem("uploadedDocVc", JSON.stringify(uploadDocVcResponse));
     
          
            if (userDetails.responseData) {
              console.log('Uploading doc after registration');
            } else {
              await AsyncStorage.setItem("flow", "documentflow");
            }
          };
          
          const ssiBaseUrl = "https://ssi-test.myearth.id/api"
          const authorizationKey = "01a41742-aa8e-4dd6-8c71-d577ac7d463c"
          
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
          
      

  const _keyExtractor = ({ path }: any) => path.toString();

  const getFilteredData = () => {
    console.log("getFilteredData");
    let data = documentsDetailsList?.responseData;
  
    // Sort the array based on the combined date and time in descending order
    if (data) {
      data = [...data].sort((a, b) => {
        const dateTimeA = new Date(`${a.date.split('/').reverse().join('-')}T${a.time}`);
        const dateTimeB = new Date(`${b.date.split('/').reverse().join('-')}T${b.time}`);
        return dateTimeB - dateTimeA; // Descending order
      });
    }
  
    // Log just the docName for each item
    data.forEach((item) => {
      console.log(item.docName);
    });
  
    if (categoryTypes !== "") {
      var alter = function (item) {
        let splittedValue = item?.categoryType
          ?.trim()
          .split("(")[0]
          ?.toLowerCase();
  
        return splittedValue?.trim() === categoryTypes?.trim()?.toLowerCase(); 
      };
      var filter = data?.filter(alter);
      return getItemsForSection(filter);
    }
  
    if (searchedData.length > 0) {
      data = searchedData;
      return getItemsForSection(data);
    }
  
    if (searchedData.length === 0 && searchText != "") {
      return []; 
    }
  
    return getItemsForSection(data);
  };
  
  
  const handleVerifyCode = async () => {
    if (!code) {
      setIsModalIDVVisible(false);
      Alert.alert("Error", "Please enter a code.");
      return;
    }
  
    try {
      setIsModalIDVVisible(false);
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
        
   // setIDVLoading(false);
InteractionManager.runAfterInteractions(() => {
  setTimeout(() => {
    setIsLaunchVisible(true);
  }, 300); // 300ms delay for smoother transition
});
//console.log("BottomSheet isVisible", );
//console.log("Launch screen isVisible", isLaunchVisible);
       //await veriffSdkLaunch(user_id);
      } else {
        // Code is invalid
       // setIDVLoading(false);
        setIsModalIDVVisible(false);
        Alert.alert("Error", "Invalid code. Please try again.");
        return;
      }
    } catch (error) {
      console.error("Verification Error:", error);
    //  setIDVLoading(false);
      setIsModalIDVVisible(false);
      Alert.alert("Error", "Failed to verify the code. Please try again later.");
      return;
    } finally {
    //  setIDVLoading(false);
      setIsModalIDVVisible(false);
    }
  };
  

  const getItemsForSection = (data: any[]) => {
    const idDocuments = data?.filter(
      (item: { categoryType: string }) =>
        item?.categoryType === "ID" ||
        item?.categoryType === "id" ||
        item?.categoryType === "Identification" ||
        item?.categoryType === "Id"
    );
    const idHealthCare = data?.filter(
      (item: { categoryType: string }) =>
        item?.categoryType === "HEALTHCARE" || item?.categoryType === "Healthcare"
    );
    const idTravels = data?.filter(
      (item: { categoryType: string }) =>
        item?.categoryType === "TRAVEL" || item?.categoryType === "Travel"
    );
    const idInsurance = data?.filter(
      (item: { categoryType: string }) =>
        item?.categoryType === "INSURANCE" || item?.categoryType === "Insurance"
    );
    const idEducation = data?.filter(
      (item: { categoryType: string }) =>
        item?.categoryType === "EDUCATION" || item?.categoryType === "Education"
    );
    const idEmployement = data?.filter(
      (item: { categoryType: string }) =>
        item?.categoryType === "EMPLOYMENT" || item?.categoryType === "Employment"
    );
    const idFinanace = data?.filter(
      (item: { categoryType: string }) =>
        item?.categoryType === "FINANCE" || item?.categoryType === "Finance"
    );

    const localArray = [
      {
        title: idDocuments?.length > 0 ? "ID" : "",
        data: idDocuments,
      },
      {
        title: idHealthCare?.length > 0 ? "HEALTHCARE" : "",
        data: idHealthCare,
      },
      {
        title: idTravels?.length > 0 ? "TRAVEL" : "",
        data: idTravels,
      },
      {
        title: idInsurance?.length > 0 ? "INSURANCE" : "",
        data: idInsurance,
      },
      {
        title: idEducation?.length > 0 ? "EDUCATION" : "",
        data: idEducation,
      },
      {
        title: idEmployement?.length > 0 ? "EMPLOYMENT" : "",
        data: idEmployement,
      },
      {
        title: idFinanace?.length > 0 ? "FINANCE" : "",
        data: idFinanace,
      },
    ];
    console.log("filter", localArray);
    const filteredLocalArray = localArray?.filter(
      (item) => item?.data?.length > 0
    );
    return filteredLocalArray;
  };

  const listEmpty = () => {
    return (
      <View style={{ flex: 1, alignItems: "center", marginTop: 10 }}>
        <Text>No Documents found</Text>
      </View>
    );
  };

  return (
    <View style={styles.sectionContainer}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 200,
          backgroundColor: "#fff",
        }}
      >
        <View>
          <Header
            rightIconPress={onPressNavigateTo}
            leftIconSource={LocalImages.logoImage}
            rightIconSource={LocalImages.addImage}
            onpress={() => {
              _toggleDrawer();
            }}
            linearStyle={styles.linearStyle}
          ></Header>

{documentsDetailsList?.responseData &&
          documentsDetailsList?.responseData?.length > 0 ? (
            <TextInputBox
              leftIcon={LocalImages.searchImage}
              style={{
                container: styles.textInputContainer,
              }}
              isError={false}
              isNumeric={false}
              placeholder={"Search documents"}
              value={searchText}
              onChangeText={onChangeHandler}
            />
          ) : null}

{documentsDetailsList?.responseData &&
          documentsDetailsList?.responseData?.length > 0 ? (
            <SectionList<any>
              sections={getFilteredData()}
              renderItem={_renderItem}
              renderSectionHeader={({ section }) =>
                section?.title != "" && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 10,
                      marginLeft: 20,
                    }}
                  >
                    <View
                      style={{ justifyContent: "center", alignItems: "center" }}
                    >
                      <Avatar
                        isCategory={true}
                        isUploaded={false}
                        iconSource={
                          getCategoryImages({
                            categoryType: section?.title,
                            name: undefined,
                          })?.URI
                        }
                        style={{
                          container: [
                            styles.avatarContainer,
                            {
                              backgroundColor: getCategoryImages({
                                categoryType: section?.title,
                                name: undefined,
                              })?.COLOR,
                              flexDirection: "row",
                            },
                          ],
                          imgContainer: styles.avatarImageContainer,
                          text: styles.avatarTextContainer,
                        }}
                      />
                    </View>
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: -20,
                      }}
                    >
                      <GenericText
                        style={[
                          {
                            fontSize: 15,
                            fontWeight: "bold",
                            marginHorizontal: 9,
                          },
                        ]}
                      >
                        {section?.title}
                      </GenericText>
                    </View>
                  </View>
                )
              }
              ListEmptyComponent={listEmpty}
              
            />
          ) : (
            // <GenericText
            // style={{
            //   color:"black",
            //   alignSelf:"center",
            //   marginTop:"30%",
            //   fontSize:18
            // }}
            // >{"norecentactivity"}
            // </GenericText>

            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                marginTop: "30%",
              }}
            >
              <Image
                resizeMode="contain"
                style={[styles.logoContainers]}
                source={LocalImages.recent}
              ></Image>
            </View>
          )}

          <CustomBottomSheet
            onClose={() => setisBottomSheetForSideOptionVisible(false)}
            height={230}
            isVisible={isBottomSheetForSideOptionVisible}
          >
            <View style={{ height: 180, width: "100%", paddingHorizontal: 30 }}>
            {(selectedItem?.isVc === false || selectedItem?.isVc == null) && (
              <RowOption
                rowAction={() => editItem()}
                title={"edit"}
                icon={LocalImages.editIcon}
              />
            )}
                {/* {(selectedItem?.isVc === false || selectedItem?.isVc == null) && (
      <RowOption
        rowAction={() => qrCodeModal()}
        title={"QR Code"}
        icon={LocalImages.qrcodeImage}
      />
    )} */}
              <RowOption
                rowAction={() => shareItem()}
                title={"share"}
                icon={LocalImages.shareImage}
              />
              <RowOption
                rowAction={() => {
                  console.log("Delete option pressed");
                  deleteItem();
                }}
                title={"delete"}
                icon={LocalImages.deleteImage}
              />
            </View>
          </CustomBottomSheet>

          <CustomBottomSheet
            onClose={() => setIsBottomSheetForShare(false)}
            height={150}
            isVisible={isBottomSheetForShare}
          >
            <View style={{ height: 50, width: "100%", paddingHorizontal: 30 }}>
              <RowOption
                rowAction={() => shareItem()}
                title={"Share"}
                icon={LocalImages.shareImage}
              />
            </View>
          </CustomBottomSheet>
          <CustomBottomSheet
            onClose={() => setisBottomSheetForFilterVisible(false)}
            height={150}
            isVisible={isBottomSheetForFilterVisible}
          >
            <View style={{ height: 150, width: "100%", paddingHorizontal: 30 }}>
              <RowOption title={"By Category"} />
              <RowOption title={"By Date"} />
              <RowOption title={"By Frequency"} />
            </View>
          </CustomBottomSheet>
        </View>
      </ScrollView>
      <Modal isVisible={isModalVisible} backdropOpacity={0.5}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setModalVisible(false);
            setisBottomSheetForSideOptionVisible(false);
          }}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View
            style={{
              width: 350,
              height: 240,
              backgroundColor: "#fff",
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {activityLoader && !signedUrl ? (
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator
                  size={"small"}
                  color={"red"}
                ></ActivityIndicator>
              </View>
            ) : (
              <QRCode
                getBase64={(base64: string) => {
                  qrBase64 = base64;
                  setBase64(base64);
                }}
                value={signedUrl}
                size={200}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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

{
  isPopupVisible && (
<CustomPopup
        isVisible={isPopupVisible}
        title={popupContent.title}
        message={popupContent.message}
        buttons={popupContent.buttons}
        onClose={() => setPopupVisible(false)}
      />
  )
}


{/* <CustomPopupIDV
  isVisible={isModalIDVVisible}
  title="Enter IDV Code"
  inputValue={code}
  onInputChange={setCode}
  buttons={[
    { text: "Verify", onPress: handleVerifyCode },
  ]}
  onClose={() => setIsModalIDVVisible(false)}
/> */}


      
   {/* IDV Verification Popup */}
   { isLaunchVisible && (
    <IDVNewLaunchScreen 
    isVisible={isLaunchVisible} 
    isLoading={isLoading} 
    onClose={() => setIsLaunchVisible(false)} 
    onStartVerification={veriffSdkLaunch} />   
   )}
   
   {/* Popup for Code Entry */}
   <CustomBottomSheet
  isVisible={isModalIDVVisible}
  onClose={() => setIsModalIDVVisible(false)}
  height={200}
>
  <View style={styles.popupContainer}>
    <TextInput
      style={{
        height: 50,
        width: 300,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        textAlign: "center",
      }} // Apply styles from the `input` style below
      placeholder="Enter Your Code"
      value={code}
      onChangeText={setCode}
    />
    <TouchableOpacity
      style={styles.verifyButton} // Separate style for the button
      onPress={handleVerifyCode}
    >
      <Text style={styles.verifyButtonText}>Verify</Text>
    </TouchableOpacity>
  </View>
</CustomBottomSheet>


      {isIdvLoading && <AnimatedLoader isLoaderVisible={isIdvLoading} loadingText="Verifying..." />}

    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: Screens.colors.background,
  },
  linearStyle: {
    height: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
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
  alignCenter: { justifyContent: "center", alignItems: "center" },
  label: {
    fontWeight: "bold",
    color: Screens.black,
  },
  textInputContainer: {
    backgroundColor: "#fff",
    elevation: 1,
    borderColor: "transparent",
    borderRadius: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  categoryHeaderText: {
    marginHorizontal: 30,
    marginVertical: 20,
    color: Screens.headingtextColor,
  },

  cardContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: Screens.pureWhite,
    // backgroundColor:'red',
    title: {
      color: Screens.black,
    },
    textContainer: {
      justifyContent: "center",
      alignItems: "center",
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
  },
  documentContainer: {
    marginHorizontal: 20,
    marginVertical: 5,
    flex: 1,
    backgroundColor: Screens.pureWhite,
  },
  logoContainer: {
    width: 25,
    height: 25,
    tintColor: "black",
  },
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 8,
  },
  avatarImageContainer: {
    width: 15,
    height: 15,
    marginTop: 5,
    tintColor: "#fff",
  },
  avatarTextContainer: {
    fontSize: 13,
    fontWeight: "500",
  },
  logoContainers: {
    width: 200,
    height: 150,
    resizeMode: "contain",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  // input: {
  //   width: "100%",
  //   padding: 10,
  //   borderWidth: 1,
  //   borderColor: "#ccc",
  //   borderRadius: 5,
  //   marginBottom: 15,
  // },
  popupContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20, // Ensure padding for the content
  },
  input: {
    height: 50, // Standard height
    width: 300, // Fixed width
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20, // Space between input and button
    textAlign: "center", // Center-align text
  },
  verifyButton: {
    marginTop: 10,
    backgroundColor: Screens.colors.primary, // Use your theme color
    paddingVertical: 15, // Adjust for vertical padding
    borderRadius: 50, // Rounded corners
    alignItems: "center",
    justifyContent: "center",
    width: 300, // Match the width of the input
  },
  verifyButtonText: {
    color: "#FFFFFF", // Text color
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default DocumentScreen;
