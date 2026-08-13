import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../Composants/themeConfig';
import LegalTermsBody from '../Composants/LegalTermsBody';
import { setTermsAccepted } from '../storage/authStorage';

const { width } = Dimensions.get('window');

export default function TermsAndConditionsScreen() {
  const router = useRouter();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    // Ajout d'une marge de tolérance de 40px au lieu de 20px pour éviter les blocages sur Android
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isCloseToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    await setTermsAccepted(true);
    router.replace('/OnboardingScreen');
  };

  const handleDecline = () => {
    alert("Vous devez accepter les conditions pour utiliser l'application.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text-outline" size={40} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Conditions Générales d'Utilisation</Text>
        <Text style={styles.headerSubtitle}>Veuillez lire et accepter les CGU</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={styles.sectionTitle}>Date de mise à jour : 11/10/2024</Text>

        <LegalTermsBody />

        <View style={{ height: 30 }} />
      </ScrollView>

      <View style={styles.footer}>
        {!hasScrolledToBottom && (
          <Text style={styles.scrollHint}>
            <Ionicons name="arrow-down" size={14} color={COLORS.gray1} /> Faites défiler pour lire l'intégralité
          </Text>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
            <Text style={styles.declineButtonText}>Refuser</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, !hasScrolledToBottom && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            disabled={!hasScrolledToBottom}
          >
            <Text style={styles.acceptButtonText}>Accepter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    // Prise en compte de la barre de statut sur Android pour éviter le chevauchement du haut
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray1,
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: 20,
    marginBottom: 10,
  },
  footer: {
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray2,
    backgroundColor: COLORS.white,
    // CORRECTION : Espacement intelligent dynamique pour Android / touches tactiles
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 50 : 15, 
  },
  scrollHint: {
    fontSize: 12,
    color: COLORS.gray1,
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: 10,
    alignItems: 'center',
  },
  declineButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: COLORS.gray2,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});