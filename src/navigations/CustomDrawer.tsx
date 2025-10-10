import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  FlatList,
  Alert,
  Linking,
  Platform,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from "react-native-gesture-handler";

import { Screens } from "../themes/index";
import { values } from "lodash";
import { LocalImages } from "../constants/imageUrlConstants";
import { ABOUT_ROUTES } from "../constants/Routes";
import {
  StackActions,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import GenericText from "../components/Text";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import { FlushData, saveDocuments } from "../redux/actions/authenticationAction";
import { useFetch } from "../hooks/use-fetch";
import { EARTHID_DEV_BASE } from "../constants/URLContstants";
import { isEarthId } from "../utils/PlatFormUtils";
import Header from "../components/Header";
import { deleteSingleBucket } from "../utils/awsSetup";
import ReactNativeBiometrics, { BiometryTypes } from "react-native-biometrics";
import TouchID from "react-native-touch-id";
import CustomPopup from "../components/Loader/customPopup";
import BottomSheet from "../components/Bottomsheet";
import AnimatedLoader from "../components/Loader/AnimatedLoader";
import axios from "axios";
import CustomPopupIDV from "../components/Loader/idvPopup";

const CustomDrawer = (props: any) => {
 
console.log('Drawer open 1')
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

  const [isModalIDVVisible, setIsModalIDVVisible] = useState(false);
  const [code, setCode] = useState("");
  const [isIdvLoading, setIDVLoading] = useState(false);

  const dispatch = useAppDispatch();
  const userDetails = useAppSelector((state) => state.account);
  const {
    loading,
    data: deletedRespopnse,
    error,
    fetch: deleteFetch,
  } = useFetch();

  const clientId = 'earthid-client-12345';
const apiKey = '8f8e28b6-7a6a-4ad2-9ef7-b2c2d10e6a4e';

  const aboutList = values(ABOUT_ROUTES).map(
    ({
      CARD: card,
      TITLE: title,
      SCREEN: route,
      COLOR: color,
      URI: uri,
      RIGHT_ICON: rightUri,
    }: any) => ({
      card,
      title,
      route,
      uri,
      rightUri,
      color,
    })
  );
  const rnBiometrics = new ReactNativeBiometrics();
  const navigation = useNavigation();

  const optionalConfigObject = {
    title: "Authentication Required", // Android
    imageColor: "#2AA2DE", // Android
    imageErrorColor: "#ff0000", // Android
    sensorDescription: "Touch sensor", // Android
    sensorErrorDescription: "Failed", // Android
    cancelText: "Cancel", // Android
    fallbackLabel: "Show Passcode", // iOS (if empty, then label is hidden)
    unifiedErrors: false, // use unified error messages (default false)
    passcodeFallback: false, // iOS - allows the device to fall back to using the passcode, if faceid/touch is not available. this does not mean that if touchid/faceid fails the first few times it will revert to passcode, rather that if the former are not enrolled, then it will use the passcode.
  };

  const aunthenticateBioMetricInfo = () => {
    if (Platform.OS === "ios") {
      rnBiometrics.isSensorAvailable().then((resultObject) => {
        let epochTimeSeconds = Math.round(
          new Date().getTime() / 1000
        ).toString();
        let payload = epochTimeSeconds + "some message";
        const { available, biometryType } = resultObject;
        if (available && biometryType === BiometryTypes.FaceID) {
          rnBiometrics
            .simplePrompt({ promptMessage: "Confirm fingerprint" })
            .then((resultObject) => {
              const { success } = resultObject;
              console.log("resultObject===>", resultObject);
              if (success) {
                navigation.dispatch(StackActions.replace("PasswordCheck"));
              } else {
                console.log("user cancelled biometric prompt");
              }
            })
            .catch(() => {
              console.log("biometrics failed");
            });
        } else {
          navigation.dispatch(StackActions.replace("FaceCheck",{
            type:"true"
          }));
        }
      });
    } else {
      TouchID.isSupported(optionalConfigObject)
        .then(async (biometryType) => {
          console.log("biometryType123-->", biometryType);
          // Success code
          if (biometryType === "FaceID") {
          } else {
            TouchID.authenticate("", optionalConfigObject)
              .then(async (success: any) => {
                console.log("success", success);
                const getItem = await AsyncStorage.getItem("passcode");
                if (getItem) {
                  //navigation.dispatch(StackActions.replace("PasswordCheck"));
                  navigation.navigate("PasswordCheck", { type: "true" });
                } else {
                  navigation.dispatch(StackActions.replace("DrawerNavigator"));
                }
              })
              .catch((e: any) => {
                aunthenticateBioMetricInfo();
              });
            console.log("TouchID is supported.");
          }
        })
        .catch((error) => {
          // Failure code
          console.log(error);
        });
    }
  };
  const deleteuserData = async () => {
    const paramsUrl = `${EARTHID_DEV_BASE}/user/deleteUser?earthId=${userDetails?.responseData?.earthId}&publicKey=${userDetails?.responseData?.publicKey}`;
    await AsyncStorage.removeItem("passcode");
    await AsyncStorage.removeItem("fingerprint");
    const requestBoady = {
      publicKey: userDetails?.responseData?.publicKey,
    };

    deleteFetch(paramsUrl, requestBoady, "DELETE");
    // const bucketName = `idv-sessions-${userDetails?.username.toLowerCase()}`;
    // deleteSingleBucket(bucketName);
  //   await AsyncStorage.removeItem("apiCalled");
  //   await AsyncStorage.removeItem("signatureKey");
  //  // Alert.alert("Hiiiii=>,deleteuserData");
  //  await AsyncStorage.clear(); // Clear all AsyncStorage data
  //   console.log("All AsyncStorage data cleared successfully.");

  // Log keys before clear
  const keysBefore = await AsyncStorage.getAllKeys();
  console.log("🔑 Keys before clear:", keysBefore);

  // Clear everything
  await AsyncStorage.clear();

  const keysAfter = await AsyncStorage.getAllKeys();
  console.log("✅ Keys after clear:", keysAfter);

// ✅ Clear Redux document list
dispatch(saveDocuments([]));

    // Dispatch action to clear DocumentList in Redux
    // dispatch(saveDocuments([])); // Clear DocumentList by setting it to an empty array
    // console.log("Redux DocumentList cleared.");

    setTimeout(() => {
      navigation.dispatch(StackActions.replace("AuthStack"));
    }, 1000);
  };

  const fingerwopasscode = () => {
    if (Platform.OS === "ios") {
      rnBiometrics.isSensorAvailable().then((resultObject) => {
        let epochTimeSeconds = Math.round(
          new Date().getTime() / 1000
        ).toString();
        let payload = epochTimeSeconds + "some message";
        const { available, biometryType } = resultObject;
        if (available && biometryType === BiometryTypes.FaceID) {
          rnBiometrics
            .simplePrompt({ promptMessage: "Confirm fingerprint" })
            .then((resultObject) => {
              const { success } = resultObject;
              console.log("resultObject===>", resultObject);
              if (success) {
                navigation.dispatch(
                  StackActions.replace("PasswordCheck", { type: "true" })
                );
              } else {
                console.log("user cancelled biometric prompt");
              }
            })
            .catch(() => {
              console.log("biometrics failed");
            });
        } else {
          navigation.dispatch(StackActions.replace("FaceCheck",{
            type:"true"
          }));
        }
      });
    } else {
      TouchID.isSupported(optionalConfigObject)
        .then(async (biometryType) => {
          console.log("biometryType123-->", biometryType);
          // Success code
          if (biometryType === "FaceID") {
          } else {
            TouchID.authenticate("", optionalConfigObject)
              .then(async (success: any) => {
                console.log("success", success);
                deleteuserData()
              })
              .catch((e: any) => {
                aunthenticateBioMetricInfo();
              });
            console.log("TouchID is supported.");
          }
        })
        .catch((error) => {
          // Failure code
          console.log(error);
        });
    }
  };

  const checkAuth = async () => {
    const fingerPrint = await AsyncStorage.getItem("fingerprint");
    const passcode = await AsyncStorage.getItem("passcode");
    const FaceID = await AsyncStorage.getItem("FaceID");

    console.log("FaceID===>", FaceID);
    console.log("fingerprint===>", fingerPrint);
    console.log("passcode===>", passcode);

    if (fingerPrint) {
      if (fingerPrint && passcode) {
        aunthenticateBioMetricInfo();
      } else {
        fingerwopasscode();
      }
    } else if (FaceID) {
      if (FaceID && passcode) {
        navigation.dispatch(StackActions.replace("FaceCheck",{
          type:"true"
        }));
      } else {
        navigation.dispatch(StackActions.replace("FaceCheck",{
          type:"true"
        }));
      }
      // navigation.dispatch(StackActions.replace("FaceCheck"));
    } else if (passcode) {
      navigation.dispatch(
        StackActions.replace("PasswordCheck", {
          type: "true",
        })
      );
    } else {
      navigation.dispatch(StackActions.replace("AuthStack"));
      //Alert.alert('hi')
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
          'client-id': clientId,
          'x-api-key': apiKey, 
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
        Alert.alert("Success", "Code verified.");
  await updateFeatureFlag(user_id, "IDV", "true", "1")
  await AsyncStorage.setItem("user_id", user_id);
  await AsyncStorage.setItem("setIDVFlag", "true");
        setIsModalIDVVisible(false);
        return
      } else {
        // Code is invalid
        setIsModalIDVVisible(false);
        Alert.alert("Error", "Invalid code. Please try again.");
        return
      }
    } catch (error) {
      console.error("Verification Error:", error);
      setIsModalIDVVisible(false);
      Alert.alert("Error", "Failed to verify the code. Please try again later.");
      return
    } finally {
     // setIDVLoading(false);
     setIsModalIDVVisible(false);
    }
  };

  const enterCode = async () => {
    setIsModalIDVVisible(true)
  }

  const _navigateAction = async (item: any) => {
    if (item.route === "Logout") {
      const bucketName = `idv-sessions-${userDetails?.username.toLowerCase()}`;
      deleteSingleBucket(bucketName);
      dispatch(FlushData()).then(async () => {
        await AsyncStorage.removeItem("passcode");
        await AsyncStorage.removeItem("fingerprint");
        await AsyncStorage.removeItem("FaceID");
        await AsyncStorage.removeItem("pageName");
        await AsyncStorage.removeItem("profilePic");
        await AsyncStorage.removeItem("vcCred");
        props.navigation.dispatch(StackActions.replace("AuthStack"));
      });
    } else if (item.route === "delete") {
      // await AsyncStorage.removeItem("passcode");
      // await AsyncStorage.removeItem("fingerprint");
      // await AsyncStorage.removeItem("FaceID");
      // await AsyncStorage.removeItem("pageName");
      // await AsyncStorage.removeItem("profilePic");
      // await AsyncStorage.removeItem("vcCred");
      // // const bucketName = `idv-sessions-${userDetails?.username.toLowerCase()}`;
      // // deleteSingleBucket(bucketName)
      // await AsyncStorage.removeItem("apiCalled");
      deleteUser();
    }else if (item.route === "code") {
      
      enterCode();
    } else if (item.route === "about") {
      Linking.openURL(
        isEarthId()
          ? "https://www.myearth.id/about/company"
          : "https://globalidiq.com/about/"
      );
    } else if (item.route === "terms") {
      // Linking.openURL(
      //   isEarthId() ?
      //    "https://www.myearth.id/privacy":"https://globalidiq.com/terms-of-use-3/"
      // );
      Linking.openURL(
        isEarthId()
          ? "https://www.myearth.id/privacy"
          : "https://globalidiq.com/terms-of-use-3/"
      );
    } else {
      props.navigation.navigate(item.route, { type: item.route });
    }

   // console.log("item====>", item);
  };

  console.log("deletedRespopnse==>", deletedRespopnse);
  const isFocused = useIsFocused();

  // useEffect(() => {
  //   if (deletedRespopnse) {
  //     dispatch(FlushData()).then(async () => {
  //       //  await AsyncStorage.removeItem("passcode");
  //       await AsyncStorage.removeItem("fingerprint");
  //       await AsyncStorage.removeItem("FaceID");
  //       await AsyncStorage.removeItem("pageName");
  //       await AsyncStorage.removeItem("profilePic");
  //       //await AsyncStorage.removeItem("signatureKey");
  //       // await AsyncStorage.removeItem("apiCalled");
  //       const bucketName = `idv-sessions-${userDetails?.username?.toLowerCase()}`;
  //       await deleteSingleBucket(bucketName);
  //       Alert.alert("delete ayduchu");
  //       props.navigation.dispatch(StackActions.replace("AuthStack"));
  //     });
  //   }
  // }, [deletedRespopnse, isFocused]);

  const _toggleDrawer = () => {
    console.log('Drawer open 2')
    props.navigation.closeDrawer();
  };
  const deleteUser = () => {
    const deletId = isEarthId()
      ? "Are you sure you want to delete your EarthID? Once deleted you won't be able to recover it later."
      : "Are you sure you want to delete your GlobaliD? Once deleted you won't be able to recover it later.";
    
    showPopup(
      "Delete Identity?",
      deletId,
      [
        {
          text: "Yes",
          onPress: async () => {
            await checkAuth();
          },
        },
        {
          text: "Cancel",
          onPress: () => {
            setPopupVisible(false);
          },
        },
      ]
    );
  };
  

  const _signOutAsync = () => {
    Alert.alert(
      "Delete Identity?",
      "Are you sure you want to delete your EarthId? Once deleted you won't be able to recover it later.",
      [
        {
          text: "Yes",
          onPress: async () => {
            // dispatch(FlushData()).then(() => {
            //   props.navigation.dispatch(StackActions.replace("AuthStack"));
            // });
            //deleteuserData();
          },
          style: "cancel",
        },
        {
          text: "No",
          onPress: async () => {},
        },
      ],
      { cancelable: false }
    );
  };
  const _renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => _navigateAction(item)}>
      <View
        style={{
          flexDirection: "row",
          flex: 1,
          margin: 10,
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row" }}>
          <View
            style={[styles.avatarContainer, { backgroundColor: item.color }]}
          >
            <Image
              resizeMode="contain"
              style={styles.avatarImageContainer}
              source={item.uri}
            ></Image>
          </View>
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <GenericText
              style={[
                {
                  fontSize: 14,
                  marginHorizontal: 10,

                  color: Screens.black,
                  fontWeight: "500",
                },
              ]}
            >
              {item.title}
            </GenericText>
          </View>
        </View>
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Image
            resizeMode="contain"
            style={styles.avatarImageContainer}
            source={item.rightUri}
          ></Image>
        </View>
      </View>
    </TouchableOpacity>
  );
  const _keyExtractor = ({ title }: any) => title.toString();

  useEffect(() => {});

  return (
    <View style={styles.sectionContainer}>
      <Header
        leftIconSource={LocalImages.logoImage}
        actionIcon={props.route == "undefined" ? LocalImages.closeImage : ""}
        onpress={() => {
          _toggleDrawer();
        }}
        linearStyle={styles.linearStyle}
      ></Header>
      <TouchableOpacity
        onPress={() => _toggleDrawer()}
        style={{ position: "absolute", right: 0, top: 50, marginRight: 20 }}
      >
        <Image
          source={LocalImages.closeImage}
          style={{ width: 15, height: 15, tintColor: Screens.pureWhite }}
        />
      </TouchableOpacity>
      <FlatList<any>
        data={aboutList}
        renderItem={_renderItem}
        keyExtractor={_keyExtractor}
      />
      <CustomPopup
      isVisible={isPopupVisible}
      title={popupContent.title}
      message={popupContent.message}
      buttons={popupContent.buttons}
      onClose={() => setPopupVisible(false)}
    />

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

       {/* Popup for Code Entry */}
      <BottomSheet
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
</BottomSheet> 

      {isIdvLoading && <AnimatedLoader isLoaderVisible={isIdvLoading} loadingText="Verifying..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: Screens.colors.background,
  },
  cardContainer: {
    flex: 1,
    margin: 10,
  },
  avatarImageContainer: {
    width: 20,
    height: 20,
  },
  avatarContainer: {
    backgroundColor: "red",
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  linearStyle: {
    height: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    height: 120,
    backgroundColor: "#D9E3EC",
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 130,
    height: 120,
  },
  close: {
    width: 15,
    height: 15,
    tintColor: "#fff",
  },
  closeContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
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

export default CustomDrawer;
