import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// import OpenFile from "react-native-doc-viewer";
import NetInfo from "@react-native-community/netinfo";
import Button from "../../components/Button";
import { LocalImages } from "../../constants/imageUrlConstants";
import { useFetch } from "../../hooks/use-fetch";
import { Screens } from "../../themes/index";
import {
  superAdminApi,
  uploadRegisterDocument,
} from "../../utils/earthid_account";
import PDFView from "react-native-view-pdf";
import Spinner from "react-native-loading-spinner-overlay/lib";
import Loader from "../../components/Loader/AnimatedLoader";
import { isEarthId } from "../../utils/PlatFormUtils";
import GenericText from "../../components/Text";
import { useIsFocused } from "@react-navigation/native";
import CustomPopup from "../../components/Loader/customPopup";

const DocumentPreviewScreen = (props: any) => {
  const { fileUri } = props?.route?.params;
  const itemData = props?.route?.params;
  const { type } = props?.route?.params;
  const { editDoc } = props?.route?.params;
  const { newdata } = props.route.params;
  const { loading, data, error, fetch: uploadRegDoc } = useFetch();
  const [documentResponseData, setDocumentResponse] = useState(undefined);
  const { fetch: getSuperAdminApiCall } = useFetch();
  const [loginLoading, setLoginLoading] = useState(false);
  const [successResponse, setsuccessResponse] = useState(false);
  const [key, setKey] = useState(Date.now());
  const [filePath, setFilePath] = useState();
  const pdfRef = useRef(null);
  const isFocused = useIsFocused();

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

  const resources = {
    file:
      Platform.OS === "ios"
        ? "documentDetails?.base64"
        : "/sdcard/Download/test-pdf.pdf",
    url: fileUri?.base64,
    base64: fileUri?.base64,
  };
  const resourceType = "base64";

  //console.log("this is file uri:", fileUri);
  useEffect(() => {
    if (error) {
      setLoginLoading(false);
      showPopup(
        "Alert",
        "Document not supported",
        [{ text: "OK", onPress: () => setPopupVisible(false) }]
      );
    }
  }, [error]);

  // function alertUploadDoc() {
  //   console.log("fileUri?.type===", fileUri?.type);
  //   if (type == "regDoc") {
  //     uploadDocumentImage();
  //   } else {
  //     if (fileUri?.type === "application/pdf") {
  //       uploadDoc("no");
  //     } else {
  //       Alert.alert(
  //         "Confirmation!",
  //         "Please confirm that this is a self-attested document",
  //         [
  //           {
  //             text: "Yes",
  //             onPress: () => {
  //               if (type == "regDoc") {
  //                 //  uploadDocumentImage();
  //                 console.log("cancel");
  //               } else {
  //                 NetworkConnect();
  //               }
  //             },
  //             style: "cancel",
  //           },
  //           {
  //             text: "No",
  //             onPress: () => {
  //               if (type == "regDoc") {
  //                 uploadDocumentImage();
  //               } else {
  //                 isNetworkConnect();
  //               }
  //               //  props.navigation.navigate("uploadDocumentsScreen")
  //             },
  //           },
  //         ],
  //         { cancelable: false }
  //       );
  //     }
  //   }
  // }

  const NetworkConnect = () => {
    NetInfo.fetch().then((state) => {
      console.log("isconnect", state.isConnected);
      if (!state.isConnected) {
        showPopup(
          "Network not connected",
          "Please check your internet connection and try again.",
          [{ text: "OK", onPress: () => setPopupVisible(false) }]
        );
      } else {
        uploadDoc("no");
      }
    });
  };

  const isNetworkConnect = () => {
    NetInfo.fetch().then((state) => {
      console.log("isconnect", state.isConnected);
      if (!state.isConnected) {
        showPopup(
          "Network not connected",
          "Please check your internet connection and try again.",
          [{ text: "OK", onPress: () => setPopupVisible(false) }]
        );
      } else {
        uploadDoc("yes");
      }
    });
  };

  const uploadDoc = async (selfAttested: string) => {
    let type = "qrRreader";

    if (!type == fileUri.type) {
      setFilePath(fileUri?.file?.uri);

      if (filePath) {
        props.navigation.navigate("DrawerNavigator", { fileUri });
      }
    } else {
      console.log("fileUri==>123vicky", fileUri?.type);
      const imageName = props?.route?.params?.imageName;
      props.navigation.navigate("categoryScreen", {
        fileUri,
        editDoc,
        fileType: fileUri?.type,
        selfAttested,
        imageName: imageName,
      });
      console.log("success==>", "Success");
    }
  };

  const goBack = () => {
    props.navigation.goBack();
  };

  // function uploadDocumentImage() {
  //   console.log("DocumentImage:::::", fileUri);

  //   if (type == "regDoc") {
  //     let image = {
  //       uri: fileUri.uri,
  //       name: fileUri.filename,
  //       type: fileUri.type,
  //     };
  //     try {
  //       console.log("image req=====", image);
  //       setLoginLoading(true);

  //       uploadRegDoc(uploadRegisterDocument, image, "FORM-DATA");

  //       // props.navigation.navigate("DrawerNavigator", { response });
  //     } catch (e) {
  //       setLoginLoading(false);
  //       console.log("DocumentError:::::", e);
  //       console.log("DocumentError:::::", "ERROR");
  //     }
  //   }
  // }
  useEffect(() => {
    getSuperAdminApiCall(superAdminApi, {}, "GET");
  }, []);

  // useEffect(() => {
  //   if (data) {
  //     if (data?.data) {
  //       setDocumentResponse(data?.data);
  //       createPayLoadFromDocumentData(data?.data);
  //     }
  //   }
  // }, [data]);
  const handlePressb64 = (type: string) => {
    showPopup(
      'Unsupported file',
      'The file is not supported',
      [{ text: 'OK', onPress: () => setPopupVisible(false) }]
    );
    // if (Platform.OS === "ios") {
    //   OpenFile.openDocb64(
    //     [
    //       {
    //         base64: fileUri?.base64,
    //         fileName: fileUri?.imageName,
    //         fileType: type === "application/msword" ? "doc" : "docx",
    //       },
    //     ],
    //     (error: any, url: any) => {
    //       if (error) {
    //         console.error(error);
    //       } else {
    //         console.log(url);
    //       }
    //     }
    //   );
    // } else {
    //   //Android
    //   OpenFile.openDocb64(
    //     [
    //       {
    //         base64: fileUri?.base64,
    //         fileName: fileUri?.imageName,
    //         fileType: type === "application/msword" ? "doc" : "docx",
    //         cache: true /*Use Cache Folder Android*/,
    //       },
    //     ],
    //     (error: any, url: any) => {
    //       if (error) {
    //         console.error(error);
    //       } else {
    //         console.log(url);
    //       }
    //     }
    //   );
    // }
  };
  // const createPayLoadFromDocumentData = async (documentResponseData: any) => {
  //   console.log(
  //     "slsls",
  //     documentResponseData?.ProcessedDocuments[0].ExtractedFields?.filter(
  //       (item: any) => item.Name === "FullName"
  //     )[0]
  //   );
  //   const username =
  //     documentResponseData?.ProcessedDocuments[0].ExtractedFields?.filter(
  //       (item: any) => item.Name === "FullName"
  //     )[0]?.Value;
  //   const trimmedEmail =
  //     documentResponseData?.ProcessedDocuments[0].ExtractedFields?.filter(
  //       (item: any) => item.Name === "FullName"
  //     )[0]?.Value +
  //     "ex" +
  //     Math.random() +
  //     "@gmail.com";
  //   await AsyncStorage.setItem("userDetails", username.toString());
  //   await AsyncStorage.setItem("flow", "documentflow");
  //   props.navigation.navigate("categoryScreen", { fileUri });
  // };

  useEffect(() => {
    setKey(Date.now());
    }, [isFocused]);

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

      {fileUri?.type === "application/pdf" ? (
        <View style={{ flex: 1, marginTop: 70 }}>
          <PDFView
            fadeInDuration={100.0}
            ref={pdfRef}
            key={key}
            style={{ flex: 1, height: Dimensions.get("window").height - 20 }}
            resource={resources[resourceType]}
            resourceType={resourceType}
            onLoad={() => console.log(`PDF rendered from ${resourceType}`)}
            onError={() => console.log("Cannot render PDF", error)}
          />
        </View>
      ) : fileUri?.type === "application/msword" ||
        fileUri?.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
        <View style={{ flex: 0.8 }}>
          <View style={{ alignSelf: "center", justifyContent: "center" }}>
            <Image
              resizeMode={"contain"}
              style={{
                width: 100,
                height: "50%",
              }}
              source={LocalImages.wordImage}
            ></Image>
          </View>
          <GenericText
            style={{
              textAlign: "center",
              paddingVertical: 5,
              fontWeight: "bold",
              fontSize: 16,
              color: "#fff",
            }}
          >
            {
              "To preview the .doc, .docx file please click on the preview button!"
            }
          </GenericText>
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Button
              onPress={() => handlePressb64(fileUri?.type)}
              style={{
                buttonContainer: {
                  elevation: 5,
                  width: 150,
                },
                text: {
                  color: Screens.pureWhite,
                },
                iconStyle: {
                  tintColor: Screens.pureWhite,
                },
              }}
              title={"Preview"}
            ></Button>
          </View>
        </View>
      ) : (
        <View style={{ flex: 0.8, alignSelf: "center" }}>
          <Image
            resizeMode={"contain"}
            style={{
              width: 330,
              height: "100%",
            }}
            source={{
              uri: editDoc == "editDoc" ? fileUri.base64 : fileUri.uri,
            }}
          ></Image>
        </View>
      )}

      <View
        style={{
          flex: 0.2,
          flexDirection: "row",
          paddingHorizontal: 10,
          justifyContent: "space-between",
        }}
      >
        <Button
          onPress={goBack}
          style={{
            buttonContainer: {
              elevation: 5,
              width: 150,
              backgroundColor: "transparent",
            },
            text: {
              color: Screens.colors.primary,
            },
            iconStyle: {
              tintColor: Screens.pureWhite,
            },
          }}
          title={"retakes"}
        ></Button>
        <Button
          onPress={NetworkConnect}
          style={{
            buttonContainer: {
              elevation: 5,
              width: 150,
            },
            text: {
              color: Screens.pureWhite,
            },
            iconStyle: {
              tintColor: Screens.pureWhite,
            },
          }}
          title={"uploads"}
        ></Button>
      </View>
      <Loader
        loadingText={
          isEarthId() ? "earthidgeneratesuccess" : "globalgeneratesuccess"
        }
        Status="status"
        isLoaderVisible={successResponse}
      ></Loader>
      <Spinner
        visible={loading}
        textContent={"Loading..."}
        textStyle={styles.spinnerTextStyle}
      />
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
  spinnerTextStyle: {
    color: "#fff",
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
});

export default DocumentPreviewScreen;
