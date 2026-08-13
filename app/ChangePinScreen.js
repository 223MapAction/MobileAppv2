import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../Composants/themeConfig';
import { changeAgentPin } from '../api/AuthAgent';

export default function ChangePinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 🔑 Récupération instantanée des données partagées sans passer par le Storage encombrant
  const oldPin = params.oldPinFromLogin || '';
  const token = params.tokenFromLogin || null; 

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("=== DIAGNOSTIC CHANGEMENT CODE PIN ===");
    console.log("Jeton d'authentification présent :", token ? "OUI (Prêt)" : "NON (Erreur)");
    console.log("=======================================");
  }, [token]);

  const handleChangePin = async () => {
    // Validations de sécurité locales
    if (newPin.length !== 4 || confirmPin.length !== 4) {
      Alert.alert("Format incorrect", "Le code PIN doit comporter exactement 4 chiffres.");
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert("Erreur de correspondance", "Les deux codes PIN saisis ne sont pas identiques.");
      return;
    }

    if (oldPin === newPin) {
      Alert.alert("Attention", "Le nouveau PIN doit être différent du code actuel.");
      return;
    }

    // Protection contre les combinaisons basiques
    const forbiddenPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
    if (forbiddenPins.includes(newPin)) {
      Alert.alert("Sécurité faible", "Veuillez choisir un code PIN plus complexe (Évitez 1234, 0000...).");
      return;
    }

    setLoading(true);
    console.log("-> [START] Envoi de la mise à jour obligatoire du PIN au serveur...");

    try {
      // 🔥 APPEL API RÉEL AVEC LES LIENS TRANSMIS
      const result = await changeAgentPin(oldPin, newPin, token);
      setLoading(false);

      if (result.ok) {
        console.log("-> [SUCCESS] Code PIN mis à jour avec succès.");
        Alert.alert(
          "Mise à jour réussie",
          "Votre code PIN a été modifié avec succès. Vous pouvez maintenant accéder à l'application.",
          [
            { 
              text: "Super", 
              onPress: () => router.replace('/(tabs_agent)') 
            }
          ]
        );
      } else {
        const errorMsg = result.error?.message || result.error?.detail || "Le serveur a refusé la modification.";
        Alert.alert("Échec", errorMsg);
      }

    } catch (error) {
      console.error("-> [ERROR] Échec de la modification du PIN :", error);
      Alert.alert("Erreur réseau", "Impossible de modifier le code PIN. Réessayez plus tard.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={20} color={COLORS.secondary} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image source={require('../assets/LogoMapAction.png')} style={styles.logo} resizeMode="contain" />
            </View>

            <View style={styles.textSection}>
              <Text style={styles.title}>Nouveau Code PIN</Text>
              <Text style={styles.description}>
                Pour des raisons de sécurité, veuillez définir {"\n"}votre code secret personnel à 4 chiffres.
              </Text>
            </View>

            {/* INPUT NOUVEAU PIN */}
            <View style={styles.pinInputContainer}>
              <View style={styles.pinIconSelector}>
                <FontAwesome name="key" size={20} color={COLORS.gray1} style={{ width: 25, textAlign: 'center' }} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nouveau Code(4 chiffres)"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={true}
                value={newPin}
                onChangeText={setNewPin}
              />
            </View>

            {/* INPUT CONFIRMATION DU PIN */}
            <View style={styles.pinInputContainer}>
              <View style={styles.pinIconSelector}>
                <FontAwesome name="shield" size={20} color={COLORS.gray1} style={{ width: 25, textAlign: 'center' }} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Confirmer le Code PIN"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={true}
                value={confirmPin}
                onChangeText={setConfirmPin}
              />
            </View>

            {/* BOUTON DE VALIDATION */}
            <TouchableOpacity 
              style={[styles.mainButton, loading && { opacity: 0.8 }]} 
              onPress={handleChangePin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainButtonText}>Enregistrer le PIN</Text>}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  backButton: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, zIndex: 99, elevation: 2 },
  content: { flex: 1, paddingHorizontal: 25, alignItems: 'center', paddingBottom: 30 },
  logoContainer: { marginTop: 60, marginBottom: 40 },
  logo: { width: 120, height: 120 },
  textSection: { alignItems: 'center', marginBottom: 35 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 10 },
  description: { fontSize: 14, color: COLORS.gray1, textAlign: 'center', paddingHorizontal: 15, lineHeight: 20 },
  pinInputContainer: { flexDirection: 'row', width: '100%', height: 60, borderWidth: 1, borderColor: COLORS.gray2, borderRadius: 15, alignItems: 'center', paddingHorizontal: 15, backgroundColor: COLORS.white, marginBottom: 15 },
  pinIconSelector: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.gray2, paddingRight: 15, marginRight: 15, justifyContent: 'center' },
  input: { flex: 1, fontSize: 16, color: 'black' },
  mainButton: { width: '100%', height: 55, backgroundColor: COLORS.primary, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 3, marginTop: 15 },
  mainButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});