import './src/polyfills'
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, View, BackHandler, Linking, AppState } from "react-native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";
import LanguageContextProvider from "./src/components/LanguageContext/LanguageContextProvider";
import RootNavigator from "./src/navigations/RootNavigator";
import VersionCheck from 'react-native-version-check';
import { persistor, store } from "./src/redux/store";
import { Buffer } from "buffer";
import { isEarthId } from "./src/utils/PlatFormUtils";
import { Screens } from "./src/themes";
import CustomPopup from "./src/components/Loader/customPopup";


global.Buffer = Buffer;

const App = () => {
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

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkUpdateNeeded();
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkUpdateNeeded();
      }
      appState.current = nextAppState;
      console.log('AppState', appState.current);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const checkUpdateNeeded = async () => {
    let updateNeeded = await VersionCheck.needUpdate();
    if (updateNeeded && updateNeeded.isNeeded) {
      showPopup(
        'Please update',
        'You will have to update your app to the latest version to continue using.',
        [
          {
            text: 'Update',
            onPress: () => {
              BackHandler.exitApp();
              Linking.openURL(updateNeeded?.storeUrl);
            },
          }
        ]
      );
    }
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <View style={{ flex: 1 }}>
          <SafeAreaView style={styles.container}>
            <LanguageContextProvider>
              <RootNavigator />
            </LanguageContextProvider>
          </SafeAreaView>
          <CustomPopup
            isVisible={isPopupVisible}
            title={popupContent.title}
            message={popupContent.message}
            buttons={popupContent.buttons}
            onClose={() => setPopupVisible(false)}
          />
        </View>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isEarthId()
      ? Screens.colors.ScanButton.startColor
      : "rgba(191, 208, 224, 0.3)",
  },
});

export default App;
