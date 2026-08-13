// Ton OAuthCallbackScreen peut devenir ultra simple, juste visuel :
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function OAuthCallbackScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0056B3" />
      <Text style={styles.text}>Connexion en cours...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" },
  text: { marginTop: 15, color: "#333", fontSize: 14, fontWeight: "600" }
});