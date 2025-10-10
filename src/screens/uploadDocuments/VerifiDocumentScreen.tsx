import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import RNFetchBlob from "rn-fetch-blob";

import Button from "../../components/Button";
import Header from "../../components/Header";
import SuccessPopUp from "../../components/Loader";
import AnimatedLoader from "../../components/Loader/AnimatedLoader";
import { LocalImages } from "../../constants/imageUrlConstants";
import { CreateHistory } from "../../utils/earthid_account";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { useFetch } from "../../hooks/use-fetch";
import {
  getHistory,
  saveDocuments,
  updateDocuments,
} from "../../redux/actions/authenticationAction";
import { Screens } from "../../themes/index";
import {
  cryptoTransferApi,
  facialDataLivenessAPI,
  MD5,
  selfieeverifyAPI,
} from "../../utils/earthid_account";
import { dateTime } from "../../utils/encryption";
import GenericText from "../../components/Text";

export interface IDocumentProps {
  id: string;
  name: string;
  path: string;
  s3Path: string;
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
  fullPath: any;
}
const VerifiDocumentScreen = (props: any) => {
  const { uploadedDocuments } = props.route.params;
  const { pic } = props.route.params;
  const { editDoc, selectedItem, docname } = props?.route?.params;
  const { faceImageData, selectedDocument } = props.route.params;
  const { loading, data, error, fetch } = useFetch();
  const userDetails = useAppSelector((state) => state.account);
  const getHistoryReducer = useAppSelector((state) => state.getHistoryReducer);
  console.log("getHistoryReducer===>", getHistoryReducer);
  const {
    loading: documentaDDINGerror,
    data: DataAdded,
    error: documentAddedError,
    fetch: AddDocumehtfetch,
  } = useFetch();
  console.log("picLOG", editDoc);
  console.log("picLOG", docname);

  const [load, setLoad] = useState(false);
  const dispatch = useAppDispatch();
  const [successResponse, setsuccessResponse] = useState(false);
  let documentsDetailsList = useAppSelector((state) => state.Documents);
  var base64Icon = `data:image/png;base64,${faceImageData?.base64}`;
  var uploadedDocumentsBase64 = `data:image/png;base64,${uploadedDocuments?.base64}`;
  var name: any = "";
  const [verifyVcCred, setverifyVcCred] = useState<any>();
  const [dis, SetDis] = useState(false);

  useEffect(() => {
    getVcdata();
  }, []);

  const getVcdata = async () => {
    const getvcCred: any = await AsyncStorage.getItem("vcCred");
    const parseData = JSON.parse(getvcCred);
    console.log("parseData", parseData);
    setverifyVcCred(parseData);
  };

  const verifiAPICall =()=>{
    const apiUrl = 'https://stage-apiv2.myearth.id/user/liveness';
const selfieBase64 = base64Icon; // Replace with your actual base64-encoded selfie data

const docPhotoUrl = 'https://prod.idscan.cloud/IDScanEnterpriseSvc/Journey/GetImage?id=0dfb14df-f0fd-485b-a1cc-b80742865ebe&role=OutputWhiteImage';

const headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
};

const formData = new FormData();
formData.append('selfieBase64', selfieBase64);
formData.append('docPhotoUrl', docPhotoUrl);

fetch(apiUrl, {
  method: 'POST',
  headers: headers,
  body: formData,
})
  .then((response: { json: () => any; }) => response.json())
  .then((data: any) => {
    // Handle the response data
    console.log(data);
  })
  .catch((error: any) => {
    // Handle errors
    console.error('Error:', error);
  });

  }

  const validateImages = () => {
    SetDis(true);
    setLoad(true);
    const payLoad = {
      eventValue: selectedDocument,
      eventType: "ID_VERIFICATION",
      userId: userDetails?.responseData?.Id,
      publicKey: userDetails?.responseData?.publicKey,
    };
   // verifiAPICall()
    setTimeout(() => {
      const index = documentsDetailsList?.responseData?.findIndex(
        (obj: { id: any; }) => obj?.id === selectedItem?.id
      );
      console.log("index", index);
      if (selectedItem) {
        console.log("indexData", "index1");
        setsuccessResponse(true);

        const obj = documentsDetailsList?.responseData[index];
        obj.documentName = selectedDocument;
        obj.categoryType =
          selectedDocument && selectedDocument?.split("(")[0]?.trim();
        dispatch(
          updateDocuments(documentsDetailsList?.responseData, index, obj)
        );
        setTimeout(async () => {
          setsuccessResponse(false);
          const item = await AsyncStorage.getItem("flow");
          if (item === "documentflow") {
            props.navigation.navigate("RegisterScreen");
          } else {
            //   props.navigation.navigate("Documents");
          }
        }, 2000);
      } else {
        console.log("indexData", "index2");

        var date = dateTime();
        const filePath = RNFetchBlob.fs.dirs.DocumentDir + "/" + "Adhaar";
        var documentDetails: IDocumentProps = {
          id: `ID_VERIFICATION${Math.random()}${selectedDocument}${Math.random()}`,
          // name: selectedDocument,
          documentName: selectedDocument,
          path: filePath,
          date: date?.date,
          time: date?.time,
          txId: data?.result,
          docType: "jpg",
          docExt: ".jpg",
          processedDoc: "",
          base64: uploadedDocumentsBase64,
          categoryType: selectedDocument && selectedDocument?.split("(")[0]?.trim(),
          docName: docname,
          isVerifyNeeded: true,
          isLivenessImage: "livenessImage",
          name: "",
          vc: undefined,
          isVc: false,
          signature: undefined,
          typePDF: undefined,
          verifiableCredential: undefined
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
          docType: verifyVcCred?.type[1],
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
          verifiableCredential: verifyVcCred,
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
        dispatch(saveDocuments(DocumentList));
        setsuccessResponse(true);
        getHistoryReducer.isSuccess = false;
        setTimeout(async () => {
          setsuccessResponse(false);
          const item = await AsyncStorage.getItem("flow");
          if (item === "documentflow") {
            props.navigation.navigate("RegisterScreen");
          } else {
            // generateVc()
            props.navigation.navigate("Documents");
          }
        }, 2000);
      }
    }, 200);
    setLoad(false);
  };

  function generateVc() {
    var date = dateTime();
    var documentDetails: IDocumentProps = {
      id: `ID_VERIFICATION${Math.random()}${"selectedDocument"}${Math.random()}`,
      name: "Acknowledgement Token",
      path: "filePath",
      date: date?.date,
      time: date?.time,
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
      documentName: "",
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
  }

  if (getHistoryReducer?.isSuccess) {
    setsuccessResponse(true);
    getHistoryReducer.isSuccess = false;
    setTimeout(() => {
      setsuccessResponse(false);
      props.navigation.navigate("Documents");
    }, 2000);
  }

  const navBack = () => {
    props.navigation.goBack();
    setLoad(false);
  };

  useEffect(() => {
    console.log("picLOG", docname);
  });

  // useEffect(()=>{
  //   getItem()
  //   },[])

  //   const getItem=async()=>{
  //     const item =await  AsyncStorage.getItem("editDoc");
  //     if(item=='editDoc'){
  //       name =await  AsyncStorage.getItem("userDetails");

  //     }
  //   }
  console.log("selectedItem?.base64 ", selectedItem);
  return (
    <View style={styles.sectionContainer}>
      <Header
        isLogoAlone={true}
        linearStyle={styles.linearStyle}
        containerStyle={{
          iconStyle: {
            width: 150,
            height: 80,
            marginTop: 0,
          },
          iconContainer: styles.alignCenter,
        }}
      ></Header>
      {/* <View style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}>
        <TouchableOpacity onPress={() => props.navigation.goBack()}>
          <Image
            resizeMode="contain"
            style={[styles.logoContainer]}
            source={LocalImages.closeImage}
          ></Image>
        </TouchableOpacity>
      </View> */}

      <GenericText
        style={{
          color: "black",
          fontWeight: "bold",
          fontSize: 20,
          alignSelf: "center",
          marginTop: 15,
        }}
      >
        {"livetest"}
      </GenericText>

      <View style={styles.dashedLine}>
        {selectedItem && selectedItem?.base64 ? (
          <Image
            resizeMode={"contain"}
            style={{
              width: 330,
              height: "100%",
            }}
            source={{
              uri: selectedItem?.base64,
            }}
          ></Image>
        ) : (
          <Image
            resizeMode={"contain"}
            style={{
              width: 330,
              height: "100%",
            }}
            source={{
              uri: pic ? pic.uri : uploadedDocumentsBase64,
            }}
          ></Image>
        )}
      </View>

      <View style={styles.dashedLine}>
        <Image
          resizeMode={"contain"}
          style={{
            width: 330,
            height: "100%",
          }}
          source={{ uri: base64Icon }}
        ></Image>
      </View>

      <TouchableOpacity onPress={() => navBack()}>
        <View style={{ flexDirection: "row", alignSelf: "center" }}>
          <Image
            source={LocalImages.cam}
            style={{
              width: 15,
              height: 15,
              alignSelf: "center",
              tintColor: Screens.colors.primary,
            }}
          />
          <GenericText
            style={[
              {
                fontSize: 13,
                color: Screens.colors.primary,
                fontWeight: "500",
                textDecorationLine: "underline",
                marginLeft: 6,
              },
            ]}
          >
            {"retakephoto"}
          </GenericText>
        </View>
      </TouchableOpacity>

      <View
        style={{
          flex: 0.17,
          flexDirection: "row",
          paddingHorizontal: 5,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={validateImages}
          disabled={dis ? true : false}
          style={{
            elevation: 5,
            margin: 20,
            width: 300,
            height: 50,
            borderRadius: 50,
            backgroundColor: Screens.colors.primary,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <GenericText style={{ color: "#fff" }}>{"submt"}</GenericText>
        </TouchableOpacity>
      </View>

      <AnimatedLoader
        isLoaderVisible={loading || getHistoryReducer?.isLoading}
        loadingText={"verifying"}
      />
      <SuccessPopUp
        isLoaderVisible={successResponse}
        loadingText={"verificationsuccess"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: Screens.pureWhite,
  },
  preview: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
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
  dashedLine: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderRadius: 10,
    flex: 0.4,

    marginHorizontal: 20,
    marginVertical: 20,
  },
  linearStyle: {
    height: 80,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  logoContainer: {
    width: 15,
    height: 15,
    tintColor: "#fff",
  },
  alignCenter: { justifyContent: "center", alignItems: "center" },
});

export default VerifiDocumentScreen;
