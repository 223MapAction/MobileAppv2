import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_CONFIG = {
  androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
  // webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
};