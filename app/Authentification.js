import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { authorize } from 'react-native-app-auth';
import CountryPicker from 'react-native-country-picker-modal';
import { requestOtp } from '../api/Auth'; // Import de ton service API
import { COLORS } from '../Composants/themeConfig';
import { handleGoogleLoginFlow } from '../services/googleAuth'; // Ajuste le chemin selon ton projet

// Configuration OAuth Google pour react-native-app-auth
const googleConfig = {
  issuer: 'https://accounts.google.com',
  clientId: Platform.select({
    ios: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  }),
  redirectUrl: 'mapactionapp:/oauth2redirect', // Ton scheme synchronisé
  scopes: ['openid', 'profile', 'email'],
};

export default function LoginScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  
  const [countryCode, setCountryCode] = useState('ML'); 
  const [callingCode, setCallingCode] = useState('223');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // LOG DE SÉCURITÉ ET DE DIAGNOSTIC AU CHARGEMENT
  useEffect(() => {
    console.log("=== DIAGNOSTIC CONFIGURATION GOOGLE ===");
    console.log("Plateforme détectée :", Platform.OS);
    console.log("Clé Android (.env) :", process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID);
    console.log("Clé iOS (.env) :", process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS);
    console.log("Clé finale injectée dans googleConfig :", googleConfig.clientId);
    console.log("Redirect URL configuré :", googleConfig.redirectUrl);
    console.log("=======================================");
  }, []);

  // Fonction de connexion Google via react-native-app-auth
  const handleGoogleSignIn = async () => {
    console.log("-> Clic sur le bouton Google détecté.");
    
    if (!googleConfig.clientId) {
      console.error("-> Erreur : Le clientId est vide ou undefined ! Vérifie ton fichier .env.");
      Alert.alert("Erreur de configuration", "La clé d'authentification Google (clientId) est manquante.");
      return;
    }

    setLoading(true);
    try {
      console.log("-> Lancement du module natif d'authentification Google...");
      // 1. Déclencement du flux natif Google
      const authState = await authorize(googleConfig);
      console.log("-> [SUCCESS] Jeton d'accès récupéré avec succès :", authState.accessToken);

      // 2. Envoi du token à ton flux Django
      const mockDispatch = (action) => console.log("-> Dispatch Redux :", action);
      
      console.log("-> Envoi du token vers handleGoogleLoginFlow...");
      await handleGoogleLoginFlow(authState.accessToken, mockDispatch, router);

    } catch (error) {
      console.error("-> [ERROR] Échec de l'authentification Google :", error);
      Alert.alert(
        "Connexion annulée", 
        "Impossible de se connecter avec Google. Vérifie tes paramètres ou réessaye."
      );
    } finally {
      setLoading(false);
    }
  };

  // Connexion classique par OTP
  const handleAuth = async () => {
    if (!phoneNumber || phoneNumber.length < 4) {
      Alert.alert("Numéro invalide", "Veuillez saisir un numéro de téléphone correct.");
      return;
    }

    setLoading(true);
    const fullPhoneNumber = `+${callingCode}${phoneNumber}`;

    try {
      const result = await requestOtp(fullPhoneNumber);
      if (result.ok) {
        navigation.navigate('CodeConfirmation', { phoneNumber: fullPhoneNumber });
      } else {
        const errorMessage = result.error?.message || "Une erreur est survenue lors de l'envoi du code.";
        Alert.alert("Erreur", errorMessage);
      }
    } catch (error) {
      Alert.alert("Erreur réseau", "Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <TouchableOpacity 
        style={styles.agentButton} 
        onPress={() => router.push('/AuthAgentTerrain')}
      >
        <Text style={styles.agentButtonText}>Espace Agent</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/LogoMapAction.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* TITRE & DESCRIPTION */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Authentifiez-vous</Text>
          <Text style={styles.description}>
            Veuillez vous authentifier pour pouvoir {"\n"}accéder à votre compte
          </Text>
        </View>

        {/* INPUT TÉLÉPHONE AVEC DRAPEAU */}
        <View style={styles.phoneInputContainer}>
          <View style={styles.countryPickerSelector}>
            <CountryPicker
              countryCode={countryCode}
              withFilter withFlag withCallingCode withEmoji
              onSelect={(country) => {
                setCountryCode(country.cca2);
                setCallingCode(country.callingCode[0]);
              }}
            />
            <Text style={styles.callingCodeText}>+{callingCode}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Numéro de téléphone"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        {/* BOUTON S'AUTHENTIFIER */}
        <TouchableOpacity 
          style={[styles.mainButton, loading && { opacity: 0.8 }]} 
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.mainButtonText}>S'authentifier</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OU</Text>
          <View style={styles.line} />
        </View>

        {/* BOUTON GOOGLE NATIVE-APP-AUTH */}
        <TouchableOpacity 
          style={styles.socialButton} 
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <FontAwesome name="google" size={20} color="#DB4437" />
          <Text style={styles.socialButtonText}>Continuer avec Google</Text>
        </TouchableOpacity>

        {/* AUTRES BOUTONS */}
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="apple" size={20} color="black" />
          <Text style={styles.socialButtonText}>Continuer avec Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.guestButton} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.guestButtonText}>Continuer sans compte</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  agentButton: { position: 'absolute', top: 50, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, zIndex: 99, elevation: 2, borderBottomColor: COLORS.primary },
  agentButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 25, alignItems: 'center' },
  logoContainer: { marginTop: 60, marginBottom: 40 },
  logo: { width: 120, height: 120 },
  textSection: { alignItems: 'center', marginBottom: 35 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 10 },
  description: { fontSize: 14, color: COLORS.gray1, textAlign: 'center', paddingHorizontal: 10, lineHeight: 20 },
  phoneInputContainer: { flexDirection: 'row', width: '100%', height: 60, borderWidth: 1, borderColor: COLORS.gray2, borderRadius: 15, alignItems: 'center', paddingHorizontal: 15, backgroundColor: COLORS.white, marginBottom: 20 },
  countryPickerSelector: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.gray2, paddingRight: 10, marginRight: 15 },
  callingCodeText: { fontSize: 16, fontWeight: '600', marginLeft: 5 },
  input: { flex: 1, fontSize: 16, color: 'black' },
  mainButton: { width: '100%', height: 55, backgroundColor: COLORS.primary, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  mainButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30, width: '100%' },
  line: { flex: 1, height: 1, backgroundColor: COLORS.gray2 },
  orText: { marginHorizontal: 15, color: COLORS.gray1, fontWeight: '600' },
  socialButton: { flexDirection: 'row', width: '100%', height: 55, borderWidth: 1, borderColor: COLORS.gray2, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  socialButtonText: { marginLeft: 10, fontSize: 15, fontWeight: '600', color: COLORS.secondary },
  guestButton: { marginTop: 15, paddingVertical: 10, width: '100%', alignItems: 'center' },
  guestButtonText: { color: COLORS.gray1, fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
});