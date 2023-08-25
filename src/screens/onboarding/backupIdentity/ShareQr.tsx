import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  PermissionsAndroid,
  Alert,
  BackHandler,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import Header from "../../../components/Header";
import { SCREENS } from "../../../constants/Labels";
import { Screens } from "../../../themes";
import Loader from "../../../components/Loader";
import CameraRoll from "@react-native-community/cameraroll";
import QRCode from "react-native-qrcode-image";
import CryptoJS from "react-native-crypto-js";
import ImgToBase64 from "react-native-image-base64";
import ViewShot from "react-native-view-shot";
import RNFS from "react-native-fs";
import Button from "../../../components/Button";
import Share from "react-native-share";
import { AES_ENCRYPTION_SALT } from "../../../utils/earthid_account";
import GenericText from "../../../components/Text";
import { useAppSelector } from "../../../hooks/hooks";
import { LocalImages } from "../../../constants/imageUrlConstants";
import { isEarthId } from "../../../utils/PlatFormUtils";
import ImageResizer from "react-native-image-resizer";
import { generatePreSignedURL, uploadImageToS3, uploadJSONToS3, uploadPDFToS3 } from "../../../utils/awsSetup";
import { Colors } from "react-native/Libraries/NewAppScreen";
import RNFetchBlob from "rn-fetch-blob";


interface IHomeScreenProps {
  navigation?: any;
  route?: any;
}

const AuthBackupIdentity = ({ navigation, route }: IHomeScreenProps) => {
  const [mobileNumber, setmobileNumber] = useState();
  const [isLoading, setIsLoading] = useState(false);
  let [qrBase64, setBase64] = useState("");
  const [signedUrl, setPreSignedUrl] = useState(undefined);
  const [activityLoader, setActivityLoad] = useState(false);
  const userDetails = useAppSelector((state) => state.account);
  const [loading, setloading] = useState(false);
  const bucketName: any = userDetails?.responseUserSpecificBucket;
  const viewShot: any = useRef();

  let qrData = {
    accountId: userDetails?.responseData?.earthId,
  };
  // var encryptedString: any = CryptoJS.AES.encrypt(
  //   JSON.stringify(qrData),
  //   AES_ENCRYPTION_SALT
  // );
  // encryptedString = encryptedString.toString();

  const dwFile = async (file_url: any) => {
    await Share.open({ url: `data:image/png;base64,${file_url}` });
  };

  useEffect(()=>{
   getQRCode()
  },[])

  const getQRCode =async()=>{
   
    setActivityLoad(true);
    const selectedItem = route.params.selectedItem


    let type = selectedItem?.docType

    if(selectedItem?.isVc){
      console.log("neww","This is Vc");
      const imageName: any = selectedItem?.docName + "." + selectedItem?.docType;
      const objectKey = imageName; 

      let credData = selectedItem?.verifiableCredential

      const uploadedKey: any = await uploadJSONToS3(
        bucketName,
        `images/${objectKey}`,
        credData,
        ""
      );
     
      if (uploadedKey) {
        const objectKeys = `images/${imageName}`;
        const preSignedURL = await generatePreSignedURL(bucketName, objectKeys);
  
  
        if (preSignedURL) {
          setPreSignedUrl(preSignedURL);
        } else {
  
  
          Alert.alert("Error", "There is a technical issue, please try again later.");
        }
      } else {
  
        Alert.alert("Error", "There is a technical issue, please try again later.");
      }
  

    }
    
    else if(type === "pdf"){
      console.log("neww","this is pdf type");
      console.log("newPdf",selectedItem?.typePDF);
      const imageName: any = selectedItem?.docName + "." + selectedItem?.docType;
      const pdfFile = selectedItem?.typePDF
      const pdfFilePath = RNFetchBlob.fs.dirs.CacheDir +"/"+imageName;
      const response = await fetch(pdfFile);
      const blob = await response.blob();

      const objectKey = imageName; // Replace with your desired object key
      const uploadedKey: any = await uploadPDFToS3(
        bucketName,
        `images/${objectKey}`,
        blob
      );
     
      if (uploadedKey) {
        const objectKeys = `images/${imageName}`;
        const preSignedURL = await generatePreSignedURL(bucketName, objectKeys);
  
  
        if (preSignedURL) {
          setPreSignedUrl(preSignedURL);
        } else {
  
  
          Alert.alert("Error", "There is a technical issue, please try again later.");
        }
      } else {
  
        Alert.alert("Error", "There is a technical issue, please try again later.");
      }


    }


    else if(selectedItem?.isLivenessImage){
      console.log("neww","this is Liveness image type");
      const imageName: any = selectedItem?.docName + "." + selectedItem?.docType;
      const base64Images = await  ImageResizer.createResizedImage(
          `${selectedItem?.base64}`,
          800, // target width
          800, // target height
          'JPEG', // format (you can adjust this)
          80, // quality (adjust this)
        );
    
        const base64Image = await RNFS.readFile(base64Images.uri, 'base64');
    
        // console.log("base64Images",base64Images);      
    
        const objectKey = imageName; // Replace with your desired object key
        const uploadedKey: any = await uploadImageToS3(
          bucketName,
          `images/${objectKey}`,
          base64Image,
          ""
        );
       
        if (uploadedKey) {
          const objectKeys = `images/${imageName}`;
          const preSignedURL = await generatePreSignedURL(bucketName, objectKeys);
    
    
          if (preSignedURL) {
            setPreSignedUrl(preSignedURL);
          } else {
    
    
            Alert.alert("Error", "There is a technical issue, please try again later.");
          }
        } else {
    
          Alert.alert("Error", "There is a technical issue, please try again later.");
        }
      


    }


    
    else{
      console.log("neww","this is image type");
      const imageName: any = selectedItem?.docName + "." + selectedItem?.docType;
      const base64Images = await  ImageResizer.createResizedImage(
          `data:image/jpeg;base64,${selectedItem?.base64}`,
          800, // target width
          800, // target height
          'JPEG', // format (you can adjust this)
          80, // quality (adjust this)
        );
    
        const base64Image = await RNFS.readFile(base64Images.uri, 'base64');
    
        // console.log("base64Images",base64Images);      
    
        const objectKey = imageName; // Replace with your desired object key
        const uploadedKey: any = await uploadImageToS3(
          bucketName,
          `images/${objectKey}`,
          base64Image,
          ""
        );
       
        if (uploadedKey) {
          const objectKeys = `images/${imageName}`;
          const preSignedURL = await generatePreSignedURL(bucketName, objectKeys);
    
    
          if (preSignedURL) {
            setPreSignedUrl(preSignedURL);
          } else {
    
    
            Alert.alert("Error", "There is a technical issue, please try again later.");
          }
        } else {
    
          Alert.alert("Error", "There is a technical issue, please try again later.");
        }
      
    }
  
      setActivityLoad(false);
  }

  const capturePicture = () => {
    viewShot.current.capture().then(async (imageData: any) => {
        await Share.open({
            url: imageData,
          });
    });
  };

  const requestExternalStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        // {
        //     title: 'Earth Id Storage Permission',
        //     message: 'Earth Id needs access to your storage ' +
        //         'so you can save your photos',
        // },
      );
      return granted == "granted"
        ? true
        : granted == "never_ask_again"
        ? securityModalPopup()
        : securityModalPopup();
    } catch (err) {
      console.error("Failed to request permission ", err);
      return false;
    }
  };

  const securityModalPopup = () => {
    Alert.alert(
      "Device Permission",
      "To grant Device id you need to all the app permission from (Setting > App > Earth Id > Permission)",
      [
        // {
        //   text: 'Cancel',
        //   onPress: () => console.log('Cancel'),
        //   style: 'cancel',
        // },
        { text: "OK", onPress: () => BackHandler.exitApp() },
      ],
      { cancelable: false }
    );
  };

  useEffect(() => {
    console.log("route==>", route);
  }, []);

  return (
    <View style={styles.sectionContainer}>
                  {activityLoader && signedUrl ===undefined ?
                  <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator
            size={'large'}
            color={'blue'}
          ></ActivityIndicator></View>:    <ScrollView contentContainerStyle={styles.sectionContainer}>
          <Header
            isLogoAlone={true}
            headingText={
              'Information Sharing'
            }
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: "absolute",
              marginTop: 38,
              marginLeft: 20,
            }}
          >
            <Image
              source={LocalImages.backImage}
              style={{
                height: 20,
                width: 20,
                resizeMode: "contain",
                tintColor: isEarthId() ? Screens.pureWhite : Screens.black,
              }}
            />
          </TouchableOpacity>
          <View style={styles.category}>
            <View>
              <GenericText
                style={[
                  styles.categoryHeaderText,
                  {
                    fontSize: 14,
                    fontWeight: "500",
                    textAlign: "center",
                    color: Screens.black,
                  },
                ]}
              >
                'Please share this QR code only with the intended recipient, as this will provide access to your information. You can also share this QR code with the intended recipient using the "Share QR Code" button'
              </GenericText>
            </View>
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <ViewShot
                ref={viewShot}
                captureMode="update"
                onCapture={() => {
                  // console.log('on capture image response', res)
                }}
                options={{ format: "jpg", quality: 0.8 }}
              >
                <QRCode
                  getBase64={(base64: string) => {
                    qrBase64 = base64;
                    setBase64(base64);
                  }}
                  value={signedUrl}
                  size={250}
                />
              </ViewShot>
            </View>
            <Button
              onPress={capturePicture}
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
              title={"Share QR code"}
            ></Button>
       </View>
        </ScrollView>
}
   
  
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flexGrow: 1,
    backgroundColor: Screens.colors.background,
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
    marginHorizontal: 20,
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
    padding: 10,
    marginTop: -160,
    marginHorizontal: 15,
    elevation: 5,
    borderRadius: 10,
    flex: 0.7,
    justifyContent: "space-between",
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
  },
});

export default AuthBackupIdentity;