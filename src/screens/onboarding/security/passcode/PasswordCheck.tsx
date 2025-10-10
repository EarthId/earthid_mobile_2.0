import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from "../../../../components/Header";
import { Screens } from "../../../../themes";
import Button from "../../../../components/Button";
import SmoothPinCodeInput from "react-native-smooth-pincode-input";
import { LocalImages } from "../../../../constants/imageUrlConstants";
import { StackActions, useRoute } from "@react-navigation/native";
import GenericText from "../../../../components/Text";
import { useAppDispatch, useAppSelector } from "../../../../hooks/hooks";
import { deleteSingleBucket } from "../../../../utils/awsSetup";
import { isEarthId } from "../../../../utils/PlatFormUtils";
import { EARTHID_DEV_BASE } from "../../../../constants/URLContstants";
import { useFetch } from "../../../../hooks/use-fetch";
import CustomPopup from "../../../../components/Loader/customPopup";
import { saveDocuments } from "../../../../redux/actions/authenticationAction";
//import { saveDocuments } from "../../../../redux/actions/authenticationAction";

interface IHomeScreenProps {
  navigation?: any;
  route?: any;
}

const PasswordCheck = ({ navigation }: IHomeScreenProps) => {
  const route = useRoute();
  
  const types = route?.params?.type;

  const userDetails = useAppSelector((state) => state.account);
  const {
    loading,
    data: deletedRespopnse,
    error,
    fetch: deleteFetch,
  } = useFetch();

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

  const dispatch = useAppDispatch();

  const deleteuserData = async () => {
    const paramsUrl = `${EARTHID_DEV_BASE}/user/deleteUser?earthId=${userDetails?.responseData?.earthId}&publicKey=${userDetails?.responseData?.publicKey}`;
    // await AsyncStorage.removeItem("passcode");
    // await AsyncStorage.removeItem("fingerprint");
    // await AsyncStorage.removeItem("FaceID");
    // await AsyncStorage.removeItem("pageName");
    // await AsyncStorage.removeItem("profilePic");
    // await AsyncStorage.removeItem("vcCred");
    // await AsyncStorage.removeItem("apiCalled");
    // await AsyncStorage.removeItem("signatureKey");
    // await AsyncStorage.clear(); // Clear all AsyncStorage data
    // console.log("All AsyncStorage data cleared successfully.");

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

    const requestBoady = {
      publicKey: userDetails?.responseData?.publicKey,
    };

    deleteFetch(paramsUrl, requestBoady, "DELETE");
    // const bucketName = `idv-sessions-${userDetails?.username.toLowerCase()}`;
    // deleteSingleBucket(bucketName);

    setTimeout(() => {
      navigation.dispatch(StackActions.replace("AuthStack"));
    }, 3000);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState();
  const [count, setCount] = useState(4);
  const [isError, setisError] = useState(false);
  const onPinCodeChange = (code: any) => {
    setisError(false);
    var format = code?.replace(/[^0-9]/g, "");
    setCode(format);
  };
  useEffect(() => {
    console.log("route===>", types);
  }, []);

  const _navigateAction = async () => {
    const getItem = await AsyncStorage.getItem("passcode");
  
    console.log("code====>", code);
    console.log("type@@@@@@@@@@@@@@@@@@@@@@@@@@@@==>", types);
  
    if (code?.length > 5) {
      if (getItem === code?.toString()) {
        setIsLoading(true);
        if (
          types === "false" ||
          types === null ||
          types === undefined ||
          types === "facecheck"
        ) {
          navigation.dispatch(StackActions.replace("DrawerNavigator"));
        } else if (types === "true") {
          deleteuserData();
        } else {
          deleteuserData();
        }
      } else if (count === 0) {
        showPopup(
          "Oops!",
          "Too many attempts. Try again after some time.",
          [
            {
              text: "Cancel",
              onPress: () => setPopupVisible(false),
              style: "cancel",
            },
            { text: "OK", onPress: () => setPopupVisible(false) },
          ]
        );
      } else {
        setCount(count - 1);
        showPopup(
          "Invalid Code",
          `You have ${count} attempts left.`,
          [
            {
              text: "Cancel",
              onPress: () => setPopupVisible(false),
              style: "cancel",
            },
            { text: "OK", onPress: () => setPopupVisible(false) },
          ]
        );
      }
    } else {
      showPopup(
        "Oops!",
        "Please enter a valid passcode.",
        [
          {
            text: "Cancel",
            onPress: () => setPopupVisible(false),
            style: "cancel",
          },
          { text: "OK", onPress: () => setPopupVisible(false) },
        ]
      );
    }
    console.log("loff", count);
  };
  

  return (
    <View style={styles.sectionContainer}>
      <ScrollView contentContainerStyle={styles.sectionContainer}>
        <Header
          isLogoAlone={true}
          headingText={"Passcodeauth"}
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
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                margin: 30,
              }}
            >
              <Image
                resizeMode="contain"
                style={[styles.logoContainer]}
                source={LocalImages.passcordImage}
              ></Image>
            </View>

            <GenericText
              style={[
                styles.categoryHeaderText,
                {
                  fontSize: 13,
                  fontWeight: "500",
                  textAlign: "center",
                  color: Screens.grayShadeColor,
                },
              ]}
            >
              {"plsenterpass"}
            </GenericText>
          </View>

          <View style={{ alignSelf: "center" }}>
            <SmoothPinCodeInput
              cellStyle={{
                borderWidth: isError ? 1.5 : 0.5,
                borderColor: isError ? "red" : Screens.grayShadeColor,
                borderRadius: 5,
              }}
              cellStyleFocused={{
                borderWidth: 2,
                borderColor: Screens.colors.primary,
              }}
              password
              cellSize={50}
              codeLength={6}
              value={code}
              onTextChange={onPinCodeChange}
            />
          </View>

          {isError && (
            <GenericText
              style={[
                styles.categoryHeaderText,
                {
                  fontSize: 13,
                  fontWeight: "500",
                  textAlign: "center",
                  color: "red",
                },
              ]}
            >
              {"plsentervalid"}
            </GenericText>
          )}

          <Button
            //  disabled={count ==0 ? true : false}
            // disabled={code?.length > 5 ? false : true}
            onPress={_navigateAction}
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
            title={"submitt"}
          ></Button>
        </View>
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
  logoContainer: {
    width: 100,
    height: 100,
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
    flex: 0.1,
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

export default PasswordCheck;
