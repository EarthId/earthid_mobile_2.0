// api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "https://did.myearth.id/v2";
const API_KEY = "123e4567-e89b-12d3-a456-426614174000";

export interface DidDetails {
  did: string;
  publicKey: string;
  privateKey: string;
  method: string;
  keyType?: string;
  createdAt: string;
}

async function generateKeypair() {
  console.log("🔑 Requesting new keypair...");
  const res = await fetch(`${BASE_URL}/generate-keypair`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-api-key": API_KEY,
    },
  });

  if (!res.ok) {
    console.error("❌ Keypair request failed:", res.status);
    throw new Error(`Keypair request failed: ${res.status}`);
  }

  const data = await res.json();
  console.log("✅ Keypair generated:", data);
  return data;
}

async function createDid(publicKey: string) {
  console.log("🆔 Creating DID with publicKey:", publicKey);
  const res = await fetch(`${BASE_URL}/dids`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      publicKey,
      method: "earthid",
    }),
  });

  if (!res.ok) {
    console.error("❌ Create DID request failed:", res.status);
    throw new Error(`Create DID request failed: ${res.status}`);
  }

  const data = await res.json();
  console.log("✅ DID created:", data);
  return data;
}

export async function saveDidDetails(didDetails: DidDetails) {
  console.log("💾 Saving DID details to AsyncStorage...");
  await AsyncStorage.setItem("didDetails", JSON.stringify(didDetails));
  console.log("✅ DID details saved.");
  return didDetails;
}

export async function getDidDetails(): Promise<DidDetails | null> {
  console.log("📂 Retrieving DID details from AsyncStorage...");
  const stored = await AsyncStorage.getItem("didDetails");
  if (stored) {
    console.log("✅ Found DID details:", stored);
    return JSON.parse(stored);
  } else {
    console.log("⚠️ No DID details found.");
    return null;
  }
}

export async function clearDidDetails() {
  console.log("🗑️ Clearing DID details from AsyncStorage...");
  await AsyncStorage.removeItem("didDetails");
  console.log("✅ DID details cleared.");
}

/**
 * Main function to generate keypair → create DID → save locally
 */
export async function registernewDID(): Promise<DidDetails> {
  try {
    console.log("🚀 Starting DID registration process...");

    const keypair = await generateKeypair();
    const { publicKey, privateKey, keyType } = keypair;

    const didRes = await createDid(publicKey);
    const did = didRes.did ?? didRes.data?.did;

    const didDetails: DidDetails = {
      did,
      publicKey,
      privateKey,
      method: "earthid",
      keyType,
      createdAt: new Date().toISOString(),
    };

    console.log("📝 Final DID details to save:", didDetails);

    await saveDidDetails(didDetails);

    console.log("🎉 DID registration complete:", didDetails);
    return didDetails;
  } catch (err) {
    console.error("❌ Error during DID registration:", err);
    throw err;
  }
}
