// src/screens/GoogleDriveRestoreScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useAppDispatch } from '../../../hooks/hooks';
import AnimatedLoader from '../../../components/Loader/AnimatedLoader';
import SuccessPopUp from '../../../components/Loader';

import { configureGoogle, signInAndGetAccessToken, findLatestDriveBackup, downloadDriveFileAsText } from './services/googleDrive';
import { rehydrateFromBackupJson } from './services/restoreUtils';
import { saveDocuments } from '../../../redux/actions/authenticationAction';

// If you have actions for account/keys, import them; otherwise we dispatch generic types:
const HOME_ROUTE = 'Documents';

export default function GoogleDriveRestoreScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [loadingText, setLoadingText] = useState('Starting…');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingText('Configuring Google Drive…');
        configureGoogle('visible');

        setLoadingText('Selecting Google account…');
        const token = await signInAndGetAccessToken();

        setLoadingText('Looking for your latest backup…');
        const file = await findLatestDriveBackup(token, 'EarthID Backups');
        if (!file) throw new Error('No backup file found in Drive');

        setLoadingText(`Downloading ${file.name}…`);
        const jsonText = await downloadDriveFileAsText(token, file.id);

        setLoadingText('Restoring your data…');
        const { documentsForRedux, account, keys } = await rehydrateFromBackupJson(jsonText);

        // 1) documents
        dispatch(saveDocuments(documentsForRedux));

        // 2) account & keys: use your own actions if available
        // dispatch(setAccountData(account));
        // dispatch(setUserKeys(keys));
        // For now, send generic actions (reducers can optionally handle these):
        dispatch({ type: 'ACCOUNT_RESTORE', payload: account });
        dispatch({ type: 'USER_KEYS_RESTORE', payload: keys });

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          navigation.reset({ index: 0, routes: [{ name: HOME_ROUTE }] });
        }, 1400);
      } catch (e: any) {
        Alert.alert('Restore from Google Drive', e?.message ?? 'Failed', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    })();
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Google Drive Recovery</Text>
      <Text style={styles.subtitle}>{loadingText}</Text>
      <AnimatedLoader isLoaderVisible={!success} loadingText={loadingText} />
      <SuccessPopUp isLoaderVisible={success} loadingText={'Recovery successful!'} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, opacity: 0.8, textAlign: 'center' },
});
