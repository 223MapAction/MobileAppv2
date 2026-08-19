import { ClerkProvider } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { OfflineManager } from '../api/offlineManager';
import { OfflineManagerAgent } from '../api/OfflineManagerAgent';
import { COLORS } from '../Composants/themeConfig';
import ErrorBoundary from '../Composants/ErrorBoundary';
import { registerPushToken, usePushNotificationListeners } from '../hooks/usePushNotifications';

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

  usePushNotificationListeners();

  // Ré-enregistre le token FCM au démarrage si une session citoyen existe
  // déjà (relance de l'app) — après une connexion réussie, l'enregistrement
  // se fait directement depuis l'écran de login (voir CodeConfirmation.js
  // et services/googleAuth.js).
  useEffect(() => {
    registerPushToken();
  }, []);

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

  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <View style={styles.missingKeyContainer}>
        <Text style={styles.missingKeyTitle}>Configuration manquante</Text>
        <Text style={styles.missingKeyMessage}>
          La configuration de connexion est introuvable. Merci de contacter le support technique.
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="SignalerIncidentScreen" options={{ presentation: 'modal', gestureEnabled: true }} />
          <Stack.Screen name="(tabs)/scan" options={{ title: 'Scanner un incident' }} />
        </Stack>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  missingKeyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.white,
  },
  missingKeyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  missingKeyMessage: {
    fontSize: 15,
    color: COLORS.gray1,
    textAlign: 'center',
  },
});