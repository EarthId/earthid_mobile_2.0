import React, { useState, useEffect, useCallback } from "react";
import {
  FlatList,
  Text,
  View,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  TouchableOpacity
} from "react-native";
import { Screens } from "../../../themes";
import { dateTime } from "../../../utils/encryption";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { LocalImages } from "../../../constants/imageUrlConstants";
import Header from "../../../components/Header";
import { isEarthId } from "../../../utils/PlatFormUtils";
import {
  createUserSignature,
  saveDocuments,
} from "../../../redux/actions/authenticationAction";
import { useNavigation } from "@react-navigation/native";
import CustomPopup from "../../../components/Loader/customPopup";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedLoader from "../../../components/Loader/AnimatedLoader";


const Accounts = (props) => {
  const userDetails = useAppSelector((state) => state.account);
  const keys = useAppSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const dispatch = useAppDispatch();
  const [bankdata, setBankDetails] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [accessTokenNew, setAccessTokenNew] = useState(null);
  const documentsDetailsList = useAppSelector((state) => state.Documents);
  const { accounts } = props.route.params;
  const navigation = useNavigation();
  const [load, setLoad] = useState(false);

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

console.log('This is accounts:', accounts)
console.log('This is userDetails:', userDetails)

 const ssiBaseUrl = "https://ssi-test.myearth.id/api"
          const authorizationKey = "01a41742-aa8e-4dd6-8c71-d577ac7d463c"

const generateBankProof = async (account, balance) => {
  try {

      //const signature = await createUserIdSignature(profileData);
      const data = {"schemaName": "UserBankAccountSchema:1",
      "isEncrypted": true,
      "dependantVerifiableCredential": [
      ],
      "credentialSubject": {
        "earthId":userDetails?.responseData?.earthId,
        "account": account,
        "balance": balance
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
console.log('BankProofVC', config)
      const response = await axios.request(config);
      console.log('BankProofVC response', response.data.data.verifiableCredential)
      //const verifiableCredential = response.data.data.verifiableCredential;
    
      return response.data.data.verifiableCredential;

  } catch (error) {
      console.log(error);
      throw error;
  }
};

  const createVerifiableCred = async (balance) => {
    setLoad(true)
    console.log('Balance is this---', balance);

    let bankProofVC;
    if (balance !== null && Array.isArray(balance)) {
      // Iterate over each object in the balance array
      for (let item of balance) {
        // Access the Amount object within each item
        const amountObject = item.Amount;
        
        // Assuming generateBankProof requires two arguments from the Amount object
        if (amountObject) {
          bankProofVC = await generateBankProof(amountObject, amountObject.Amount);
          
          // Store the bank proof VC for each item in the balance array
          await AsyncStorage.setItem("bankProofVC", JSON.stringify(bankProofVC));
        }
      }
    }

    console.log('Balance vc ia---', bankProofVC);
    var date = dateTime();
    setLoading(true);
    var documentDetails: IDocumentProps = {
      id: `ID_VERIFICATION${Math.random()}${"selectedDocument"}${Math.random()}`,
      name: "Proof of Funds",
      path: "filePath",
      documentName: "Proof of Funds",
      categoryType: "Finance",
      date: date?.date,
      time: date?.time,
      txId: "data?.result",
      amount:balance[0]?.Amount?.Amount+"",
      // docType: verifyVcCred?.type[1],
      docExt: ".jpg",
      processedDoc: "",
      isVc: true,
      vc: bankProofVC,
      verifiableCredential: bankProofVC,
      docName: "",
      base64: undefined,
    };

    var DocumentList = documentsDetailsList?.responseData
      ? documentsDetailsList?.responseData
      : [];
    DocumentList.push(documentDetails);
    setLoad(false)
    dispatch(saveDocuments(DocumentList)).then(() => {
      setTimeout(() => {
        setLoading(false);
        showPopup(
          "Success",
          "Proof of Funds successfully generated.",
          [{ text: "OK", onPress: () => setPopupVisible(false) }]
        );
        props.navigation.navigate("Documents");
      }, 2000);
    });
  };

  const _toggleDrawer = () => {
    props.navigation.openDrawer();
  };
  const renderItem = ({ item }) => (
    <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', padding: 10 }}>
      <Text>{`Account ID: ${item.AccountId}`}</Text>
      <Text>{`Status: ${item.Status}`}</Text>
      <Text>{`Currency: ${item.Currency}`}</Text>
      {/* Add more fields as needed */}
      {item.Account && (
        <View style={{ marginVertical: 10 ,backgroundColor:'#9EDCF0',padding:10,borderRadius:20}}>
          <Text style={{ fontWeight: 'bold',color:'#000' }}>Account Details:</Text>
          {item.Account.map((subAccount, index) => (
            <View key={index}>
              <Text style={{color:'#000',fontSize:10}}>{`Scheme Name: ${subAccount.SchemeName}`}</Text>
              <Text style={{color:'#000',fontSize:10}}>{`Identification: ${subAccount.Identification}`}</Text>
              <Text style={{color:'#000',fontSize:10}}>{`Secondary Identification: ${subAccount.SecondaryIdentification}`}</Text>
            </View>
          ))}
        </View>
      )}
      {item.Balance && (
        <View style={{ marginVertical: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>Balance:</Text>
          {item.Balance.map((balance, index) => (
            <View key={index}>
              <Text>{`Type: ${balance.Type}`}</Text>
              <Text>{`Amount: ${balance.Amount.Amount} ${balance.Amount.Currency}`}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity onPress={()=>createVerifiableCred(item.Balance)}>
          <View
      
          >
            <View
              style={{
                width: 200,
                height: 50,
                backgroundColor: Screens.colors.primary,
                justifyContent: "center",
                alignItems: "center",
                borderRadius:30,
                shadowColor: 'rgba(0, 0, 0, 0.1)',
                shadowOpacity: 0.8,
                elevation: 6,
                shadowRadius: 15 ,
                shadowOffset : { width: 1, height: 13},
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
              Generate Proof of Funds
              </Text>
            </View>
          </View>
        </TouchableOpacity>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
       <Header
            // rightIconPress={onPressNavigateTo}
            leftIconSource={LocalImages.logoImage}
            onpress={() => {
              _toggleDrawer();
            }}
            linearStyle={styles.linearStyle}
          ></Header>
          <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          position: "absolute",
          marginTop: 50,
          marginLeft: 8,
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
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size={"large"} color={"red"}></ActivityIndicator>
        </View>
      ) : (
        <FlatList
        data={accounts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
      />
      )}
       <CustomPopup
      isVisible={isPopupVisible}
      title={popupContent.title}
      message={popupContent.message}
      buttons={popupContent.buttons}
      onClose={() => setPopupVisible(false)}
    />
     <AnimatedLoader
        isLoaderVisible={load}
        loadingText={"Generating Proof"}
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
});

export default Accounts;
