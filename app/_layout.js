import { ClerkProvider } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';
import * as Linking from "expo-linking"; // 🚀 ÉTAPE 1 : Importation de expo-linking
import { Stack, useRouter } from "expo-router"; // 🔄 Ajout de useRouter
import { useEffect } from "react";
import { OfflineManager } from '../api/offlineManager';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn("Attention : EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY n'est pas définie dans ton fichier .env");
}

const tokenCache = {
  async getToken(key) {
    try {
      return AsyncStorage.getItem(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return AsyncStorage.setItem(key, value);
    } catch (err) {
      return;
    }
  },
};

export default function RootLayout() {
  const router = useRouter();


  useEffect(() => {
    const handleDeepLink = (event) => {
      console.log("🔗 Deep Link capturé par l'application :", event.url);
      
      if (event.url.includes("oauth-native-callback") || event.url.includes("session_id")) {
        console.log(" Retour OAuth détecté, redirection forcée vers l'accueil connecté !");
        
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 100);
      }
    };

    // Écouter les liens quand l'application est déjà ouverte en arrière-plan
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Vérifier si l'application a été ouverte initialement par un lien
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log("Connexion rétablie, tentative de synchronisation...");
        OfflineManager.syncPendingIncidents();
      }
    });

    const checkInitialSync = async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        OfflineManager.syncPendingIncidents();
      }
    };
    
    checkInitialSync();

    return () => unsubscribe();
  }, []);

  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY} 
      tokenCache={tokenCache}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
        <Stack.Screen 
          name="SignalerIncidentScreen" 
          options={{ 
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: true 
          }} 
        />
        <Stack.Screen 
          name="(tabs)/scan" 
          options={{ 
            headerShown: false,
            title: 'Scanner un incident' 
          }} 
        />
      </Stack>
    </ClerkProvider>
  );
}