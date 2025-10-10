export const AES_ENCRYPTION_SALT = "qaszxswedcvfrtgbnhyujmkik";
import DeviceInfo from "react-native-device-info";
import CryptoJS from "react-native-crypto-js";
import { iv, keyutf } from "./earthid_account";
import { IUser } from "../typings/AccountCreation/IUser";
import { isArray } from "lodash";
import { fs } from "rn-fetch-blob";
export const encrptedEmail = (email: string): string => {
  return CryptoJS.AES.encrypt(
    email.toString().trim(),
    AES_ENCRYPTION_SALT
  ).toString();
};
export const getDeviceId = async () => {
  const deviceToken = await DeviceInfo.getDeviceId();
  return deviceToken;
};

export const getDeviceName = async () => {
  const deviceToken = await DeviceInfo.getApplicationName();
  return deviceToken;
};

export const getEncrptedUserDetais = (data: any): string[] => {
  var dataArray = [
    data.fullName,
    data.mobileNumber,
    data.email,
    data.dateOfBirth,
  ];
  return dataArray.map((element) => {
    let encryptedData = CryptoJS.AES.encrypt(element, keyutf, { iv: iv });
    return encryptedData.toString();
  });
};
export const decryption = (encryptedString: string): any => {
  return CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(encryptedString) },
    keyutf,
    {
      iv: iv,
    }
  );
};
export const dateTime = () => {
  var date = new Date().getDate();
  var month = new Date().getMonth() + 1;
  var year = new Date().getFullYear();
  var hours = new Date().getHours();
  var min = new Date().getMinutes();
  var sec = new Date().getSeconds();
  var _date = date + "/" + month + "/" + year;
  var _time = hours + ":" + min + ":" + sec;
  return {
    time: _time,
    date: _date,
  };
};

export const getUserDetails = (response: string[]): IUser => {
  var bytes,
    name,
    mobile,
    email,
    dob = "",
    earthId,
    mobileApproved,
    emailApproved,
    score,
    rewardPoint;


  let responseArray = response[0].split("<=>%");
  bytes = decryption(responseArray[0]);
  name = bytes.toString(CryptoJS.enc.Utf8);

  bytes = decryption(responseArray[1]);
  mobile = bytes.toString(CryptoJS.enc.Utf8);

  bytes = decryption(responseArray[2]);
  email = bytes.toString(CryptoJS.enc.Utf8);

  earthId = response[1];

  dob = "";

  mobileApproved = parseInt(response[1]) === 1 ? true : false;
  emailApproved = parseInt(response[2]) === 1 ? true : false;
  score = "23";
  rewardPoint = "33";

  return {
    name,
    mobile,
    email,
    dob,
    earthId,
    mobileApproved,
    emailApproved,
    score,
    rewardPoint,
  };
};

export const blobToBase64 = async (data: any, encoding = "base64") => {
  return fs.readFile(data, encoding);
};


