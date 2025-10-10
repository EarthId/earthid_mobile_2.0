import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Screens } from "../../themes";
import QrCodeMask from "react-native-qrcode-mask";
import GenericText from "../../components/Text";
const { height, width } = Dimensions.get("window");
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { isEarthId } from "../../utils/PlatFormUtils";
import CheckBox from "@react-native-community/checkbox";
import { Dropdown } from "react-native-element-dropdown";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { LocalImages } from "../../constants/imageUrlConstants";
import { SCREENS } from "../../constants/Labels";
import LinearGradients from "../../components/GradientsPanel/LinearGradient";
import { Text } from 'react-native';
import { addConsent } from "../../utils/consentApis";
import CustomPopup from "../../components/Loader/customPopup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment';
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
export const QrScannerMaskedWidget = ({ createVerifiableCredentials, 
  setValue, 
  navigation, 
  setIsCamerVisible, 
  barCodeDataDetails, 
  selectedCheckBox, 
  setselectedCheckBox, 
  setisDocumentModalkyc, 
  navigateToCamerScreen, 
  isLoading }: any) => {
  const documentsDetailsList = useAppSelector((state) => state.Documents);
  const [showVisibleDOB, setshowVisibleDOB] = useState(false)
  const [showVisibleBalance, setshowVisibleBalance] = useState(false)
  const [isChecked, setIsChecked] = useState(false);

  const userDetails = useAppSelector((state) => state.account);

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

  const [dob, setDob] = useState<string | null>(null);

  const request = barCodeDataDetails?.requestType?.request;
const isMinAge = request === 'minAge';
const isAgeRange = request === 'ageRange';
const isBalance = request === 'balance';

  useEffect(() => {
     if (isBalance) {
      console.log('got is Balance')
    // no need to fetch DOB for balance requests
    return;
  }
    const fetchDOB = async () => {
      try {
        const datas = documentsDetailsList?.responseData ?? [];
  
        // Try to find Proof of Age VC
        const proofOfAgeDoc = datas.find(item =>
          item.isVc && item.documentName === 'Proof of Age'
        );
  
        let extractedDOB = null;
  
        if (proofOfAgeDoc && proofOfAgeDoc.verifiableCredential) {
          const vc = proofOfAgeDoc.verifiableCredential;
          const subject =
            Array.isArray(vc.credentialSubject) && vc.credentialSubject.length > 0
              ? vc.credentialSubject[0]
              : vc.credentialSubject;
  
          extractedDOB = subject?.dateOfBirth;
          console.log('this is the subject:', subject)
          // if (extractedDOB) {
          //   console.log('DOB extracted from VC:', extractedDOB);
          //   setDob(extractedDOB);
          //   return; // Exit early if DOB found from VC
          // }
        }
  
        // Fallback to AsyncStorage if not found in VC
        const storedDob = await AsyncStorage.getItem("userDOB");
        if (storedDob) {
          console.log('DOB fallback from AsyncStorage:', storedDob);

  // Check if DOB is already in YYYY/MM/DD format using regex
  const isFormatted = /^\d{4}\/\d{2}\/\d{2}$/.test(storedDob);

  let formattedDob = storedDob;

  if (!isFormatted) {
    // Try parsing various common formats
    const parsed = moment(storedDob, ["YYYYMMDD", "YYYY-MM-DD", "DD-MM-YYYY", "MM-DD-YYYY"], true);
    if (parsed.isValid()) {
      formattedDob = parsed.format("YYYY/MM/DD");
    } else {
      console.warn("Invalid DOB format, fallback not applied:", storedDob);
    }
  }

  setDob(formattedDob);
        }
  
      } catch (error) {
        console.error('Error fetching DOB from VC or AsyncStorage', error);
      }
    };
  
    fetchDOB();
  }, [documentsDetailsList, barCodeDataDetails]);
  


  useEffect(() => {
  const datas = documentsDetailsList?.responseData ?? [];
  const requiredDocument = (isMinAge || isAgeRange) ? 'Proof of Age' : 'Proof of Funds';

  const requiredDocumentNotPresent = datas.every(item => !(item.isVc && item.documentName === requiredDocument));

  if (datas.length === 0 || requiredDocumentNotPresent) {
    showPopup(
      "No Documents",
      "Please add the required documents",
      [
        {
          text: "OK",
          onPress: () => {
            setPopupVisible(false);
            navigation.navigate("Documents");
          }
        }
      ]
    );
  }
}, [documentsDetailsList, barCodeDataDetails]);



  const getDropDownList = () => {
  let datas = documentsDetailsList?.responseData ?? [];

  if (isMinAge || isAgeRange) {
    // Only proof of age docs
    return datas.filter(item => item.isVc && item.documentName === 'Proof of Age');
  }

  if (isBalance) {
    // Only proof of funds docs
    console.log('Got proof of funds!!')
    return datas.filter(item => item.isVc && item.documentName === 'Proof of Funds');
  }

  return datas;
};


  const checkDisable = () => {
    return getDropDownList().length > 0
  }

  const addConsentCall = async () => {
    try {
      console.log('These are userDetails===============================', userDetails)
      const apiData = {

        "earthId": userDetails.responseData.earthId,
        "flowName": "Selective Data Disclosure",
        "description": "Sharing selective fields from a document",
        "relyingParty": "EarthID",
        "timeDuration": 1,
        "isConsentActive": true,
        "purpose": "Sharing of information for selective disclosure"

      }
      const consentApiCall = await addConsent(apiData)
      console.log('Consent Api response------:', consentApiCall)
    } catch (error) {
      throw new Error(`Error adding consent: ${error}`);
    }
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: '#fff', zIndex: 100 }}
    //style={styles.sectionContainer}
    >

      <View style={styles.linearStyle}>
        <LinearGradients
          endColor={Screens.colors.header.endColor}
          // middleColor={Screens.colors.header.middleColor}
          startColor={Screens.colors.header.startColor}
          style={styles.linearStyle}
          horizontalGradient={false}
        >
        </LinearGradients>
      </View>

      <View
        //style={{margin:20}}
        style={styles.category}
      >
        <View
          style={{ margin: 10, alignItems: 'flex-end' }}
        //style={styles.category}
        >
          <TouchableOpacity
            onPress={() => {
              setisDocumentModalkyc(false);
              setIsCamerVisible(true);
            }
            }
          >
            <Image
              resizeMode="contain"
              style={{ width: 15, height: 15, tintColor: '#000' }}
              source={LocalImages.closeImage}
            ></Image>
          </TouchableOpacity>
        </View>

        {isLoading ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={'red'} size='large' />
        </View> :
          <View style={{ flex: 1, paddingHorizontal: 5 }}>

            {/* {documentsDetailsList?.responseData?.length === 0 ||
            (documentsDetailsList?.responseData === undefined && (
              <TouchableOpacity onPress={() => navigateToCamerScreen()}>
                <View style={{ paddingHorizontal: 5, marginTop: 10 }}>
                  <GenericText
                    style={{
                      textAlign: "center",
                      color: Screens.colors.ScanButton.startColor,
                      fontSize: 14,
                      fontWeight: "900",
                    }}
                  >
                    {"+ Add Documents"}
                  </GenericText>
                </View>
              </TouchableOpacity>
            ))} */}
            <GenericText
              style={{
                paddingBottom: 15,
                paddingLeft: 9,
                paddingRight: 9,
                color: "#000",
                fontSize: 16,
                fontWeight: "900",
              }}
            >
              {'Anonymously Share credential?'}
            </GenericText>
            <GenericText
              style={{
                paddingBottom: 10,
                paddingLeft: 9,
                paddingRight: 9,
                color: "#000",
                fontSize: 16,
                marginTop: 1,
              }}
            >
              {isEarthId() ? "earthidwanttoaccess" : "globalidwanttoaccess"}
            </GenericText>

            {/* <View style={{width:30,height:30,borderRadius:15,backgroundColor:'#57c891',justifyContent:'center',alignItems:'center'}}>
             <Image
            resizeMode="contain"
            style={{width:10,height:10,tintColor:'#fff'}}
            source={require('../../../resources/images/tik.png')}
          ></Image>
         
             </View> */}
            {/* <GenericText
            style={{
              
              padding: 5,
              color: "#fff",
              fontSize: 14,
              fontWeight: "900",
              marginTop: 5,
            }}
          >
            {'Anonymous verifications'}
          </GenericText> */}
            <GenericText
              style={{

                marginTop: 5,
                marginBottom: 5,
                paddingLeft: 9,
                paddingRight: 9,
                color: '#6c757d',
                fontWeight: '400',
                fontSize: 14,
              }}
            >
              {(isMinAge || isAgeRange)
  ? 'Your exact date of birth will not be disclosed. This verifier can only confirm that your age falls within the specified range.'
  : "Your exact income amount will not be disclosed. This verifier can only confirm that your balance falls within the specified range."}

            </GenericText>
            <ScrollView
              style={{ flexGrow: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={{ marginTop: 10 }}>

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
                       // console.log("item", item);
                        return (
                          <View style={{ borderRadius: 5, borderWidth: 1, borderColor: '#9D9D9D', paddingHorizontal: 10, marginTop: 10 }}>
                            <View
                              style={{ flexDirection: "row", justifyContent: 'space-between', marginTop: 10 }}
                            >

                              <View
                                style={{
                                  justifyContent: "center",
                                  alignItems: "center",
                                  width: 120,
                                  flexWrap: 'wrap'
                                }}
                              >
                                <GenericText
                                  style={{
                                    textAlign: "center",
                                    padding: 5,
                                    color: "#6c757d",
                                    fontSize: 14,
                                    fontWeight: "700",

                                  }}
                                >
                                  {item?.isVc ? item.documentName : item?.docName}
                                </GenericText>
                              </View>
                              <View style={{ flexDirection: "row" }}>
                                <View style={{ width: 20, height: 20, marginTop: 5, borderRadius: 15, backgroundColor: '#57c891', justifyContent: 'center', alignItems: 'center' }}>
                                  <Image
                                    resizeMode="contain"
                                    style={{ width: 10, height: 10, tintColor: '#fff' }}
                                    source={require('../../../resources/images/tik.png')}
                                  ></Image>

                                </View>
                                <GenericText
                                  style={{
                                    textAlign: "center",
                                    padding: 5,
                                    color: "#6c757d",
                                    fontSize: 14,
                                    fontWeight: "700",

                                  }}
                                >
                                  {'Verified'}
                                </GenericText>
                              </View>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                              <GenericText style={{ padding: 5, color: "#000", fontSize: showVisibleDOB ? 14 : 25, fontWeight: 'bold' }}>
  { (isMinAge || isAgeRange)
      ? (showVisibleDOB ? dob : '..../../..')
      : (showVisibleBalance ? "$ " + item?.amount : '$_ _ _ _')
  }
</GenericText>

                             <TouchableOpacity onPress={() => (isMinAge || isAgeRange) ? setshowVisibleDOB(!showVisibleDOB) : setshowVisibleBalance(!showVisibleBalance)}>
  <GenericText style={{ marginTop: 5, padding: 5, color: "#0163f7", fontSize: 10, fontWeight: "600" }}>
    { (isMinAge || isAgeRange) ? (!showVisibleDOB ? 'VIEW' : 'HIDE') : (!showVisibleBalance ? 'VIEW' : 'HIDE') }
  </GenericText>
</TouchableOpacity>

                            </View>

                            <GenericText style={{ padding: 5, color: "#6c757d", fontSize: 14, fontWeight: "700" }}>
  { (isMinAge || isAgeRange) ? 'Date of birth' : 'Balance' }
</GenericText>
                          </View>

                        );
                      }
                    )}
                </View>


                {/* <GenericText
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
            /> */}
              </View>
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <CheckBox
                value={isChecked}

                onValueChange={(newValue) => setIsChecked(newValue)}
              />
              <GenericText style={{ marginLeft: 10, marginRight: 35, fontSize: 11 }}>
              {isEarthId() ? "earthidconsent" : "globalidconsent"}

                </GenericText>
            </View>
          </View>}



        <View style={{ marginTop: 10 }}>
          {!isLoading && <TouchableOpacity
            style={{
              opacity: !checkDisable() || !isChecked ? 0.5 : 1,
              //backgroundColor: '#2AA2DE',
              backgroundColor: Screens.colors.primary,
              marginHorizontal: 10,
              padding: 15,
              borderRadius: 50,
              justifyContent: 'center',
              alignItems: 'center'
            }}
            disabled={!checkDisable() || !isChecked}
            onPress={() => {
              createVerifiableCredentials();
              addConsentCall();
            }}
          >
            <GenericText
              style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}
            >
              {"SHARE"}
            </GenericText>
          </TouchableOpacity>}
          {/* <TouchableOpacity
              onPress={() => {
                setisDocumentModalkyc(false);
                setIsCamerVisible(true);
              }}
            >
              <GenericText
                style={{ color: "red", fontSize: 16, fontWeight: "700" }}
              >
                Cancel
              </GenericText>
            </TouchableOpacity>
          */}
        </View>
        <View style={{ marginTop: 10 }}>
          {!isLoading && (
            <TouchableOpacity
              style={{
                opacity: !checkDisable() ? 0.5 : 1,
                backgroundColor: '#fff',
                marginHorizontal: 10,
                padding: 15,
                borderRadius: 50,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#D3D3D3',
              }}
              disabled={!checkDisable()}
              onPress={() => {
                setisDocumentModalkyc(false);
                setIsCamerVisible(true);
              }}
            >
              <GenericText
                style={{ color: "#525252", fontSize: 13, fontWeight: "700" }}
              >
                {"NO THANKS"}
              </GenericText>
            </TouchableOpacity>
          )}
        </View>
      </View>
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

export default QrScannerMaskedWidget;

const styles = StyleSheet.create({
  maskOutter: {
    position: "absolute",
    top: -50,
    left: 0,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "space-around",
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
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderBottomWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  linearStyle: {
    height: 350,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
  },
  category: {
    backgroundColor: Screens.pureWhite,
    padding: 10,
    marginTop: -320,
    marginHorizontal: 15,
    elevation: 5,
    borderRadius: 10,
    flex: 1,
    justifyContent: "space-between",
    marginBottom: 100
  },
});
