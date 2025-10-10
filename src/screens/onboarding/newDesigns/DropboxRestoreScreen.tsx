// src/screens/DropboxRestoreScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useAppDispatch } from '../../../hooks/hooks';
import AnimatedLoader from '../../../components/Loader/AnimatedLoader';
import SuccessPopUp from '../../../components/Loader';

import { signInDropbox, getDropboxTokens, refreshDropboxToken, findLatestDropboxBackup, downloadDropboxFileAsText } from './services/dropbox';
import { rehydrateFromBackupJson } from './services/restoreUtils';
import { saveDocuments } from '../../../redux/actions/authenticationAction';

const HOME_ROUTE = 'Documents';
const BACKUP_FOLDER = '/EarthID Backups';

export default function DropboxRestoreScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [loadingText, setLoadingText] = useState('Starting…');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingText('Connecting to Dropbox…');
        await signInDropbox();
        let { accessToken, accessTokenExpirationDate } = getDropboxTokens();

        if (accessTokenExpirationDate && new Date(accessTokenExpirationDate) < new Date()) {
          const t = await refreshDropboxToken();
          accessToken = t.accessToken;
        }

        setLoadingText('Looking for your latest backup…');
        const file = await findLatestDropboxBackup(accessToken, BACKUP_FOLDER);
        if (!file) throw new Error('No backup file found in Dropbox');

        setLoadingText(`Downloading ${file.name}…`);
        const jsonText = await downloadDropboxFileAsText(accessToken, file.path_lower || file.path_display);

        setLoadingText('Restoring your data…');
        const { documentsForRedux, account, keys } = await rehydrateFromBackupJson(jsonText);

        // 1) documents
        dispatch(saveDocuments(documentsForRedux));
        // 2) account & keys (use your real actions if available)
        dispatch({ type: 'ACCOUNT_RESTORE', payload: account });
        dispatch({ type: 'USER_KEYS_RESTORE', payload: keys });

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          navigation.reset({ index: 0, routes: [{ name: HOME_ROUTE }] });
        }, 1400);
      } catch (e: any) {
        Alert.alert('Restore from Dropbox', e?.message ?? 'Failed', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    })();
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Dropbox Recovery</Text>
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
