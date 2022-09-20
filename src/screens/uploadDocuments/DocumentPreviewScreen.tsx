import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import Button from "../../components/Button";
import SuccessPopUp from "../../components/Loader";
import AnimatedLoader from "../../components/Loader/AnimatedLoader";
import { LocalImages } from "../../constants/imageUrlConstants";
import { useFetch } from "../../hooks/use-fetch";
import { Screens } from "../../themes/index";
import { uploadDocument, validateDocsApi } from "../../utils/earthid_account";
import { QRreader } from 'react-native-qr-decode-image-camera';

const DocumentPreviewScreen = (props: any) => {
  const { fileUri ,type} = props.route.params;
  const { value} = props.route.params;

  const { loading, data, error, fetch: postFormfetch } = useFetch();
  const [successResponse, setsuccessResponse] = useState(false);
  const[message,Setmessage]=useState("ooo")
  const[datas,SetData]=useState(null)
  const[source,setSource]=useState({})
  const [filePath, setFilePath] = useState();

  
  

  const uploadDoc = async () => {

    let type ="qrRreader"

    if(type==fileUri.type){
      console.log("Data===>",fileUri.file.uri +"/"+ fileUri.file.name)
      console.log("DataNAme===>", fileUri.file.uri)
      
        if(fileUri.file.uri){
        QRreader(fileUri.file.uri)
        .then((data:any) => {
         Setmessage("praveen")
         SetData(data)
         console.log("Dataname===>",data)
  
          setTimeout(() => {
            SetData(data)
            Setmessage("outt")
          }, 6000);
        })
        .catch((err: any)=> {
         console.log("DataError===>","ErrorRes")
         console.log("error==>",err)
        });
        
      }

    }
    else{

      const requestedData = {
        type: fileUri?.file?.type,
        name: fileUri?.file?.name,
        uri: fileUri?.file?.uri,
      };
      postFormfetch(uploadDocument, requestedData, "FORM-DATA").then(() => {
        props.navigation.navigate("categoryScreen", { fileUri });
      });
    }

  };

  const goBack=()=>{
     props.navigation.goBack()
   
  }



  useEffect(() => {
    console.log("requestedData", error);
    console.log("requestedData==>", fileUri.uri);
    console.log("requestedDataValue==>", fileUri.type);
    console.log("Data==>", datas);
    if (data) {
      setsuccessResponse(true);
      setTimeout(() => {
        setsuccessResponse(false);
        props.navigation.navigate("categoryScreen", { fileUri });
      }, 3000);
    }
  }, [data]);

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
      <View style={{ flex: 0.8, paddingHorizontal: 10, marginLeft: 20 }}>
        <Image
          resizeMode={"contain"}
          style={{
            width: 330,
            height: "100%",
          }}
          source={{ uri: fileUri.uri }}
        ></Image>
      </View>

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
          title={"ReTake"}
        ></Button>
        <Button
          onPress={uploadDoc}
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
          title={"Upload"}
        ></Button>
      </View>
      <AnimatedLoader
        isLoaderVisible={loading}
        loadingText="Uploading Documents..."
      />
      <SuccessPopUp
        isLoaderVisible={successResponse}
        loadingText={"Document Validated !"}
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
});

export default DocumentPreviewScreen;
