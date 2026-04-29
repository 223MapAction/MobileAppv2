import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      
        <Stack.Screen 
          name="SignalerIncidentScreen" 
          options={{ 
            presentation: 'modal', // Animation de bas en haut
            headerShown: false,
            gestureEnabled: true // Permet de fermer en glissant vers le bas
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