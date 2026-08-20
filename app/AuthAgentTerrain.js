import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { loginAgent } from '../api/AuthAgent';
import { COLORS } from '../Composants/themeConfig';
import PhoneCountryInput from '../Composants/PhoneCountryInput';
import { registerPushToken } from '../hooks/usePushNotifications';
import { getAuthUser } from '../storage/authStorageAgent';

export default function AuthAgentTerrain() {
  const router = useRouter();

  const [countryCode, setCountryCode] = useState('ML');
  const [callingCode, setCallingCode] = useState('223');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("=== DIAGNOSTIC ESPACE AGENT TERRAIN ===");
    console.log("Initialisation du formulaire Agent de terrain");
    console.log("=======================================");
  }, []);

  // Sécurité : si cet écran est atteint directement (ex. bouton "Espace
  // Agent") alors qu'une session valide (non expirée) existe déjà, passer
  // directement à l'espace agent sans réafficher le formulaire.
  useEffect(() => {
    const checkExistingSession = async () => {
      const existingAgent = await getAuthUser();
      if (existingAgent) {
        router.replace('/(tabs_agent)');
      }
    };
    checkExistingSession();
  }, []);

  const handleAgentAuth = async () => {
    if (!phoneNumber || phoneNumber.length < 4) {
      Alert.alert("Numéro invalide", "Veuillez saisir un numéro de téléphone correct.");
      return;
    }
    if (!pinCode || pinCode.length !== 4) {
      Alert.alert("Code PIN invalide", "Le code PIN doit comporter 4 chiffres.");
      return;
    }

    setLoading(true);
    const fullPhoneNumber = `+${callingCode}${phoneNumber}`;
    
    const result = await loginAgent(fullPhoneNumber, pinCode);
    setLoading(false);

    if (result.ok) {
      const { access, user } = result.data;
      registerPushToken();

      console.log("-> [CHECK] Faut-il changer le PIN ?", user.must_change_pin);

      if (user.must_change_pin) {
        Alert.alert(
          "Sécurité requise", 
          "C'est votre première connexion. Vous devez modifier votre code PIN pour continuer.",
          [
            { 
              text: "Continuer", 
              onPress: () => router.push({
                pathname: '/ChangePinScreen',
                params: { 
                  oldPinFromLogin: pinCode,
                  tokenFromLogin: access 
                }
              }) 
            }
          ]
        );
      } else {
        router.replace('/(tabs_agent)'); 
      }
    } else {
      const errorMessage = result.error?.detail || result.error?.message || "Numéro de téléphone ou code PIN incorrect.";
      Alert.alert("Échec de connexion", errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Le bouton retour reste fixe en haut de l'écran pour être toujours accessible */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome name="arrow-left" size={20} color={COLORS.secondary} />
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image source={require('../assets/LogoMapAction.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.textSection}>
            <Text style={styles.title}>Authentifiez-vous</Text>
            <Text style={styles.description}>
              Veuillez vous authentifier pour pouvoir {"\n"}accéder à votre compte agent
            </Text>
          </View>

          <PhoneCountryInput
            countryCode={countryCode}
            callingCode={callingCode}
            phoneNumber={phoneNumber}
            onCountryChange={(cca2, calling) => { setCountryCode(cca2); setCallingCode(calling); }}
            onPhoneNumberChange={setPhoneNumber}
            containerStyle={{ marginBottom: 15 }}
          />

          <View style={styles.pinInputContainer}>
            <View style={styles.pinIconSelector}>
              <FontAwesome name="lock" size={22} color={COLORS.gray1} style={{ width: 25, textAlign: 'center' }} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Code PIN"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={true}
              value={pinCode}
              onChangeText={setPinCode}
            />
          </View>

          <TouchableOpacity 
            style={[styles.mainButton, loading && { opacity: 0.8 }]} 
            onPress={handleAgentAuth}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainButtonText}>S'authentifier</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPinLink}
            onPress={() => router.push('/ForgotPinScreen')}
          >
            <Text style={styles.forgotPinLinkText}>Code PIN oublié ?</Text>
          </TouchableOpacity>

          <View style={styles.securityNotice}>
            <FontAwesome name="shield" size={14} color={COLORS.gray1} />
            <Text style={styles.securityNoticeText}>Accès réservé au personnel autorisé</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, zIndex: 99, elevation: 2 },
  
  // Utilisation de scrollContent à la place de content
  scrollContent: { 
    paddingHorizontal: 25, 
    alignItems: 'center',
    paddingBottom: 40, // Marge en bas pour respirer lors du scroll clavier levé
    paddingTop: 50
  },
  
  logoContainer: { marginTop: 30, marginBottom: 30 },
  logo: { width: 120, height: 120 },
  textSection: { alignItems: 'center', marginBottom: 35 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 10 },
  description: { fontSize: 14, color: COLORS.gray1, textAlign: 'center', paddingHorizontal: 10, lineHeight: 20 },
  pinInputContainer: { flexDirection: 'row', width: '100%', height: 60, borderWidth: 1, borderColor: COLORS.gray2, borderRadius: 15, alignItems: 'center', paddingHorizontal: 15, backgroundColor: COLORS.white, marginBottom: 25 },
  pinIconSelector: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.gray2, paddingRight: 15, marginRight: 15, justifyContent: 'center' },
  input: { flex: 1, fontSize: 16, color: 'black' },
  mainButton: { width: '100%', height: 55, backgroundColor: COLORS.primary, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  mainButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  forgotPinLink: { marginTop: 18, paddingVertical: 6 },
  forgotPinLinkText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  securityNotice: { flexDirection: 'row', alignItems: 'center', marginTop: 30, gap: 8 },
  securityNoticeText: { color: COLORS.gray1, fontSize: 12, fontWeight: '500' }
});