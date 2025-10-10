import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Dimensions,
  Text,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Screens } from "../../../themes";
import GenericText from "../../../components/Text";
import LinearGradients from "../../../components/GradientsPanel/LinearGradient";
import { LocalImages } from "../../../constants/imageUrlConstants";

const earthIDLogo = require("../../../../resources/images/earthIdLogo.png");
const selfieIllustration = require("../../../../resources/images/selfie.jpeg");
const { width, height } = Dimensions.get("window");

interface IDVVerificationPopupProps {
  isVisible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onStartVerification: () => void;
}

const IDVNewLaunchScreen: React.FC<IDVVerificationPopupProps> = ({
  isVisible,
  isLoading,
  onClose,
  onStartVerification,
}) => {
  const handlePrivacyPolicyPress = () => {
    Linking.openURL("https://myearth.id/app-privacy-policy"); // Replace with the actual Privacy Policy URL
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.fullScreenContainer}>
        {/* Gradient Header */}
        <View style={styles.linearStyle}>
          <LinearGradients
            endColor={Screens.colors.header.endColor}
            startColor={Screens.colors.header.startColor}
            style={styles.linearStyle}
            horizontalGradient={false}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Image
                resizeMode="contain"
                style={styles.closeIcon}
                source={LocalImages.closeImage}
              />
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={earthIDLogo}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </LinearGradients>
        </View>

        {/* Popup Content */}
        <View style={styles.popupContent}>
          {/* Title */}
          <GenericText style={styles.titleText}>Confirm Your Identity</GenericText>

          {/* Description */}
          <GenericText style={styles.subText}>
            We’ll ask for your ID and a selfie. It’s quick and secure, and
            trusted by millions of users worldwide.
          </GenericText>

          {/* Illustration */}
          <Image
            source={selfieIllustration}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* "Let's Go" Button */}
        <View style={styles.bottomSection}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#ffffff" size="small" />
            </View>
          ) : (
            <TouchableOpacity style={styles.goButton} onPress={onStartVerification}>
              <GenericText style={styles.buttonText}>Let’s Go!</GenericText>
            </TouchableOpacity>
          )}

          {/* Disclaimer with clickable Privacy Policy */}
          <Text style={styles.disclaimerText}>
            Your session audio and video may be recorded. For more details, refer to EarthID’s{" "}
            <Text style={styles.linkText} onPress={handlePrivacyPolicyPress}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#fff", // White background
    justifyContent: "flex-start", // Start from top
  },
  linearStyle: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    height: height * 0.5, // 50% of screen height
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    position: "absolute",
    top: 70,
  },
  logoImage: {
    width: 180,
    height: 70,
  },
  closeButton: {
    position: "absolute",
    
    top: 55,
    right: 15,
    zIndex: 10,
  },
  closeIcon: {
    width: 16,
    height: 16,
    tintColor: "#fff",
  },
  popupContent: {
    position: "absolute",
    top: height * 0.18, // Push content slightly below header
    alignSelf: "center",
    width: width * 0.9,
    backgroundColor: Screens.pureWhite,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  subText: {
    fontSize: 18,
    color: "#000",
    textAlign: "center",
    marginBottom: 10,
  },
  illustration: {
    width: "80%",
    height: height * 0.4,
    marginBottom: 20,
  },
  bottomSection: {
    alignItems: "center",
    marginTop: height * 0.28, // Push buttons slightly below popup content
    paddingHorizontal: 20,
  },
  goButton: {
    backgroundColor: Screens.colors.primary,
    width: "100%",
    padding: 15,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  loadingContainer: {
    backgroundColor: Screens.colors.primary,
    width: "100%",
    padding: 15,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  disclaimerText: {
    fontSize: 12,
    color: "#525252",
    textAlign: "center",
    marginTop: 10,
  },
  linkText: {
    color: Screens.colors.primary,
    textDecorationLine: "underline",
  },
});

export default IDVNewLaunchScreen;
