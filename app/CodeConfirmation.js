import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { verifyOtpCode } from '../api/Auth';
import { COLORS } from '../Composants/themeConfig';
import { setAuthToken, setAuthUser } from '../storage/authStorage';

export default function OtpConfirmationScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { phoneNumber } = route.params || { phoneNumber: "+223 XXXXXXXX" };

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  // --- GESTION DU CHRONO ---
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- GESTION DE LA SAISIE ---
  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Focus automatique sur le champ suivant
    if (text.length !== 0 && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Retour arrière : focus sur le champ précédent
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputs.current[index - 1].focus();
    }
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(30);
      // Appelle ici ton API verify_otp
      console.log("Code renvoyé !");
    }
  };

  const handleContinue = async () => {
    const code = otp.join('');
    if (code.length < 6) return;

    setLoading(true);
    try {
      const result = await verifyOtpCode(phoneNumber, code);

      if (!result.ok) {
        const errorMessage = result.error?.message || "Code invalide.";
        Alert.alert('Erreur', errorMessage);
        return;
      }

      const { refresh, access, user } = result.data;

      if (user && user.user_type !== 'citizen') {
        console.log(`Accès refusé : type de compte détecté -> ${user.user_type}`);
        
        Alert.alert(
          "Accès restreint", 
          "Cette application est réservée aux citoyens. Si vous êtes un agent de terrain, veuillez retourner à l'accueil et vous connecter depuis l'Espace Agent."
        );
        return; // On stoppe tout ici : les tokens et le profil ne sont pas enregistrés en local
      }

      await setAuthToken({ refresh, access });
      await setAuthUser(user);

      navigation.reset({
        index: 0,
        routes: [{ name: '(tabs)' }],
      });
    } catch (error) {
      console.error('Error during OTP verification:', error);
      Alert.alert('Erreur réseau', "Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <Text style={styles.title}>Code de confirmation</Text>
        
        <Text style={styles.description}>
          Un sms de confirmation vous a été envoyé au numéro{"\n"}
          <Text style={styles.phoneText}>{phoneNumber}</Text>
        </Text>

        {/* CHAMPS OTP (6 CHAMPS) */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              ref={(ref) => (inputs.current[index] = ref)}
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* CHRONO & RENVOI */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Vous n'avez pas reçu de code ?</Text>
          <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
            <Text style={[styles.resendBtn, timer > 0 && { color: COLORS.gray400 }]}>
              Renvoyer le code {timer > 0 ? `dans ${timer}s` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* BOUTON CONTINUER */}
        <TouchableOpacity 
          style={[styles.mainButton, otp.join('').length < 6 && { backgroundColor: COLORS.gray400 }]}
          disabled={otp.join('').length < 6 || loading}
          onPress={handleContinue}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.mainButtonText}>Continuer</Text>
          )}
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray1,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  phoneText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: COLORS.gray2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: COLORS.white,
    color: COLORS.primary,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  resendText: {
    color: COLORS.secondary,
    fontSize: 14,
    marginBottom: 5,
  },
  resendBtn: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  mainButton: {
    width: '100%',
    height: 55,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});