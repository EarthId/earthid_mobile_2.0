// src/services/googleDrive.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import RNFS from 'react-native-fs';
import { GOOGLE } from '../config/googleClientConfig';

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const P = '[GDriveBackup]';

// ---------- helpers ----------
function mask(val?: string | null, start = 8, end = 6) {
  if (!val) return String(val);
  if (val.length <= start + end) return val[0] + '***' + val.slice(-1);
  return `${val.slice(0, start)}…${val.slice(-end)}`;
}
function logJson(label: string, obj: any) {
  try {
    console.log(`${P} ${label}:`, JSON.stringify(obj, null, 2).slice(0, 1000));
  } catch {
    console.log(`${P} ${label}: (unserializable)`);
  }
}

// Call ONCE before signIn
export function configureGoogle(mode: 'hidden' | 'visible' = 'visible') {
  const webId = GOOGLE.WEB_CLIENT_ID;
  const iosId = GOOGLE.IOS_CLIENT_ID;

  console.log(`${P} configureGoogle(mode=${mode})`);
  console.log(`${P} config.WEB_CLIENT_ID: ${mask(webId)}`);
  console.log(`${P} config.IOS_CLIENT_ID: ${mask(iosId)}`);

  // If no Web client ID, avoid offline to prevent RNGoogleSignIn error
  const offline = Boolean(webId);

  GoogleSignin.configure({
    scopes:
      mode === 'hidden'
        ? ['https://www.googleapis.com/auth/drive.appdata']
        : ['https://www.googleapis.com/auth/drive.file'],

    // ✅ from config file
    webClientId: webId,
    iosClientId: iosId,

    offlineAccess: offline,
    forceCodeForRefreshToken: offline,
  });

  console.log(`${P} GoogleSignin configured. offlineAccess=${offline}`);
  if (!offline) {
    console.warn(
      `${P} No WEB_CLIENT_ID set. Using online-only mode (no serverAuthCode / refresh).`
    );
  }
}

export async function signInAndGetAccessToken() {
  console.log(`${P} signInAndGetAccessToken → hasPlayServices…`);
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  console.log(`${P} Play Services OK`);

  await GoogleSignin.signOut().catch(e =>
    console.log(`${P} signOut (ok if first time):`, e?.message || e)
  );

  console.log(`${P} Opening Google account picker…`);
  const user = await GoogleSignin.signIn();
  console.log(`${P} user.email:`, (user as any)?.user?.email);
  console.log(`${P} serverAuthCode present:`, Boolean((user as any)?.serverAuthCode));

  console.log(`${P} getTokens()…`);
  const tokens = await GoogleSignin.getTokens();
  console.log(`${P} token keys:`, Object.keys(tokens || {}));
  console.log(`${P} accessToken:`, mask(tokens?.accessToken));
  console.log(`${P} idToken:`, mask(tokens?.idToken));

  const { accessToken } = tokens;
  if (!accessToken) {
    throw new Error(
      'No access token from Google. If you intend offline access, set WEB_CLIENT_ID in config.'
    );
  }
  return accessToken;
}

function makeMultipart(meta: object, content: string, mime = 'application/json') {
  const boundary = 'rn_boundary_' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}`;
  const filePart = `${delimiter}Content-Type: ${mime}\r\n\r\n${content}`;
  const body = metaPart + filePart + closeDelim;

  logJson('multipart meta', meta);
  console.log(`${P} multipart body length ≈`, body.length);

  return { body, boundary };
}

// If you want a visible folder in Drive for your app’s backups
export async function ensureFolder(accessToken: string, name = 'MyApp Backups') {
  try {
    console.log(`${P} ensureFolder("${name}") → searching…`);
    const q = encodeURIComponent(
      `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    const url = `${DRIVE_FILES}?q=${q}&fields=files(id,name)`;
    console.log(`${P} GET ${url}`);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(`${P} ensureFolder search status:`, res.status);
    const json = await res.json();
    logJson('ensureFolder search response', json);

    if (json?.files?.length) {
      const id = json.files[0].id;
      console.log(`${P} Folder exists: ${id}`);
      return id;
    }

    console.log(`${P} Folder not found. Creating "${name}"…`);
    const createRes = await fetch(DRIVE_FILES, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' }),
    });
    console.log(`${P} ensureFolder create status:`, createRes.status);
    const created = await createRes.json();
    logJson('ensureFolder create response', created);
    console.log(`${P} Created folder id:`, created?.id);
    return created.id;
  } catch (e: any) {
    console.error(`${P} ensureFolder error:`, e?.message || e);
    throw e;
  }
}

export async function uploadJsonVisible(accessToken: string, obj: any, folderName?: string) {
  console.log(`${P} uploadJsonVisible → start. folderName="${folderName || 'MyApp Backups'}"`);
  const folderId = await ensureFolder(accessToken, folderName || 'MyApp Backups');

  const fileName = `backup-${new Date().toISOString().slice(0, 10)}.json`;
  const meta = { name: fileName, parents: [folderId] };
  const bodyStr = JSON.stringify(obj);
  console.log(`${P} uploadJsonVisible → fileName=${fileName}, bytes=${bodyStr.length}`);

  const { body, boundary } = makeMultipart(meta, bodyStr, 'application/json');

  const url = `${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name,parents`;
  console.log(`${P} POST ${url}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  console.log(`${P} uploadJsonVisible status:`, res.status);

  const json = await res.json().catch(async () => {
    const text = await res.text();
    console.log(`${P} uploadJsonVisible non-JSON response:`, text?.slice(0, 500));
    return { _raw: text };
  });
  logJson('uploadJsonVisible response', json);

  if (!res.ok) {
    throw new Error(`Drive upload failed (${res.status}): ${JSON.stringify(json)}`);
  }
  console.log(`${P} uploadJsonVisible done:`, json?.id, json?.name);
  return json; // { id, name }
}

// Hidden private storage (not visible in Drive UI)
export async function uploadJsonHidden(accessToken: string, obj: any) {
  console.log(`${P} uploadJsonHidden → start`);
  const fileName = `backup-${new Date().toISOString().slice(0, 10)}.json`;
  const meta = { name: fileName, parents: ['appDataFolder'] };
  const bodyStr = JSON.stringify(obj);
  console.log(`${P} uploadJsonHidden → fileName=${fileName}, bytes=${bodyStr.length}`);

  const { body, boundary } = makeMultipart(meta, bodyStr, 'application/json');

  const url = `${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name,parents`;
  console.log(`${P} POST ${url}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  console.log(`${P} uploadJsonHidden status:`, res.status);

  const json = await res.json().catch(async () => {
    const text = await res.text();
    console.log(`${P} uploadJsonHidden non-JSON response:`, text?.slice(0, 500));
    return { _raw: text };
  });
  logJson('uploadJsonHidden response', json);

  if (!res.ok) {
    throw new Error(`Drive upload failed (${res.status}): ${JSON.stringify(json)}`);
  }
  console.log(`${P} uploadJsonHidden done:`, json?.id, json?.name);
  return json;
}


// find the newest "backup-*.json" in a folder
export async function findLatestDriveBackup(accessToken: string, folderName = 'EarthID Backups') {
  const folderId = await ensureFolder(accessToken, folderName); // ok if it creates; if empty, we’ll get none
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false and name contains 'backup-' and name contains '.json'`);
  const url = `${DRIVE_FILES}?q=${q}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)&pageSize=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }});
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
  const json = await res.json();
  const file = json?.files?.[0];
  return file || null;
}

export async function downloadDriveFileAsText(accessToken: string, fileId: string) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }});
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return res.text();
}