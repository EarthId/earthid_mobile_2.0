// src/services/restoreUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// shape we produced in backup
type BackupDoc = {
  id?: string;
  docName?: string;
  documentName?: string;
  categoryType?: string;
  date?: string;
  time?: string;
  txId?: string;
  docType?: string;
  docExt?: string;
  isVc?: boolean;
  vc?: any;
  verifiableCredential?: any;
  isLivenessImage?: any;
  signature?: any;
  typePDF?: any;
  s3Path?: string;
  fullPath?: string;
  content?: { encoding: 'base64'; mime: string; data: string } | null;
};

type BackupPayload = {
  version: number;
  app: string;
  createdAt: string;
  backupId: string;
  mode?: 'visible' | 'hidden';
  provider?: 'dropbox' | 'drive';
  user: { account: any; keys: any };
  data: { documents: BackupDoc[] };
  storage?: Record<string, any>;
};

const ASYNC_KEYS_TO_BACKUP = [
  'userDOB','userName','uploadedDocReg','uploadedDocVc',
  'ageProofVC','setIDVFlag','user_id','sdkStatus','flow',
];

export type RehydrateResult = {
  documentsForRedux: any[]; // your DocumentScreen expects responseData array
  account: any;
  keys: any;
};

export function normalizeDocForRedux(d: BackupDoc): any {
  // Make sure all fields your UI depends on exist
  return {
    id: d.id ?? `doc_${Math.random().toString(36).slice(2)}`,
    docName: d.docName ?? d.documentName ?? 'Document',
    documentName: d.documentName ?? d.docName ?? 'Document',
    categoryType: d.categoryType ?? 'ID',
    date: d.date ?? new Date().toISOString().slice(0,10).split('-').reverse().join('/'), // dd/mm/yyyy if you used that
    time: d.time ?? '00:00',
    txId: d.txId,
    docType: d.docType ?? guessTypeFromMime(d.content?.mime),
    docExt: d.docExt ?? guessExtFromMime(d.content?.mime),
    isVc: d.isVc ?? false,
    vc: d.vc,
    verifiableCredential: d.verifiableCredential,
    isLivenessImage: d.isLivenessImage ?? null,
    signature: d.signature,
    typePDF: d.typePDF,
    s3Path: d.s3Path,
    fullPath: d.fullPath,
    // critically, restore base64 into the field your UI/share uses
    base64: d.content?.data ?? undefined,
  };
}

function guessTypeFromMime(mime?: string) {
  if (!mime) return undefined;
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  return undefined;
}
function guessExtFromMime(mime?: string) {
  if (!mime) return undefined;
  if (mime.includes('pdf')) return '.pdf';
  if (mime.includes('png')) return '.png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  return undefined;
}

export async function rehydrateFromBackupJson(jsonText: string): Promise<RehydrateResult> {
  let payload: BackupPayload;
  try {
    payload = JSON.parse(jsonText);
  } catch (e) {
    throw new Error('Backup file is not valid JSON');
  }

  if (!payload?.data?.documents || !payload?.user) {
    throw new Error('Backup file missing required sections');
  }

  // write AsyncStorage keys back (best-effort)
  if (payload.storage) {
    await Promise.all(
      ASYNC_KEYS_TO_BACKUP.map(async k => {
        const v = payload.storage![k];
        if (v !== undefined && v !== null) {
          try {
            await AsyncStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          } catch {}
        }
      })
    );
  }

  // Normalize docs to the array your UI expects (responseData)
  const documentsForRedux = payload.data.documents.map(normalizeDocForRedux);

  return {
    documentsForRedux,
    account: payload.user.account ?? null,
    keys: payload.user.keys ?? null,
  };
}
