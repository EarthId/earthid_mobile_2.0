// src/config/googleClientConfig.ts
// ⚠️ OK to keep *Client IDs* here. DO NOT put the Web Client *Secret* in mobile apps.

export type GoogleClientConfig = {
  WEB_CLIENT_ID?: string; // Web OAuth client ID (required for offline/refresh)
  IOS_CLIENT_ID?: string; // iOS OAuth client ID (harmless on Android)
};

// Simple single-config:
export const GOOGLE: GoogleClientConfig = {
  WEB_CLIENT_ID: '414243299791-tpeodn7s56e2c5k2b5s98390ept40v0i.apps.googleusercontent.com',
  IOS_CLIENT_ID: '414243299791-n2bn9gf2d2h894ml95aov1ka158dnqga.apps.googleusercontent.com',
};

// If you want per-build configs later, you can do:
// export const GOOGLE_BY_BUILD: Record<'debug' | 'release', GoogleClientConfig> = {
//   debug: { WEB_CLIENT_ID: '...', IOS_CLIENT_ID: '...' },
//   release: { WEB_CLIENT_ID: '...', IOS_CLIENT_ID: '...' },
// };
