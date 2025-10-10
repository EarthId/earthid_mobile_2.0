// src/services/dropbox.ts
import { authorize, refresh, AuthConfiguration } from 'react-native-app-auth';
import { DROPBOX } from '../config/dropboxClientConfig';

const P = '[Dropbox]';

// OAuth config for react-native-app-auth
const dropboxAuthConfig: AuthConfiguration = {
  clientId: DROPBOX.APP_KEY,
  redirectUrl: DROPBOX.REDIRECT_URL, // com.earthid.app://oauthredirect
  usePKCE: true,
  scopes: ['files.content.write', 'files.content.read'],
  serviceConfiguration: {
    authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
    tokenEndpoint:        'https://api.dropboxapi.com/oauth2/token',
  },
  additionalParameters: {
    token_access_type: 'offline',
  },
};


// Persist tokens the way you prefer; simplest: keep in memory for session
let _tokens: { accessToken: string; refreshToken?: string; accessTokenExpirationDate?: string } | null = null;

export async function signInDropbox() {
  console.log(P, 'authorize() starting');
  const result = await authorize(dropboxAuthConfig);
  console.log(P, 'authorized; has refresh?', !!result.refreshToken);
  _tokens = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    accessTokenExpirationDate: result.accessTokenExpirationDate,
  };
  return _tokens;
}

export function getDropboxTokens() {
  if (!_tokens) throw new Error('Not signed in to Dropbox');
  return _tokens;
}

export async function refreshDropboxToken() {
  if (!_tokens?.refreshToken) throw new Error('No refresh token');
  const res = await refresh(dropboxAuthConfig, { refreshToken: _tokens.refreshToken! });
  _tokens = {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken ?? _tokens.refreshToken,
    accessTokenExpirationDate: res.accessTokenExpirationDate,
  };
  return _tokens;
}

// Ensure a folder exists (no-op if it already does)
export async function ensureDropboxFolder(accessToken: string, folder: string) {
  const path = folder.startsWith('/') ? folder : `/${folder}`;
  const url = 'https://api.dropboxapi.com/2/files/create_folder_v2';
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, autorename: true }),
  });

  if (res.ok) return true;

  const text = await res.text();
  // If folder exists, Dropbox returns a conflict error we can ignore
  if (text.includes('path/conflict/folder') || text.includes('conflict')) {
    console.log(P, 'folder already exists:', folder);
    return true;
  }
  console.log(P, 'ensure folder response:', text);
  throw new Error(`Dropbox create_folder_v2 failed: ${res.status}`);
}

// Upload small/medium file in a single call (<150MB)
export async function uploadJsonToDropbox(
  accessToken: string,
  payload: any,
  folder = 'EarthID Backups',
  filePrefix = 'backup'
) {
  const fileName = `${filePrefix}-${new Date().toISOString().slice(0,10)}.json`;
  const path = `/${folder}/${fileName}`;

  await ensureDropboxFolder(accessToken, `/${folder}`);

  const uploadUrl = 'https://content.dropboxapi.com/2/files/upload';
  const args = { path, mode: 'add', autorename: true, mute: true, strict_conflict: false };

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify(args),
      'Content-Type': 'application/octet-stream',
    },
    body: JSON.stringify(payload), // raw bytes (stringified JSON)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox upload failed (${res.status}): ${err}`);
  }
  return res.json(); // metadata with id, path_lower, name, etc.
}

/* If your JSON ever grows >150MB, switch to chunked upload:
   /2/files/upload_session/start, /append_v2, /finish
   I can provide a chunked version if needed. */


   // --- RESTORE helpers (Dropbox) ---

export async function listDropboxFolder(accessToken: string, path = '/EarthID Backups') {
  const url = 'https://api.dropboxapi.com/2/files/list_folder';
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, recursive: false, include_non_downloadable_files: false, limit: 200 }),
  });
  if (!res.ok) throw new Error(`Dropbox list_folder failed: ${res.status} ${await res.text()}`);
  return res.json(); // { entries: [...] }
}

export async function downloadDropboxFileAsText(accessToken: string, path: string) {
  const url = 'https://content.dropboxapi.com/2/files/download';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path }),
    },
  });
  if (!res.ok) throw new Error(`Dropbox download failed: ${res.status} ${await res.text()}`);
  return res.text();
}

export async function findLatestDropboxBackup(accessToken: string, folder = '/EarthID Backups') {
  const json = await listDropboxFolder(accessToken, folder.startsWith('/') ? folder : `/${folder}`);
  const files = (json?.entries || []).filter((e: any) => e['.tag'] === 'file');
  const candidates = files.filter((f: any) => typeof f.name === 'string' && f.name.startsWith('backup-') && f.name.endsWith('.json'));
  if (!candidates.length) return null;
  // prefer server_modified if present
  candidates.sort((a: any, b: any) => new Date(b.server_modified || b.client_modified).getTime() - new Date(a.server_modified || a.client_modified).getTime());
  return candidates[0]; // { name, path_lower, id, ... }
}
