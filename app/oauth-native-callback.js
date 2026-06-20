import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function OAuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    console.log("🎯 Route d'interception Clerk touchée avec succès !");
    
    // On laisse un mini délai pour que Clerk finisse de sauvegarder la session en tâche de fond
    const timer = setTimeout(() => {
      // On redirige proprement vers tes onglets
      router.replace("/(tabs)");
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
      <ActivityIndicator size="large" color="#0056B3" />
    </View>
  );
}