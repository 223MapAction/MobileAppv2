import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { apiEndPoint } from '../api/apiUrl'; // Ajuste le chemin relatif si nécessaire
import { COLORS } from '../Composants/themeConfig';
import ScreenHeader from '../Composants/ScreenHeader';
import { getAuthToken, getAuthUser } from '../storage/authStorage';

export default function ContactUsScreen() {
  const router = useRouter();
  
  // États du formulaire
  const [objet, setObjet] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Vérification de la session utilisateur au chargement
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const loggedUser = await getAuthUser().catch(() => null);
        if (loggedUser && loggedUser.email) {
          setEmail(loggedUser.email);
          setIsEmailReadOnly(true); 
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur :", error);
      }
    };
    checkUserSession();
  }, []);

  // Fonction de soumission vers l'API
  const handleSendContact = async () => {
    if (!objet.trim() || !message.trim() || !email.trim()) {
      Alert.alert("Champs obligatoires", "Veuillez remplir tous les champs avant d'envoyer.");
      return;
    }

    setIsSending(true);
    try {
      // Récupération et extraction du token de manière sécurisée (comme pour les notifications)
      const tokenData = await getAuthToken().catch(() => null);
      const token = tokenData?.access || tokenData;
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Ajout de l'en-tête d'autorisation seulement si le token est valide
      if (token && token !== 'null' && token !== '') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Utilisation de l'endpoint global concaténé avec /contact/
      const response = await fetch(`${apiEndPoint}/contact/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          objet: objet.trim(),
          message: message.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      if (response.ok) {
        Alert.alert("Succès", "Votre message a bien été envoyé à l'équipe Map Action.");
        setObjet('');
        setMessage('');
        if (!isEmailReadOnly) setEmail(''); 
        router.back();
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Erreur serveur: ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du formulaire de contact :", error);
      Alert.alert("Échec de l'envoi", "Impossible d'envoyer votre message. Vérifiez votre connexion internet et réessayez.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Contactez-nous" />

      {/* COMPOSANT ÉVITAGE DE CLAVIER */}
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* FORMULAIRE DÉFILANT */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.infoBox}>
            <Ionicons name="mail-open-outline" size={32} color={COLORS.primary} style={{ marginBottom: 10 }} />
            <Text style={styles.infoText}>
              Une remarque, une suggestion ou un problème technique ? Envoyez-nous un message et notre équipe vous répondra dans les plus brefs délais.
            </Text>
          </View>

          {/* CHAMP EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Votre adresse email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, isEmailReadOnly && styles.textInputDisabled]}
              placeholder="Ex: exemple@domaine.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isEmailReadOnly}
            />
            {isEmailReadOnly && (
              <Text style={styles.hintText}>Lié à votre compte connecté</Text>
            )}
          </View>

          {/* CHAMP OBJET */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Objet du message <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Problème de géolocalisation..."
              value={objet}
              onChangeText={setObjet}
            />
          </View>

          {/* CHAMP MESSAGE */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Votre message <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Écrivez votre message ici..."
              value={message}
              onChangeText={setMessage}
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* BOUTON D'ENVOI */}
          <TouchableOpacity 
            style={[styles.submitButton, isSending && styles.submitButtonDisabled]} 
            onPress={handleSendContact}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Envoyer le message</Text>
                <Ionicons name="send" size={16} color={COLORS.white} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 40 
  },
  infoBox: {
    backgroundColor: COLORS.gray50,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    marginBottom: 25,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray600,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary || '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF4444',
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.gray800,
    backgroundColor: '#FAFAFA',
  },
  textInputDisabled: {
    backgroundColor: COLORS.gray200,
    borderColor: COLORS.gray300,
    color: COLORS.gray500,
  },
  textArea: {
    height: 120,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 4,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray400,
    elevation: 0,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});