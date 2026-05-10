import NetInfo from '@react-native-community/netinfo';
import { Stack } from "expo-router";
import { useEffect } from "react";
import { OfflineManager } from '../api/offlineManager';

export default function RootLayout() {

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
  );
}