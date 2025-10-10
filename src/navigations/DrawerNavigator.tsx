import { createDrawerNavigator } from "@react-navigation/drawer";
import { BottomMenus } from "../navigations/BottomTabs";
import * as React from "react";
import { Dimensions } from "react-native";
import CustomDrawer from "../navigations/CustomDrawer";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "../screens/profiles";
import EditProfileScreen from "../screens/profiles/EditProfile";
import settings from "../screens/settings";
import ShowQrScreen from "../screens/Camera/ShowQrCodeScreen";
import { SlidAnimation } from "./SlidAnimation";
import uploadDocumentsScreen from "../screens/uploadDocuments";
import DocumentPreviewScreen from "../screens/uploadDocuments/DocumentPreviewScreen";
import categoryScreen from "../screens/uploadDocuments/categoryScreen";
import LivenessCameraScreen from "../screens/uploadDocuments/LivenessCameraScreen";
import VerifiDocumentScreen from "../screens/uploadDocuments/VerifiDocumentScreen";
import SetPincode from "../screens/onboarding/security/passcode/SetPincode";
import ConfirmPincode from "../screens/onboarding/security/passcode/ConfirmPincode";
import OTPScreen from "../screens/onboarding/security/passcode/OTPScreen";
import ViewCredential from "../screens/bottomTabs/documentTab/ViewCredebtials";
import CustomizeQr from "../screens/profiles/CustomizeQr";
import backupIdentity from "../screens/onboarding/backupIdentity";
import Document from "../screens/bottomTabs/documentTab/index";
import ShareQr from '../screens/onboarding/backupIdentity/ShareQr'

import UpdateAuthentication from "../screens/onboarding/security/UpdateAuthentication";
import AuthBackupIdentity from "../screens/onboarding/backupIdentity/AuthIdentity";
import EditMobileNumber from "../screens/profiles/EditMobileNumber";
import EditEmailAddress from "../screens/profiles/EditEmailAddress";
import EditMobileNumOtp from "../screens/profiles/EditMobileNumOtp";
import EditEmailAddOtp from "../screens/profiles/EditEmailAddOtp";
import UpdateFaceId from "../screens/FaceRegister/UpdateFaceId";
import OldPincode from "../screens/onboarding/security/passcode/UpdatePincode/OldPincode";
import UpdateConfirmPincode from "../screens/onboarding/security/passcode/UpdatePincode/UpdateConfirmPincode";
import UpdateNewPin from "../screens/onboarding/security/passcode/UpdatePincode/UpdateNewPin";
import UpdateTouchId from "../screens/onboarding/security/UpdateTouchId";
import Payment from "../screens/bottomTabs/payemnts/index"
import BankLoginScreen from '../screens/bottomTabs/payemnts/BankLoginScreen'
import Accountszzz from '../screens/bottomTabs/payemnts/Accounts'
import RegisterOTP from "../screens/UploadQr/RegisterOTP";
import Consent from "../screens/Consent";
import GoogleDriveBackupScreen from "../screens/onboarding/newDesigns/googleDriveBackup";
import Dev4 from "../screens/onboarding/newDesigns/dev4";
import DropboxBackupScreen from "../screens/onboarding/newDesigns/DropboxBackupScreen";
import Recovery from "../screens/onboarding/newDesigns/recovery";
import GoogleDriveRestoreScreen from "../screens/onboarding/newDesigns/GoogleDriverestoreScreen";
import DropboxRestoreScreen from "../screens/onboarding/newDesigns/DropboxRestoreScreen";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const animations: any = SlidAnimation;

const dashBoardStack = {
  ProfileScreen: ProfileScreen,
  EditProfileScreen: EditProfileScreen,
  settings: settings,
  ShowQrScreen: ShowQrScreen,
  AuthBackupIdentity: AuthBackupIdentity,
  uploadDocumentsScreen: uploadDocumentsScreen,
  DocumentPreviewScreen: DocumentPreviewScreen,
  categoryScreen: categoryScreen,
  LivenessCameraScreen: LivenessCameraScreen,
  VerifiDocumentScreen: VerifiDocumentScreen,
  SetPincode: SetPincode,
  ConfirmPincode: ConfirmPincode,
  OTPScreen: OTPScreen,
  ViewCredential: ViewCredential,
  CustomizeQr: CustomizeQr,
  backupIdentity: backupIdentity,
  UpdateAuthentication: UpdateAuthentication,
  EditMobileNumber: EditMobileNumber,
  EditEmailAddress: EditEmailAddress,
  EditMobileNumOtp: EditMobileNumOtp,
  EditEmailAddOtp: EditEmailAddOtp,
  UpdateFaceId: UpdateFaceId,
  OldPincode: OldPincode,
  UpdateConfirmPincode: UpdateConfirmPincode,
  UpdateNewPin: UpdateNewPin,
  UpdateTouchId: UpdateTouchId,
  ShareQr:ShareQr,
  Payment:Payment,
  BankLoginScreen:BankLoginScreen,
  Accountszzz:Accountszzz,
  RegisterOTP:RegisterOTP,
  Consent:Consent,
  GoogleDriveBackupScreen:GoogleDriveBackupScreen,
  Dev4:Dev4,
  DropboxBackupScreen:DropboxBackupScreen,
  Recovery:Recovery,
  GoogleDriveRestoreScreen:GoogleDriveRestoreScreen,
  DropboxRestoreScreen:DropboxRestoreScreen
};

const tabs = {
  bottomTabs: BottomMenus,
};

function appStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {Object.entries({
        ...tabs,
        ...dashBoardStack,
      }).map(([name, component]) => (
        <Stack.Screen
          key={name}
          options={{
            ...animations,
          }}
          name={name}
          component={component}
        />
      ))}
    </Stack.Navigator>
  );
}

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
 
      drawerContent={(props: any) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: Dimensions.get("screen").width,
        },
        drawerPosition: "left",
      }}
    >
      <Drawer.Screen
        options={{
          ...animations,
        }}
        name="DrawerStacks"
        component={appStack}
      />
    </Drawer.Navigator>
  );
};
export default DrawerNavigator;
