// src/screens/GoogleDriveBackupScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFetchBlob from 'rn-fetch-blob';

// ⬇️ adjust paths to your project structure if needed
import { useAppSelector } from '../../../hooks/hooks';
import { configureGoogle, signInAndGetAccessToken, uploadJsonVisible, uploadJsonHidden } from './services/googleDrive';
import GLOBALS from '../../../utils/globals';
import { AWS_API_BASE } from '../../../constants/URLContstants';

// ⬇️ your existing UI components
import AnimatedLoader from '../../../components/Loader/AnimatedLoader';
import SuccessPopUp from '../../../components/Loader';
// import ErrorPopUp from '../../../components/Loader/errorPopup';

type Step = 'idle' | 'config' | 'signin' | 'build' | 'upload' | 'done' | 'error';

// choose where to store
const BACKUP_MODE: 'visible' | 'hidden' = 'visible';
const BACKUP_FOLDER_NAME = 'EarthID Backups';

// route to go to after success
const HOME_ROUTE = 'Dev4';

// Optional: also include a few AsyncStorage keys
const ASYNC_KEYS_TO_BACKUP = [
  'userDOB','userName','uploadedDocReg','uploadedDocVc',
  'ageProofVC','setIDVFlag','user_id','sdkStatus','flow',
];

// Guess mime from your doc item
function mimeFromDoc(item: any) {
  const t = (item?.docType || '').toLowerCase();
  if (t === 'jpg' || t === 'jpeg') return 'image/jpeg';
  if (t === 'png') return 'image/png';
  if (t === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
}

// If base64 is missing but we have an S3 path, fetch it and return base64
async function fetchBase64FromS3Path(fullPathOrS3Path?: string) {
  if (!fullPathOrS3Path) return null;
  try {
    // 1) ask your API for a signed URL
    const metaRes = await fetch(`https://${AWS_API_BASE}documents/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentials: GLOBALS.credentials,
        path: fullPathOrS3Path,
      }),
    });
    if (!metaRes.ok) {
      console.log('[Backup] S3 meta error:', metaRes.status);
      return null;
    }
    const meta = await metaRes.json();
    const fileUrl = meta?.file;
    if (!fileUrl) return null;

    // 2) download as base64
    const resp = await RNFetchBlob.config({ fileCache: false }).fetch('GET', fileUrl);
    const base64 = await resp.base64();
    return base64;
  } catch (e: any) {
    console.log('[Backup] fetchBase64FromS3Path error:', e?.message || e);
    return null;
  }
}

// Build a fully self-contained backup (with base64) + progress updates
async function buildFullBackupPayload({
  documentsSlice,
  userData,
  keys,
  onProgress,
}: {
  documentsSlice: any,
  userData: any,
  keys: any,
  onProgress: (current: number, total: number, docName?: string) => void,
}) {
  const docsInput = documentsSlice?.responseData || [];

  // Read optional AsyncStorage values
  const asyncEntries: Record<string, any> = {};
  try {
    const vals = await Promise.all(ASYNC_KEYS_TO_BACKUP.map(k => AsyncStorage.getItem(k)));
    ASYNC_KEYS_TO_BACKUP.forEach((k, i) => (asyncEntries[k] = vals[i]));
  } catch (e) {
    console.log('[Backup] AsyncStorage read error:', (e as any)?.message || e);
  }

  // Ensure each doc has base64
  const docs: any[] = [];
  const total = docsInput.length;

  for (let i = 0; i < total; i++) {
    const d = docsInput[i];
    onProgress(i + 1, total, d?.docName || d?.documentName);

    let base64 = d?.base64;
    if (!base64) {
      // Try to fetch if we have a path
      const tryPath = d?.s3Path || d?.fullPath;
      if (tryPath) {
        base64 = await fetchBase64FromS3Path(tryPath);
      }
    }

    // bundle minimal + critical fields + content
    docs.push({
      // core identity fields you already use
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
      // any other metadata you rely on:
      s3Path: d?.s3Path,
      fullPath: d?.fullPath,

      // the actual bytes
      content: base64
        ? { encoding: 'base64', mime: mimeFromDoc(d), data: base64 }
        : null, // if still null, we couldn’t fetch; metadata is still backed up
    });
  }

  const payload = {
    version: 1,
    app: 'EarthID',
    createdAt: new Date().toISOString(),
    backupId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    mode: BACKUP_MODE,
    user: {
      account: userData,
      keys,
    },
    data: {
      documents: docs,
    },
    storage: asyncEntries,
  };

  // Size estimate (bytes of JSON string)
  try {
    // TextEncoder may not exist on older RN; fall back to string length
    const approxBytes =
      // @ts-ignore
      (global as any).TextEncoder
        ? new (global as any).TextEncoder().encode(JSON.stringify(payload)).length
        : JSON.stringify(payload).length;
    console.log(`[Backup] JSON ~${(approxBytes / (1024 * 1024)).toFixed(2)} MB`);
  } catch {}

  return payload;
}

export default function GoogleDriveBackupScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('idle');
  const [loadingText, setLoadingText] = useState('Starting…');
  const [successVisible, setSuccessVisible] = useState(false);

  const documentsSlice = useAppSelector((s: any) => s.Documents);
  const userData       = useAppSelector((s: any) => s.account);
  const keys           = useAppSelector((s: any) => s.user);

  useEffect(() => {
    (async () => {
      try {
        setStep('config'); setLoadingText('Configuring Google Drive…');
        configureGoogle(BACKUP_MODE);

        setStep('signin'); setLoadingText('Opening Google account picker…');
        const accessToken = await signInAndGetAccessToken();

        setStep('build');
        const payload = await buildFullBackupPayload({
          documentsSlice,
          userData,
          keys,
          onProgress: (current, total, name) => {
            setLoadingText(`Bundling ${name || 'document'} (${current}/${total})…`);
          },
        });

        setStep('upload'); setLoadingText('Uploading your backup to Drive…');
        const res = BACKUP_MODE === 'visible'
          ? await uploadJsonVisible(accessToken, payload, BACKUP_FOLDER_NAME)
          : await uploadJsonHidden(accessToken, payload);

        console.log('[Backup] Drive response:', res);

        setStep('done'); setLoadingText('Backup complete');
        setSuccessVisible(true);

        // Navigate home after a short celebratory pause
        setTimeout(() => {
          setSuccessVisible(false);
          navigation.reset({ index: 0, routes: [{ name: HOME_ROUTE }] });
        }, 2000);
      } catch (e: any) {
        console.log('[Backup] ERROR', e);
        setStep('error'); setLoadingText('Backup failed');
        Alert.alert('Google Drive Backup', e?.message ?? 'Failed', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    })();
  }, []);

  const showLoader = step !== 'done' && step !== 'error';

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Google Drive Backup</Text>
      <Text style={styles.subtitle}>
        {step === 'done' ? 'Backup complete' : step === 'error' ? 'Backup failed' : loadingText}
      </Text>

      {/* Full-screen loading overlay */}
      <AnimatedLoader isLoaderVisible={showLoader} loadingText={loadingText} />

      {/* Success popup */}
      <SuccessPopUp isLoaderVisible={successVisible} loadingText={'Backup successful!'} />
      {/* Optional error popup:
      <ErrorPopUp isLoaderVisible={step === 'error'} loadingText={'An error occurred. Please try again.'} onHide={() => navigation.goBack()} />
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, opacity: 0.8, textAlign: 'center' },
});
