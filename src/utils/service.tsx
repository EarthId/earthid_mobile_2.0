import { newssiApiKey, ssiApiKey } from "./earthid_account";

export const postFormData = async (requestURI: string, payload: any) => {
  console.log("[postFormData] URL:", requestURI);
  console.log("[postFormData] Payload:", payload);

  try {
    const formData = new FormData();
    formData.append('image', { uri: payload?.uri, name: payload?.name, type: payload?.type });

    const response = await fetch(requestURI, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    console.log("[postFormData] Response status:", response.status);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    return response;
  } catch (error) {
    console.error("Error in postFormData:", error);
    throw error;
  }
};

export const postCall = (uri: string, payload?: any, method: string = "POST"): Promise<any> => {
  console.log("[postCall] URL:", uri);
  console.log("[postCall] Method:", method);
  console.log("[postCall] Payload:", payload);

  return fetch(uri, {
    method,
    headers: {
      "Content-Type": "application/json",
      authkey: "fae2622d-7b73-4fc6-a536-202cabe75187",
    },
    body: JSON.stringify(payload),
  });
};

export const fetchParams = (uri: string, payload: any, method: string = "DELETE"): Promise<any> => {
  console.log("[fetchParams] URL:", uri);
  console.log("[fetchParams] Payload:", payload);

  return fetch(uri, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export const getCall = (uri: string, method: string = "GET"): any => {
  console.log("[getCall] URL:", uri);
  return fetch(uri);
};

export const getCallWithHeader = (uri: string, method: string = "GET"): any => {
  console.log("[getCallWithHeader] URL:", uri);
  return fetch(uri, {
    method,
    headers: {
      "Content-Type": "application/json",
      authkey: "fae2622d-7b73-4fc6-a536-202cabe75187",
    },
  });
};

export const ssiGetCall = async (uri: string, method: string = "GET", key: string): Promise<any> => {
  console.log("[ssiGetCall] URL:", uri);
  console.log("[ssiGetCall] PublicKey:", key);

  try {
    const response = await fetch(uri, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": ssiApiKey,
        publicKey: key,
      },
    });

    console.log("[ssiGetCall] Response status:", response.status);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    return response;
  } catch (error) {
    console.error("Error in ssiGetCall:", error);
    throw error;
  }
};

export const newssiGetCall = async (uri: string, method: string = "GET", key: string): Promise<any> => {
  console.log("[newssiGetCall] URL:", uri);
  console.log("[newssiGetCall] PublicKey:", key);

  try {
    const response = await fetch(uri, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": newssiApiKey,
        publicKey: key,
      },
    });

    console.log("[newssiGetCall] Response status:", response.status);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    return response;
  } catch (error) {
    console.error("Error in newssiGetCall:", error);
    throw error;
  }
};

export const ssiPostCall = async (uri: string, payload?: any, method: string = "POST"): Promise<any> => {
  console.log("[ssiPostCall] URL:", uri);
  console.log("[ssiPostCall] Payload:", payload);

  try {
    const response = await fetch(uri, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": ssiApiKey,
      },
      body: JSON.stringify(payload),
    });

    console.log("[ssiPostCall] Response status:", response.status);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    return response;
  } catch (error) {
    console.error("Error in ssiPostCall:", error);
    throw error;
  }
};

export const newssiPostCall = async (uri: string, payload?: any, method: string = "POST", key?: any): Promise<any> => {
  console.log("[newssiPostCall] URL:", uri);
  console.log("[newssiPostCall] PrivateKey:", key);
  console.log("[newssiPostCall] Payload:", payload);

  try {
    const response = await fetch(uri, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": newssiApiKey,
        privateKey: key,
      },
      body: JSON.stringify(payload),
    });

    console.log("[newssiPostCall] Response status:", response.status);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    return response;
  } catch (error) {
    console.error("Error in newssiPostCall:", error);
    throw error;
  }
};
