import { secp256k1 } from '@noble/curves/secp256k1';
import { fromByteArray as u8ToB64 } from 'base64-js';

// Hermes-safe UTF-8
const utf8Bytes = (str: string) =>
  new Uint8Array([...unescape(encodeURIComponent(str))].map(c => c.charCodeAt(0)));

const hexToBytes = (hexIn: string) => {
  let hex = hexIn.startsWith('0x') ? hexIn.slice(2) : hexIn;
  if (hex.length % 2) hex = '0' + hex;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
};

const toBase64Url = (b64: string) =>
  b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

export async function signPkceSecp256k1_raw(challenge: string, privHex: string) {
  console.log("=== signPkceSecp256k1_raw START ===");
  console.log("[Input] Challenge:", challenge);
  console.log("[Input] Private Key (hex):", privHex);

  const msg = utf8Bytes(challenge);
  const priv = hexToBytes(privHex);

  console.log("[signPkceSecp256k1_raw] Signing message (utf8 bytes):", msg);
  console.log("[signPkceSecp256k1_raw] Private key bytes:", priv);

  try {
    // noble-curves returns a Signature object
    const sigObj = await secp256k1.sign(msg, priv, { der: false /* no DER; compact later */, /* recovered:false */ });
    console.log("[signPkceSecp256k1_raw] Signature object:", sigObj);

    // Get 64-byte compact r||s
    const sigBytes = sigObj.toCompactRawBytes();
    console.log("[signPkceSecp256k1_raw] Compact signature bytes length:", sigBytes.length);
    console.log("[signPkceSecp256k1_raw] Compact signature bytes:", sigBytes);

    const sigB64Url = toBase64Url(u8ToB64(sigBytes));
    console.log("[signPkceSecp256k1_raw] Final Signature (base64url):", sigB64Url);
    console.log("=== signPkceSecp256k1_raw END ===");
    return sigB64Url;
  } catch (e) {
    console.log("[signPkceSecp256k1_raw] ERROR:", e);
    throw e;
  }
}
