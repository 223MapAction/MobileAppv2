import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS } from '../Composants/themeConfig';

export default function AuthAgentTerrainScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  // --- GESTION DE LA SAISIE DU CODE ---
  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length !== 0 && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputs.current[index - 1].focus();
    }
  };

  // --- NAVIGATION DIRECTE VERS LES TABS ---
  const handleVerifyCode = () => {
    if (otp.join('').length < 6) return;

    setLoading(true);

    // Simulation rapide avant redirection
    setTimeout(() => {
      setLoading(false);
      
      // Redirection brute vers tes onglets
      router.replace('/(tabs_agent)');
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Bouton Retour */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={40} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Code de confirmation</Text>
        
        <Text style={styles.description}>
          Se connecter avec le code fourni par l'organisation
        </Text>

        {/* CHAMPS DE SAISIE */}
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

        {/* BOUTON VALIDER */}
        <TouchableOpacity 
          style={[styles.mainButton, otp.join('').length < 6 && { backgroundColor: '#9CA3AF' }]}
          disabled={otp.join('').length < 6 || loading}
          onPress={handleVerifyCode}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.mainButtonText}>Valider le code</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 8 },
  content: { flex: 1, paddingHorizontal: 25, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 15 },
  description: { fontSize: 14, color: COLORS.gray1, textAlign: 'center', lineHeight: 22, marginBottom: 40, paddingHorizontal: 10 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  otpInput: { width: 45, height: 55, borderWidth: 1, borderColor: COLORS.gray2, borderRadius: 12, textAlign: 'center', fontSize: 20, fontWeight: 'bold', backgroundColor: COLORS.white, color: COLORS.primary },
  mainButton: { width: '100%', height: 55, backgroundColor: COLORS.primary, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  mainButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});