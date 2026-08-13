import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
  TouchableOpacity,
  View
} from 'react-native';
import { requestResetPin } from '../api/AuthAgent';
import { COLORS } from '../Composants/themeConfig';
import PhoneCountryInput from '../Composants/PhoneCountryInput';

export default function ForgotPinScreen() {
  const router = useRouter();

  const [countryCode, setCountryCode] = useState('ML');
  const [callingCode, setCallingCode] = useState('223');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestReset = async () => {
    if (!phoneNumber || phoneNumber.length < 4) {
      Alert.alert("Numéro invalide", "Veuillez saisir un numéro de téléphone correct.");
      return;
    }

    setLoading(true);
    const fullPhoneNumber = `+${callingCode}${phoneNumber}`;
    const result = await requestResetPin({ phone: fullPhoneNumber });
    setLoading(false);

    if (result.ok) {
      setSuccessMessage(
        result.data?.message || "Un e-mail contenant le lien de réinitialisation a été envoyé."
      );
      setSent(true);
    } else {
      const errorMessage =
        result.error?.message || result.error?.detail || "Impossible d'envoyer la demande. Vérifiez le numéro saisi.";
      Alert.alert("Échec de la demande", errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome name="arrow-left" size={20} color={COLORS.secondary} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image source={require('../assets/LogoMapAction.png')} style={styles.logo} resizeMode="contain" />
          </View>

          {sent ? (
            <View style={styles.successBlock}>
              <View style={styles.successIconCircle}>
                <Ionicons name="mail-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>E-mail envoyé</Text>
              <Text style={styles.description}>{successMessage}</Text>
              <Text style={styles.hint}>
                Ouvrez votre boîte e-mail, cliquez sur le lien reçu et choisissez votre nouveau code PIN. Revenez ensuite vous connecter ici.
              </Text>

              <TouchableOpacity style={styles.mainButton} onPress={() => router.back()}>
                <Text style={styles.mainButtonText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.textSection}>
                <Text style={styles.title}>Code PIN oublié</Text>
                <Text style={styles.description}>
                  Saisissez le numéro de téléphone lié à votre compte agent.{"\n"}Un e-mail de réinitialisation vous sera envoyé.
                </Text>
              </View>

              <PhoneCountryInput
                countryCode={countryCode}
                callingCode={callingCode}
                phoneNumber={phoneNumber}
                onCountryChange={(cca2, calling) => { setCountryCode(cca2); setCallingCode(calling); }}
                onPhoneNumberChange={setPhoneNumber}
                containerStyle={{ marginBottom: 25 }}
              />

              <TouchableOpacity
                style={[styles.mainButton, loading && { opacity: 0.8 }]}
                onPress={handleRequestReset}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainButtonText}>Envoyer le lien</Text>}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, zIndex: 99, elevation: 2 },
  scrollContent: {
    paddingHorizontal: 25,
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 50
  },
  logoContainer: { marginTop: 30, marginBottom: 30 },
  logo: { width: 120, height: 120 },
  textSection: { alignItems: 'center', marginBottom: 35 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 10, textAlign: 'center' },
  description: { fontSize: 14, color: COLORS.gray1, textAlign: 'center', paddingHorizontal: 10, lineHeight: 20 },
  mainButton: { width: '100%', height: 55, backgroundColor: COLORS.primary, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 3, marginTop: 10 },
  mainButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  successBlock: { alignItems: 'center', width: '100%' },
  successIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  hint: { fontSize: 13, color: COLORS.gray1, textAlign: 'center', lineHeight: 19, marginTop: 15, marginBottom: 25 },
});
