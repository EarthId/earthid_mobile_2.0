import React, { useRef, useState } from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import Header from "../../../components/Header";
import { LocalImages } from "../../../constants/imageUrlConstants";
import { SCREENS } from "../../../constants/Labels";
import { Screens } from "../../../themes";
import Button from "../../../components/Button";
import Info from "../../../components/Info";
import TextInput from "../../../components/TextInput";
import PhoneInput from "react-native-phone-number-input";
import useFormInput from "../../../hooks/use-text-input";
import { nameValidator } from "../../../utils/inputValidations";

interface IHomeScreenProps {
  navigation?: any;
}

const Register = ({ navigation }: IHomeScreenProps) => {
  const phoneInput: any = useRef();
  const [mobileNumber, setmobileNumber] = useState();
  const {
    value: fullName,
    isFocused: fullNameFocus,
    validationResult: {
      hasError: isfullNameError,
      errorMessage: isfullNameErrorMessage,
    },
    valueChangeHandler: fullNameChangeHandler,
    inputFocusHandler: fullNameFocusHandlur,
    inputBlurHandler: fullNameBlurHandler,
  } = useFormInput("RobertDowney", true, nameValidator);

  const {
    value: dateOfBirth,
    isFocused: dateOfBirthFocus,
    validationResult: {
      hasError: dateOfBirthError,
      errorMessage: dateOfBirthErrorMessage,
    },
    valueChangeHandler: dateOfBirthChangeHandler,
    inputFocusHandler: dateOfBirthocusHandlur,
    inputBlurHandler: dateOfBirthlurHandler,
  } = useFormInput("22/02/1995", true, nameValidator);

  return (
    <View style={styles.sectionContainer}>
      <ScrollView contentContainerStyle={styles.sectionContainer}>
        <Header
          isLogoAlone={true}
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
            <Text
              style={[
                styles.categoryHeaderText,
                {
                  fontSize: 18,
                  fontWeight: "bold",
                  textAlign: "center",
                  color: Screens.black,
                },
              ]}
            >
              {SCREENS.LANDINGSCREEN.setUpId}
            </Text>
            <Info
              title={"Full Name"}
              style={{
                title: styles.title,
                subtitle: styles.subtitle,
                container: styles.textContainer,
              }}
            />
            <TextInput
              style={{
                container: styles.textInputContainer,
              }}
              isError={isfullNameError}
              errorText={isfullNameErrorMessage}
              onFocus={fullNameFocusHandlur}
              onBlur={fullNameBlurHandler}
              maxLength={60}
              isFocused={fullNameFocus}
              value={fullName}
              onChangeText={fullNameChangeHandler}
            />
            <Info
              title={"Last Name"}
              style={{
                title: styles.title,
                subtitle: styles.subtitle,
                container: styles.textContainer,
              }}
            />
            <TextInput
              style={{
                container: styles.textInputContainer,
              }}
              isError={isfullNameError}
              errorText={isfullNameErrorMessage}
              onFocus={fullNameFocusHandlur}
              onBlur={fullNameBlurHandler}
              maxLength={60}
              isFocused={fullNameFocus}
              value={fullName}
              onChangeText={fullNameChangeHandler}
            />
            <Info
              title={"Date of Birth"}
              style={{
                title: styles.title,
                subtitle: styles.subtitle,
                container: styles.textContainer,
              }}
            />
            <TextInput
              style={{
                container: styles.textInputContainer,
              }}
              rightIcon={LocalImages.calendarImage}
              isError={dateOfBirthError}
              errorText={dateOfBirthErrorMessage}
              onFocus={dateOfBirthocusHandlur}
              onBlur={dateOfBirthlurHandler}
              maxLength={60}
              isFocused={dateOfBirthFocus}
              value={dateOfBirth}
              onChangeText={dateOfBirthChangeHandler}
            />
            <Info
              title={"Mobile Number"}
              style={{
                title: styles.title,
                subtitle: styles.subtitle,
                container: styles.textContainer,
              }}
            />
            <PhoneInput
              ref={phoneInput}
              defaultValue={"0000000"}
              defaultCode="IN"
              layout="first"
              onChangeText={(text: any) => {
                setmobileNumber(text);
              }}
              containerStyle={{
                borderColor: Screens.colors.primary,
                width: 320,
                borderWidth: 2.2,
                borderRadius: 5,
                height: 65,
                marginLeft: 10,
              }}
              flagButtonStyle={{ backgroundColor: Screens.thickGray }}
              textInputStyle={{ fontSize: 16, padding: 0, margin: 0 }}
              codeTextStyle={{ fontSize: 16, padding: 0, margin: 0 }}
              textContainerStyle={{
                height: 55,
                padding: 0,
                margin: 0,
              }}
              withShadow
              autoFocus
            />
            <Info
              title={"Email"}
              style={{
                title: styles.title,
                subtitle: styles.subtitle,
                container: styles.textContainer,
              }}
            />
            <TextInput
              style={{
                container: styles.textInputContainer,
              }}
              isError={isfullNameError}
              errorText={isfullNameErrorMessage}
              onFocus={fullNameFocusHandlur}
              onBlur={fullNameBlurHandler}
              maxLength={60}
              isFocused={fullNameFocus}
              value={fullName}
              onChangeText={fullNameChangeHandler}
            />
          </View>
          <Button
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
            title={"GENERATE GLOBAL ID"}
          ></Button>
          <Text
            style={[
              styles.categoryHeaderText,
              {
                fontSize: 13,
                fontWeight: "500",
                textAlign: "center",
                color: Screens.black,
              },
            ]}
          >
            {"I Already have my "}
            <Text style={{ color: Screens.colors.primary }}>{"GlobaliD"}</Text>
          </Text>
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
    marginTop: -100,
    marginHorizontal: 15,
    elevation: 5,
    borderRadius: 10,
    flex: 0.95,
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