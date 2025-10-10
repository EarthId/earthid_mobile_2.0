import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFetchBlob from 'rn-fetch-blob';

import { useAppSelector } from '../../../hooks/hooks';
import GLOBALS from '../../../utils/globals';
import { AWS_API_BASE } from '../../../constants/URLContstants';

import AnimatedLoader from '../../../components/Loader/AnimatedLoader';
import SuccessPopUp from '../../../components/Loader';

import { signInDropbox, getDropboxTokens, refreshDropboxToken, uploadJsonToDropbox } from './services/dropbox';

type Step = 'idle' | 'signin' | 'build' | 'upload' | 'done' | 'error';
const HOME_ROUTE = 'Dev4';          // <-- change to your home route
const BACKUP_FOLDER = 'EarthID Backups'; // Dropbox folder name

const ASYNC_KEYS_TO_BACKUP = [
  'userDOB','userName','uploadedDocReg','uploadedDocVc',
  'ageProofVC','setIDVFlag','user_id','sdkStatus','flow',
];

function mimeFromDoc(item: any) {
  const t = (item?.docType || '').toLowerCase();
  if (t === 'jpg' || t === 'jpeg') return 'image/jpeg';
  if (t === 'png') return 'image/png';
  if (t === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
}

async function fetchBase64FromS3Path(fullPathOrS3Path?: string) {
  if (!fullPathOrS3Path) return null;
  try {
    const metaRes = await fetch(`https://${AWS_API_BASE}documents/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentials: GLOBALS.credentials, path: fullPathOrS3Path }),
    });
    if (!metaRes.ok) return null;
    const meta = await metaRes.json();
    const url = meta?.file;
    if (!url) return null;
    const resp = await RNFetchBlob.config({ fileCache: false }).fetch('GET', url);
    return await resp.base64();
  } catch {
    return null;
  }
}

async function buildFullBackupPayload({
  documentsSlice, userData, keys, onProgress,
}: {
  documentsSlice: any, userData: any, keys: any,
  onProgress: (current: number, total: number, name?: string) => void,
}) {
  const docsInput = documentsSlice?.responseData || [];

  // grab a few AsyncStorage values
  const asyncEntries: Record<string, any> = {};
  try {
    const vals = await Promise.all(ASYNC_KEYS_TO_BACKUP.map(k => AsyncStorage.getItem(k)));
    ASYNC_KEYS_TO_BACKUP.forEach((k, i) => (asyncEntries[k] = vals[i]));
  } catch {}

  const docs: any[] = [];
  const total = docsInput.length;

  for (let i = 0; i < total; i++) {
    const d = docsInput[i];
    onProgress(i + 1, total, d?.docName || d?.documentName);
    let base64 = d?.base64;
    if (!base64) {
      const tryPath = d?.s3Path || d?.fullPath;
      if (tryPath) base64 = await fetchBase64FromS3Path(tryPath);
    }
    docs.push({
      id: d?.id,
      docName: d?.docName,
      documentName: d?.documentName,
      categoryType: d?.categoryType,
      date: d?.date,
      time: d?.time,
      txId: d?.txId,
      docType: d?.docType,
      docExt: d?.docExt,
      isVc: d?.isVc,
      vc: d?.vc,
      verifiableCredential: d?.verifiableCredential,
      isLivenessImage: d?.isLivenessImage,
      signature: d?.signature,
      typePDF: d?.typePDF,
      s3Path: d?.s3Path,
      fullPath: d?.fullPath,
      content: base64 ? { encoding: 'base64', mime: mimeFromDoc(d), data: base64 } : null,
    });
  }

  return {
    version: 1,
    app: 'EarthID',
    createdAt: new Date().toISOString(),
    backupId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    provider: 'dropbox',
    user: { account: userData, keys },
    data: { documents: docs },
    storage: asyncEntries,
  };
}

export default function DropboxBackupScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('idle');
  const [loadingText, setLoadingText] = useState('Starting…');
  const [successVisible, setSuccessVisible] = useState(false);

  const documentsSlice = useAppSelector((s: any) => s.Documents);
  const userData       = useAppSelector((s: any) => s.account);
  const keys           = useAppSelector((s: any) => s.user);

  useEffect(() => {
    (async () => {
      try {
        setStep('signin'); setLoadingText('Connecting to Dropbox…');
        await signInDropbox();
        let { accessToken, accessTokenExpirationDate } = getDropboxTokens();

        // optional: refresh if token somehow expired mid-run
        if (accessTokenExpirationDate && new Date(accessTokenExpirationDate) < new Date()) {
          const t = await refreshDropboxToken();
          accessToken = t.accessToken;
        }

        setStep('build');
        const payload = await buildFullBackupPayload({
          documentsSlice, userData, keys,
          onProgress: (cur, tot, name) => setLoadingText(`Bundling ${name || 'document'} (${cur}/${tot})…`),
        });

        setStep('upload'); setLoadingText('Uploading your backup to Dropbox…');
        const res = await uploadJsonToDropbox(accessToken, payload, BACKUP_FOLDER, 'backup');
        console.log('[Dropbox] upload response:', res);

        setStep('done'); setLoadingText('Backup complete');
        setSuccessVisible(true);
        setTimeout(() => {
          setSuccessVisible(false);
          navigation.reset({ index: 0, routes: [{ name: HOME_ROUTE }] });
        }, 1600);
      } catch (e: any) {
        console.log('[Dropbox] ERROR', e?.message || e);
        setStep('error'); setLoadingText('Backup failed');
        Alert.alert('Dropbox Backup', e?.message ?? 'Failed', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    })();
  }, []);

  const showLoader = step !== 'done' && step !== 'error';

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Dropbox Backup</Text>
      <Text style={styles.subtitle}>
        {step === 'done' ? 'Backup complete' : step === 'error' ? 'Backup failed' : loadingText}
      </Text>
      <AnimatedLoader isLoaderVisible={showLoader} loadingText={loadingText} />
      <SuccessPopUp isLoaderVisible={successVisible} loadingText={'Backup successful!'} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, opacity: 0.8, textAlign: 'center' },
});
