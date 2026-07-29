import { ClerkProvider } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { OfflineManager } from '../api/offlineManager';
import { OfflineManagerAgent } from '../api/OfflineManagerAgent';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const tokenCache = {
  async getToken(key) {
    try { return await AsyncStorage.getItem(key); } catch { return null; }
  },
  async saveToken(key, value) {
    try { return await AsyncStorage.setItem(key, value); } catch { return; }
  },
};

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = (event) => {
    
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        OfflineManager.syncPendingIncidents();
        OfflineManagerAgent.syncPendingIncidents();
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="SignalerIncidentScreen" options={{ presentation: 'modal', gestureEnabled: true }} />
        <Stack.Screen name="(tabs)/scan" options={{ title: 'Scanner un incident' }} />
      </Stack>
    </ClerkProvider>
  );
}