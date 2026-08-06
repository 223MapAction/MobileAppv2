import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../Composants/themeConfig';
import LegalTermsBody from '../Composants/LegalTermsBody';
import ScreenHeader from '../Composants/ScreenHeader';

export default function TermsAndConditionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Conditions Générales d'Utilisation" />

      {/* CONTENU DÉFILANT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Date de mise à jour : 11/10/2024</Text>

        <View style={styles.headerVisual}>
          <Ionicons name="document-text-outline" size={40} color={COLORS.primary} />
          <Text style={styles.headerSubtitle}>Veuillez prendre connaissance des CGU de l'application</Text>
        </View>

        <LegalTermsBody />

        <Text style={styles.contact}>Besoin d'aide ? contact@map-action.com</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 40,
  },
  headerVisual: {
    alignItems: 'center',
    marginVertical: 15,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray1,
    marginTop: 5,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: 20,
    marginBottom: 10,
  },
  contact: { marginTop: 10, textAlign: 'center', color: '#888' }
});