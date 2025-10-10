import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  AsyncStorage,
  Alert,
} from "react-native";
import Header from "../../../components/Header";
import { SCREENS } from "../../../constants/Labels";
import { Screens } from "../../../themes";
import Button from "../../../components/Button";
import { LocalImages } from "../../../constants/imageUrlConstants";
import GenericText from "../../../components/Text";

interface IHomeScreenProps {
  navigation?: any;
}

const Register = ({ navigation }: IHomeScreenProps) => {
  
  return (
    <View style={styles.sectionContainer}>
      <ScrollView contentContainerStyle={styles.sectionContainer}>
        <Header
          isBack
          letfIconPress={() => navigation.goBack()}
          isLogoAlone={true}
          headingText="Backup"
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
                source={LocalImages.cloud}
              ></Image>
            </View>
            <GenericText
              style={[
                styles.categoryHeaderText,
                {
                  fontSize: 14,
                  fontWeight: "bold",
                  textAlign: "center",
                  color: Screens.black,
                },
              ]}
            >
              Choose Cloud Service
            </GenericText>
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
              Please select your cloud service provider
            </GenericText>
            {/* <Button
              selected={false}
              disabled={false}
              onPress={() => {
                
                navigation.navigate("Dev5");
              }}
              style={{
                buttonContainer: {
                  opacity: 1,
                  backgroundColor: "#fff",
                  elevation: 2,
                  borderColor: Screens.colors.primary,
                },
              }}
              title="ICLOUD"
            ></Button> */}
<View style={{ marginTop: 20 }}>
  <Button
    selected={false}
    disabled={false}
    onPress={() => {
      // navigate to the progress screen that runs the whole flow
      navigation.navigate('Dev');
    }}
    style={{
      buttonContainer: {
        opacity: 1,
        backgroundColor: "#fff",
        elevation: 2,
        borderColor: Screens.colors.primary,
        iconStyle: Screens.colors.primary,
      },
    }}
    title="EARTHID DEFAULT"
  />
</View>
<View style={{ marginTop: -20 }}>
  <Button
    selected={false}
    disabled={false}
    onPress={() => {
      // navigate to the progress screen that runs the whole flow
      navigation.navigate('GoogleDriveBackupScreen');
    }}
    style={{
      buttonContainer: {
        opacity: 1,
        backgroundColor: "#fff",
        elevation: 2,
        borderColor: Screens.colors.primary,
        iconStyle: Screens.colors.primary,
      },
    }}
    title="GOOGLE DRIVE"
  />
</View>
            {/* <View style={{ marginTop: -20 }}>
              <Button
                selected={false}
                disabled={false
                }
                onPress={() => {}}
                style={{
                  buttonContainer: {
                    opacity: 1,
                    backgroundColor: "#fff",
                    elevation: 2,
                    borderColor: Screens.colors.primary,
                    iconStyle: Screens.colors.primary,
                  },
                }}
                title="ONEDRIVE"
              ></Button>
            </View> */}
            <View style={{ marginTop: -20 }}>
              <Button
                selected={false}
                disabled={false
                }
                onPress={() => {
    navigation.navigate('DropboxBackupScreen'); // 👈 go to Dropbox flow now
  }}
                style={{
                  buttonContainer: {
                    opacity: 1,
                    backgroundColor: "#fff",
                    elevation: 2,
                    borderColor: Screens.colors.primary,
                    iconStyle: Screens.colors.primary,
                  },
                }}
                title="DROPBOX"
              ></Button>
            </View>
          </View>
        </View>
      </ScrollView>
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

export default Register;
