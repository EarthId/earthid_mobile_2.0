import { isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TextInput } from "react-native-gesture-handler";
import RNFetchBlob from "rn-fetch-blob";

import Button from "../../components/Button";

import Card from "../../components/Card";
import Header from "../../components/Header";
import SuccessPopUp from "../../components/Loader";
import AnimatedLoader from "../../components/Loader/AnimatedLoader";
import ModalView from "../../components/Modal";
import GenericText from "../../components/Text";
import { LocalImages } from "../../constants/imageUrlConstants";
import { SCREENS } from "../../constants/Labels";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { useFetch } from "../../hooks/use-fetch";
import {
  saveDocuments,
  updateDocuments,
} from "../../redux/actions/authenticationAction";
import { Screens } from "../../themes";
import { alertBox, getCategoriesApi } from "../../utils/earthid_account";
import { dateTime } from "../../utils/encryption";
import { isEarthId } from "../../utils/PlatFormUtils";
import { IDocumentProps } from "./VerifiDocumentScreen";
import GLOBALS from "../../utils/globals";
import { AWS_API_BASE } from "../../constants/URLContstants";
import CustomPopup from "../../components/Loader/customPopup";

const deviceWidth = Dimensions.get("window").width;
interface IDocumentScreenProps {
  navigation?: any;
  route?: any;
}

const categoryScreen = ({ navigation, route }: IDocumentScreenProps) => {
  const fileUri = route?.params?.fileUri;
  const fileType = route?.params?.fileType;
  const pic = route?.params?.fileUri;
  const itemData = route?.params?.itemData;
  const { editDoc, selectedItem } = route?.params;
  const itemVerify = route?.params?.itemVerify;
  const imageName = fileUri?.imageName;
  // const splitName = imageName.split('.')[0]

  // const typeItem=selectedItem?.name?.split('(')[1].split(')')[0];
  const typeItem = selectedItem?.documentName?.split("(")[1]?.split(")")[0];

  const [isPrceedForLivenessTest, setIsPrceedForLivenessTest] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedDocument, setselectedDocument] = useState();
  const [editselectedDocument, EditsetselectedDocument] = useState();
  const [loader, setLoading] = useState(false);
  const [load, setLoad] = useState(false);
  const [docname, setDocname] = useState(
    fileUri?.route === "gallery"
      ? imageName
      : editDoc === "editDoc"
        ? selectedItem?.docName
        : fileUri?.flow === "deeplink"
          ? fileUri?.docName
          : null
  );



  console.log("imageName************", imageName);
  console.log("editDoc************", editDoc);
  console.log("selectedItem?.docName************", selectedItem?.docName);
  console.log("fileUri?.docName************", fileUri?.docName);



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


  const [button, setButton] = useState(false);
  const [selectedParentIndex, setSelectedParentIndex] = useState(0);
  const documentsDetailsList = useAppSelector((state) => state.Documents);
  const [successResponse, setsuccessResponse] = useState(false);
  const dispatch = useAppDispatch();

  console.log("itemVerify", itemVerify);

  const {
    loading: isCategoryLoading,
    data: getCategoryData,
    error,
    fetch: getCategories,
  } = useFetch();

  const _toggleDrawer = () => {
    navigation.openDrawer();
  };
  useEffect(() => {
    setIsPrceedForLivenessTest(false);
  }, []);

  // const uploadToS3 = async (myData, category, name, type) => {
  //   if (category === "ID") {
  //     category = "Identification";
  //   }

  //   try {
  //     const response = await fetch("https://" + AWS_API_BASE + "documents/upload", {
  //       method: 'POST',
  //       headers: {
  //         Accept: 'application/json',
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         base64: myData.base64,
  //         category: category,
  //         name: name,
  //         type: type,
  //         credentials: GLOBALS.credentials,
  //         awsID: GLOBALS.awsID,
  //       }),
  //     });

  //     // if (!response.ok) {
  //     //   throw new Error(`HTTP error! Status: ${response.status}`);
  //     // }
  //     console.log('This is info about the document uploaded to s31----------------->', response);
  //     const myJson = await response.json();
  //     console.log('This is info about the document uploaded to s3----------------->', myJson);
  //     return myJson;
  //   } catch (error) {
  //     console.error('Error uploading to S3:', error);
  //     throw error; // re-throw the error if you want to handle it further up the call stack
  //   }
  // };

  const uploadToS3 = async (myData, category, name, type) => {
    if (category === "ID") { 
      category = "Identification"; 
    }
  
    try {
      // Ensure the file name has the correct extension for S3 path but strip it for name in the request
      const fileNameWithExtension = name.includes('.') ? name : `${name}${type}`;
      
      // Remove any extension from the name to use in the request body
      const nameWithoutExtension = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;

      console.log('Name with extention:', fileNameWithExtension, "Name without extention:", nameWithoutExtension)
  
      const response = await fetch("https://" + AWS_API_BASE + "documents/upload", {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64: myData.base64,
          category: category,
          name: nameWithoutExtension,  // Use the name without the extension
          type: type,
          credentials: GLOBALS.credentials,
          awsID: GLOBALS.awsID,
          contentDisposition: 'inline'
        }),
      });
  
      const jsonResponse = await response.json();
      console.log('This is info about the document uploaded to S3----------------->', jsonResponse);
  
      if (response.ok) {
        // Construct the S3 fullPath with the extension
        const fullPath = `cognito/${GLOBALS.awsID}/${category}/${fileNameWithExtension}`;
        console.log('fullPath----------------:', fullPath);
  
        return {
          status: response.status,
          fullPath: fullPath,  // Include the full path with the file extension
        };
      } else {
        console.error('Failed to upload to S3:', jsonResponse);
        return {
          status: response.status,
          error: jsonResponse.errorMessage || 'Failed to upload document',
        };
      }
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  };
  
  
  
  

  async function editS3Doc(path, category, name) {
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

  const onSubmitAction = async () => {
    setLoad(true)
    if (docname?.length > 0) {
      setButton(true);

      if (fileUri?.flow === "deeplink") {
        if (fileUri?.type === "application/pdf") {
          var date = dateTime();
          const filePath = RNFetchBlob.fs.dirs.DocumentDir + "/" + "Adhaar";

         //  const s3Doc =  await uploadToS3(fileUri, categoryList[selectedParentIndex].key, docname, ".pdf");
      
         // if(s3Doc.status==200){
            //console.log('Document uploaded to s3 successfully!!!', s3Doc)

            const document: any[0] = categoryList[
              selectedParentIndex
            ]?.value?.filter((data: any) => data.isSelected);
  
           
  
            var documentDetails: IDocumentProps = {
              id: `ID_VERIFICATION${Math.random()}${selectedDocument}${Math.random()}`,
              documentName: `${categoryList[selectedParentIndex].key} (${document[0]?.title})`,
              //  name: `${categoryList[selectedParentIndex].key} (${document[0]?.title})`,
              path: filePath,
             // s3Path: s3Doc.fullPath,
              date: date?.date,
              time: date?.time,
              txId: "e4343434343434443",
              docType: "pdf",
              docExt: ".jpg",
              processedDoc: "",
              base64: fileUri?.base64,
              categoryType: categoryList[selectedParentIndex].key,
              pdf: true,
              docName: docname,
              typePDF: fileUri?.typePDF,
            };
            var DocumentList = documentsDetailsList?.responseData
              ? documentsDetailsList?.responseData
              : [];
            DocumentList.push(documentDetails);
  
            dispatch(saveDocuments(DocumentList));
  setLoad(false)
            setsuccessResponse(true);
            setTimeout(() => {
              setsuccessResponse(false);
              navigation.navigate("Documents");
            }, 2000);
        //  }else{
        //   showPopup(
        //     "Error",
        //     "An error occurred while uploading the document. Please try again",
        //     [
        //       {
        //         text: "OK",
        //         onPress: () => setPopupVisible(false),
        //       },
        //     ]
        //   );
        //  }
         
          //  const s3uploadRes=  await uploadToS3(fileUri, categoryList[selectedParentIndex].key, docname, ".pdf");
          //  if(s3uploadRes.httpStatusCode=="200"){
          //   setsuccessResponse(true);
          //   setTimeout(() => {
          //     setsuccessResponse(false);
          //     navigation.navigate("Documents");
          //   }, 2000);
          //  }else{
          //   Alert.alert("Error", s3uploadRes.errorMessage || "An error occurred while uploading the document.");
          //  }

        } else {
          const { selfAttested } = route.params;
          if (selfAttested === 'no') {
            var date = dateTime();
            const document: any[0] = categoryList[
              selectedParentIndex
            ]?.value?.filter((data: any) => data.isSelected);

            const filePath = RNFetchBlob.fs.dirs.DocumentDir + "/" + "Adhaar";

           // const s3Doc =  await uploadToS3(fileUri, categoryList[selectedParentIndex].key, docname, ".jpg");
              
             //  if(s3Doc.status==200){
               // console.log('Document uploaded to s3 successfully!!!', s3Doc)
                var documentDetails: IDocumentProps = {
                  id: `ID_VERIFICATION${Math.random()}${selectedDocument}${Math.random()}`,
                  documentName: `${categoryList[selectedParentIndex].key} (${document[0]?.title})`,
                  //  name: `${categoryList[selectedParentIndex].key} (${document[0]?.title})`,
                  path: filePath,
                  //s3Path: s3Doc.fullPath,
                  date: date?.date,
                  time: date?.time,
                  txId: "e4343434343434443",
                  docType: "jpg",
                  docExt: ".jpg",
                  fileType: fileType,
                  processedDoc: "",
                  base64: fileUri?.base64,
                  type: "deeplink",
                  categoryType: categoryList[selectedParentIndex].key,
                  docName: docname,
                };
                var DocumentList = documentsDetailsList?.responseData
                  ? documentsDetailsList?.responseData
                  : [];
                DocumentList.push(documentDetails);
                // 
                dispatch(saveDocuments(DocumentList));
    
                setsuccessResponse(true);
                setTimeout(() => {
                  setsuccessResponse(false);
                  navigation.navigate("Documents");
                }, 2000);
            //  }else{
            //   showPopup(
            //     "Error",
            //     "An error occurred while uploading the document. Please try again",
            //     [
            //       {
            //         text: "OK",
            //         onPress: () => setPopupVisible(false),
            //       },
            //     ]
            //   );
            //  }

           
         
            // const s3uploadRes= await uploadToS3(fileUri, categoryList[selectedParentIndex].key, docname, ".jpg");

            // if(s3uploadRes.httpStatusCode=="200"){
            //   setsuccessResponse(true);
            //   setTimeout(() => {
            //     setsuccessResponse(false);
            //     navigation.navigate("Documents");
            //   }, 2000);
            //  }else{
            //   Alert.alert("Error", s3uploadRes.errorMessage || "An error occurred while uploading the document.");
            //  }
          }
          else {
            setIsPrceedForLivenessTest(true);
          }

        }
      } else {
        if (fileUri?.type === "application/pdf") {
          var date = dateTime();

          const filePath = RNFetchBlob.fs.dirs.DocumentDir + "/" + "Adhaar";

         //  const s3Doc =  await uploadToS3(fileUri, categoryList[selectedParentIndex].key, docname, ".pdf");
           
         // if(s3Doc.status==200){
           // console.log('Document uploaded to s3 successfully!!!', s3Doc)
            var documentDetails: IDocumentProps = {
              //    name: fileUri?.file?.name,
              documentName: fileUri?.file?.name,
              id: `ID_VERIFICATION${Math.random()}${"random"}${Math.random()}`,
              path: filePath,
             // s3Path: s3Doc.fullPath,
              date: date?.date,
              time: date?.time,
              txId: "e4343434343434443",
              docType: "pdf",
              docExt: ".jpg",
              processedDoc: "",
              base64: fileUri?.base64,
              categoryType: categoryList[selectedParentIndex].key,
              pdf: true,
              docName: docname,
              isVerifyNeeded: false,
              typePDF: fileUri?.typePDF,
            };
            var DocumentList = documentsDetailsList?.responseData
              ? documentsDetailsList?.responseData
              : [];
            DocumentList.push(documentDetails);
            // 
            dispatch(saveDocuments(DocumentList));
  
            setsuccessResponse(true);
            setTimeout(() => {
              setsuccessResponse(false);
              navigation.navigate("Documents");
            }, 2000);
        //  }else{
        //   showPopup(
        //     "Error",
        //     "An error occurred while uploading the document. Please try again",
        //     [
        //       {
        //         text: "OK",
        //         onPress: () => setPopupVisible(false),
        //       },
        //     ]
        //   );
        //  }

       
          // const s3uploadRes = await uploadToS3(fileUri, categoryList[selectedParentIndex].key, docname, ".pdf");
          // if(s3uploadRes.httpStatusCode=="200"){
          //   setsuccessResponse(true);
          //   setTimeout(() => {
          //     setsuccessResponse(false);
          //     navigation.navigate("Documents");
          //   }, 2000);
          //  }else{
          //   Alert.alert("Error", s3uploadRes.errorMessage || "An error occurred while uploading the document.");
          //  }
        } else {
          const { selfAttested } = route.params;
          if (selfAttested === "no") {

            var date = dateTime();
            const document: any[0] = categoryList[
              selectedParentIndex
            ]?.value?.filter((data: any) => data.isSelected);
            const filePath = RNFetchBlob.fs.dirs.DocumentDir + "/" + "Adhaar";

           // const s3Doc = await uploadToS3(fileUri, categoryList[selectedParentIndex].key, docname, ".jpg");

           // if (s3Doc.status == 200) {
            //  console.log('Document uploaded to s3 successfully!!!', s3Doc)
              var documentDetails: IDocumentProps = {
                id: `ID_VERIFICATION${Math.random()}${selectedDocument}${Math.random()}`,
                documentName: `${categoryList[selectedParentIndex].key} (${document[0]?.title})`,
                //  name: `${categoryList[selectedParentIndex].key} (${document[0]?.title})`,
                path: filePath,
              //  s3Path: s3Doc.fullPath,
                date: date?.date,
                time: date?.time,
                txId: "e4343434343434443",
                docType: "jpg",
                fileType: fileType,
                docExt: ".jpg",
                processedDoc: "",
                base64: fileUri?.base64,
                categoryType: categoryList[selectedParentIndex].key,
                docName: docname,
                isVerifyNeeded: false,
              };
              var DocumentList = documentsDetailsList?.responseData
                ? documentsDetailsList?.responseData
                : [];
              DocumentList.push(documentDetails);
              // 
              dispatch(saveDocuments(DocumentList));
  
              setsuccessResponse(true);
              setTimeout(() => {
                setsuccessResponse(false);
                navigation.navigate("Documents");
              }, 2000);
            // }

            // else {
            //   showPopup(
            //     "Error",
            //     "An error occurred while uploading the document. Please try again",
            //     [
            //       {
            //         text: "OK",
            //         onPress: () => setPopupVisible(false),
            //       },
            //     ]
            //   );
            // }

        
            // const s3uploadRes = await uploadToS3(fileUri, categoryList[selectedParentIndex].key, docname, ".jpg");
            // if(s3uploadRes=="200"){
            //   setsuccessResponse(true);
            //   setTimeout(() => {
            //     setsuccessResponse(false);
            //     navigation.navigate("Documents");
            //   }, 2000);
            //  }else{
            //   Alert.alert("Error", s3uploadRes.errorMessage || "An error occurred while uploading the document.");
            //  }
          } else {
            if (editDoc) {
              console.log("here", "here1");
              const index = documentsDetailsList?.responseData?.findIndex(
                (obj) => obj?.id === selectedItem?.id
              );
              if (selectedItem) {
                console.log("here", "here2");
                console.log("testing", "pass1");

                if (itemVerify) {
                  console.log("here", "here3");
                  console.log("testing", "pass2");

                  setsuccessResponse(true);
                  const document: any[0] = categoryList[
                    selectedParentIndex
                  ]?.value?.filter((data: any) => data.isSelected);
                  const obj = documentsDetailsList?.responseData[index];
                  obj.docName = docname;
                  obj.documentName = `${categoryList[selectedParentIndex].key} (${document[0]?.title})`;
                  obj.categoryType = categoryList[selectedParentIndex].key;
                  console.log("index===>", obj.categoryType);
                  dispatch(
                    updateDocuments(
                      documentsDetailsList?.responseData,
                      index,
                      obj
                    )
                  );
                  editS3Doc(selectedItem.fullPath, categoryList[selectedParentIndex].key, docname);
                  setTimeout(async () => {
                    setsuccessResponse(false);
                    const item = await AsyncStorage.getItem("flow");
                    if (item === "documentflow") {
                      navigation.navigate("RegisterScreen");
                    } else {
                      setIsPrceedForLivenessTest(false);
                      navigation.navigate("Documents");
                    }
                  }, 2000);

                  setIsPrceedForLivenessTest(true);
                } else {
                  console.log("here", "here4");
                  console.log("testing", "pass3");
                  setsuccessResponse(true);
                  const document: any[0] = categoryList[
                    selectedParentIndex
                  ]?.value?.filter((data: any) => data.isSelected);
                  const obj = documentsDetailsList?.responseData[index];
                  obj.docName = docname;
                  obj.documentName = `${categoryList[selectedParentIndex].key} (${document[0]?.title})`;
                  obj.categoryType = categoryList[selectedParentIndex].key;
                  console.log("index===>", obj.categoryType);
                  dispatch(
                    updateDocuments(
                      documentsDetailsList?.responseData,
                      index,
                      obj
                    )
                  );
                  editS3Doc(selectedItem.fullPath, categoryList[selectedParentIndex].key, docname);
                  setTimeout(async () => {
                    setsuccessResponse(false);
                    const item = await AsyncStorage.getItem("flow");
                    if (item === "documentflow") {
                      navigation.navigate("RegisterScreen");
                    } else {
                      setIsPrceedForLivenessTest(false);
                      navigation.navigate("Documents");
                    }
                  }, 2000);
                }
                setLoading(false);
              } else {
                setIsPrceedForLivenessTest(true);
                return;
              }
              console.log("testing", "pass4");

              setIsPrceedForLivenessTest(false);
            } else {
              console.log("here", "here5");

              setIsPrceedForLivenessTest(true);
            }
            // setIsPrceedForLivenessTest(true)
          }
        }
      }
    } else {
      showPopup(
        "OOPS!",
        "Please enter document name",
        [
          {
            text: "Cancel",
            onPress: () => setPopupVisible(false),
            style: "cancel",
          },
          {
            text: "OK",
            onPress: () => setPopupVisible(false),
          },
        ]
      );
    }
  };

  // const onpress = () => {
  //   if (docname?.length > 0) {
  //     setButton(true);
  //   } else {
  //     Alert.alert("OOPS!", "Please enter document name", [
  //       {
  //         text: "Cancel",
  //         onPress: () => {
  //           console.log("Cancel Pressed");
  //         },
  //         style: "cancel",
  //       },
  //       {
  //         text: "OK",
  //         onPress: () => {
  //           console.log("OK Pressed");
  //         },
  //       },
  //     ]);
  //   }
  // };

  useEffect(() => {
    getCategories(getCategoriesApi, {}, "GET");
    console.log("itemData", itemData);
    console.log("doc", docname);
  }, []);
  const getCategoryImages = (itemKey: string) => {
    console.log("categoryType+++++educate", itemKey);
    const getItems = SCREENS.HOMESCREEN.categoryList.filter(
      (itemFiltered, index) => {
        return itemFiltered.TITLE?.toLowerCase() === itemKey?.toLowerCase();
      }
    );
    if (!getItems[0]) {
      return "#D7EFFB";
    }
    return getItems[0];
  };
  useEffect(() => {
    console.log("datra", getCategoryData);

    if (getCategoryData) {
      var localCategories: any = [];

      Object.keys(getCategoryData).map((itemKey, indexOfKey) => {
        var InternalArray: { title: any; isSelected: boolean }[] = [];
        getCategoryData[itemKey].map((item: any) => {
          console.log("item==>*****))))", item);
          InternalArray.push({
            title: item,
            isSelected: typeItem === item ? true : item?.isSelected,
          });
        });
        if (selectedItem?.documentName?.startsWith(itemKey)) {
          setSelectedParentIndex(indexOfKey);
        }

        localCategories.push({
          key: itemKey,
          value: InternalArray,
          color: getCategoryImages(itemKey)?.COLOR,
          isSelected: selectedItem?.documentName?.startsWith(itemKey)
            ? true
            : false,
        });
      });

      setCategoryList(localCategories);
      // setCategoryList([...localCategories])
    }
  }, [getCategoryData]);

  const selectCategory = (selectedItem: string, selectedIndex: number) => {
    var localCategories = [];
    setSelectedParentIndex(selectedIndex);
    localCategories = categoryList.map((item: any, index: number) => {
      if (index === selectedIndex) {
        item.isSelected = true;
      } else {
        item.isSelected = false;
      }
      return item;
    });
    console.log("localCategories", localCategories);
    setCategoryList([...localCategories]);
    //
  };

  const selectCategoryChildren = (
    selectedItem: string,
    selectedIndex: number
  ) => {
    var localCategories = [];
    localCategories = categoryList.map((item: any, index: number) => {
      item.value.map((itemChildren: any, childrenIndex: number) => {
        if (childrenIndex === selectedIndex && index === selectedParentIndex) {
          console.log("item selected children====>", itemChildren.title);
          setselectedDocument(itemChildren.title);
          itemChildren.isSelected = true;
        } else {
          itemChildren.isSelected = false;
        }
        return itemChildren;
      });
      return item;
    });

    setCategoryList([...localCategories]);
    // setIsPrceedForLivenessTest(true);
  };

  useEffect(() => { }, []);

  const _renderItem = ({ item, index }: any) => {
    return (
      <TouchableOpacity onPress={() => selectCategory(item, index)}>
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: item.isSelected
                ? "rgba(184, 191, 241, 1)"
                : Screens.pureWhite,
            },
          ]}
        >
          <View style={{ flexDirection: "row" }}>
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: item.isSelected ? "green" : item.color,
                alignSelf: "center",
                marginHorizontal: 10,
                borderRadius: 2,
              }}
            >
              {item.isSelected && (
                <Image
                  style={{
                    tintColor: "#fff",
                    width: 8,
                    height: 10,
                    alignSelf: "center",
                  }}
                  source={LocalImages.tikImage}
                ></Image>
              )}

              {item?.isSelected && <View></View>}
            </View>
            <Text style={{ fontWeight: "bold" }}>{item.key}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const _renderItemDocuments = ({ item, index }: any) => {
    return (
      <TouchableWithoutFeedback
        onPress={() => selectCategoryChildren(item, index)}
      >
        <View style={styles.documentContainer}>
          <Card
            rightIconSrc={item?.isSelected && LocalImages.successTikImage}
            leftIconSrc={LocalImages.documentsImage}
            title={item?.title == "DL" ? "Driving License" : item?.title}
            style={[
              styles.cardContainer1,
              {
                backgroundColor: item?.isSelected
                  ? "rgba(184, 191, 241, 1)"
                  : Screens.pureWhite,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  };

  function docnameitem(value: any) {
    console.log("datavalue", value);
    setDocname(value);
  }

  return (
    <View style={styles.sectionContainer}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 0.37 }}>
            <Header
              leftIconSource={LocalImages.backImage}
              onpress={() => {
                _toggleDrawer();
              }}
              headingText={"Choose Category"}
              linearStyle={styles.linearStyle}
              containerStyle={{
                iconStyle: {
                  width: 15,
                  height: 15,
                },
              }}
            ></Header>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                position: "absolute",
                marginTop: 40,
                marginLeft: 20,
              }}
            >
              <Image
                source={LocalImages.backImage}
                style={{ height: 20, width: 20, resizeMode: "contain" }}
              />
            </TouchableOpacity>
            <View>
              <FlatList<any>
                numColumns={3}
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                data={categoryList}
                renderItem={_renderItem}
              />
            </View>
          </View>
          <View style={{ flex: 0.63 }}>
            {categoryList.length != 0 &&
              categoryList.some((item) => item.isSelected === true) && (
                <View style={{ marginTop: 5 }}>
                  <View style={{ flexDirection: "row" }}>
                    <GenericText
                      style={[
                        styles.categoryHeaderText,
                        { fontSize: 14, fontWeight: "700" },
                      ]}
                    >
                      {"DOCUMENT NAME"}
                    </GenericText>

                    <GenericText
                      style={{
                        alignSelf: "center",
                        color: "red",
                        marginLeft: -2,
                        fontSize: 20,
                      }}
                    >
                      {"*"}
                    </GenericText>
                  </View>
                  <TextInput
                    placeholder="Enter Document Name"
                    onChangeText={docnameitem}
                    value={docname}
                    style={{
                      borderWidth: 1,
                      borderColor: Screens.grayShadeColor,
                      margin: 16,
                      borderRadius: 8,
                      paddingLeft: 15,
                      height: 40,
                    }}
                  />
                </View>
              )}
            {categoryList.map((item: any, index: number) => {
              if (item.isSelected) {
                return (
                  <View>
                    {categoryList.length !== 0 ? (
                      <View>
                        <GenericText
                          style={[
                            styles.categoryHeaderText,
                            { fontSize: 14, fontWeight: "700" },
                          ]}
                        >
                          {"selectDoc"}
                        </GenericText>
                      </View>
                    ) : (
                      <></>
                    )}
                    <FlatList<any>
                      nestedScrollEnabled
                      scrollEnabled={false}
                      data={item?.value}
                      renderItem={_renderItemDocuments}
                    />
                    <View style={{ backgroundColor: Screens.pureWhite }}>
                      <Button
                        onPress={() => onSubmitAction()}
                        // onPress={() => onpress()}
                        disabled={button === "true" ? true : false}
                        style={{
                          buttonContainer: {
                            elevation: 5,
                            marginLeft: 15,
                            marginRight: 15,
                          },
                          text: {
                            color: Screens.pureWhite,
                          },
                          iconStyle: {
                            tintColor: Screens.pureWhite,
                          },
                        }}
                        title={"submitt"}
                      />
                    </View>
                  </View>
                );
              }
            })}
          </View>
        </View>
        <ModalView height={250} isModalVisible={isPrceedForLivenessTest}>
          <View
            style={{
              flex: 1,
              paddingHorizontal: 5,
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isEarthId()
                  ? Screens.colors.ScanButton.startColor
                  : "#fff",
                width: deviceWidth / 1.5,
              }}
            >
              <Image
                resizeMode="contain"
                style={[styles.logoContainer]}
                source={LocalImages.logoImage}
              ></Image>
            </View>

            <Button
              onPress={() => {
                setIsPrceedForLivenessTest(false);
                const document: any[0] = categoryList[
                  selectedParentIndex
                ]?.value?.filter((data: any) => data.isSelected);
                setTimeout(() => {
                  navigation.navigate("LivenessCameraScreen", {
                    fileUri,
                    selectedDocument: `${categoryList[selectedParentIndex].key} (${document[0]?.title})`,
                    pic,
                    itemData,
                    editDoc,
                    selectedItem,
                    docname,
                  });
                }, 100);
              }}
              style={{
                buttonContainer: {
                  elevation: 5,
                  marginHorizontal: 10,
                },
                text: {
                  color: Screens.pureWhite,
                  fontSize: 12,
                },
                iconStyle: {
                  tintColor: Screens.pureWhite,
                },
              }}
              title={"PROCEED FOR LIVENESS TEST"}
            ></Button>
          </View>
        </ModalView>
        <AnimatedLoader
          isLoaderVisible={isCategoryLoading || load}
          loadingText="Loading..."
        />
        <SuccessPopUp
          isLoaderVisible={successResponse}
          loadingText={"Document uploaded successfully"}
        />
      </ScrollView>
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
    backgroundColor: Screens.colors.background,
  },
  linearStyle: {
    height: 80,
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
  },
  categoryHeaderText: {
    marginHorizontal: 10,
    marginVertical: 5,
    color: "#000",
  },

  cardContainer: {
    padding: 8,
    backgroundColor: Screens.pureWhite,
    borderColor: Screens.grayShadeColor,
    justifyContent: "space-between",
    margin: 10,
    borderRadius: 8,

    borderWidth: 1,
  },
  cardContainer1: {
    padding: 3,
    backgroundColor: Screens.pureWhite,
    borderColor: Screens.grayShadeColor,

    margin: 5,
    borderRadius: 8,

    borderWidth: 1,
  },
  documentContainer: {
    marginHorizontal: 5,

    padding: 8,
    backgroundColor: Screens.pureWhite,
  },
  logoContainer: {
    width: 130,
    height: 130,
  },
});

export default categoryScreen;
