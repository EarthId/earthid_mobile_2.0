import axios, { AxiosRequestConfig} from 'axios';


export const addConsent = async (data: any) => {

    const requestData: AxiosRequestConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://apitest.myearth.id/consents',
        headers: { 
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(data)
      };
    
      try {
        const response = await axios.request(requestData);
        console.log("Consent Api response============================",JSON.stringify(response.data));
        return response.data
      } catch (error) {
        console.error(error);
      }
}

// utils/consentApis.ts
// Minimal fetch-based APIs + verbose logs.
// Ensure this BASE matches the environment you are calling.
const BASE = "https://stage-apiv2.myearth.id/consents";

export type ConsentRow = {
  id?: number;                 // present in your response
  earthId: string;
  flowName: string;            // e.g. "Login"
  relyingParty: string;        // e.g. "EarthID"
  timeDuration: number;
  isConsentActive: boolean;
  purpose?: string;
  description?: string;
  timestamp?: string;          // present in your response
  consentedOn?: string | null;
  revokedOn?: string | null;
};

// ------- READ -------
export async function getConsentsByEarthId(earthId: string): Promise<ConsentRow[]> {
  const url = `${BASE}/${encodeURIComponent(earthId)}`;
  console.log("[API] GET", url);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.log("[API] GET ✗", res.status, text);
    throw new Error(`Failed to load consents: ${res.status}`);
  }
  const json = await res.json();
  console.log("[API] GET ✓ count:", Array.isArray(json) ? json.length : 0);
  return json;
}

// ------- UPDATE (composite: earthId/flowName/relyingParty) -------
export async function updateConsentToggle(
  earthId: string,
  flowName: string,
  relyingParty: string,
  nextActive: boolean
): Promise<ConsentRow> {
  const url = `${BASE}/${encodeURIComponent(earthId)}/${encodeURIComponent(flowName)}/${encodeURIComponent(relyingParty)}`;
  const body = JSON.stringify({ isConsentActive: nextActive });
  console.log("[API] PATCH (composite) →", url, body);
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  let json: any;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    console.log("[API] PATCH (composite) ✗", res.status, json);
    throw new Error(`Failed to update consent: ${res.status}`);
  }
  console.log("[API] PATCH (composite) ✓", json);
  return json;
}

// ------- UPDATE (by id) -------
export async function updateConsentById(id: number, nextActive: boolean): Promise<ConsentRow> {
  const url = `${BASE}/id/${id}`;
  const body = JSON.stringify({ isConsentActive: nextActive });
  console.log("[API] PATCH (id) →", url, body);
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  let json: any;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    console.log("[API] PATCH (id) ✗", res.status, json);
    throw new Error(`Failed to update consent id=${id}: ${res.status}`);
  }
  console.log("[API] PATCH (id) ✓", json);
  return json;
}
