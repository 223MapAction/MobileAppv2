import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../Composants/themeConfig';
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
        
        <Text style={styles.companyInfo}>
          <Text style={styles.bold}>Nom social :</Text> Kaicedra Consulting SAS{'\n'}
          <Text style={styles.bold}>NINA :</Text> 41809196199261W{'\n'}
          <Text style={styles.bold}>RCCM :</Text> MA.BKO.2018.B.8559{'\n'}
          <Text style={styles.bold}>Adresse :</Text> Faladie-sema Rue 839 rue du Gouverneur Immeuble Fitini Market{'\n'}
          <Text style={styles.bold}>Contacts :</Text> 44 38 60 59 / contact@map-action.com{'\n'}
          <Text style={styles.bold}>Représentée par :</Text> M. Boubacar Youssouf KEITA, Président
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Kaicedra Consulting SAS</Text> est une entreprise spécialisée dans la collecte et l'analyse des données dans les secteurs de l'environnement, BTP, agriculture, et foresterie, ainsi que dans le développement d'applications mobiles, dont l'application <Text style={styles.bold}>Map Action</Text>.
        </Text>

        <Text style={styles.sectionTitle}>Préambule</Text>
        <Text style={styles.paragraph}>
          Ces CGU régissent l'accès et l'utilisation de l'application mobile <Text style={styles.bold}>Map Action</Text> (ci-après "l'Application"). En téléchargeant ou en utilisant l'Application, vous acceptez d'être lié par ces CGU.
        </Text>

        <Text style={styles.sectionTitle}>Définition des termes</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>Vous / Votre :</Text> Désigne l'Utilisateur acceptant les termes du présent contrat.{'\n'}
          • <Text style={styles.bold}>Map Action :</Text> Nom de l'application mobile.{'\n'}
          • <Text style={styles.bold}>Application Map Action :</Text> Plateforme permettant à l'Utilisateur de signaler des incidents environnementaux via photos/vidéos, partagées avec Kaicedra Consulting et les autorités compétentes.{'\n'}
          • <Text style={styles.bold}>Autorités compétentes :</Text> Les organismes et structures maliennes chargées de la protection de l'environnement.{'\n'}
          • <Text style={styles.bold}>Compte Map Action :</Text> Compte personnel attribué à l'Utilisateur après inscription.{'\n'}
          • <Text style={styles.bold}>Données Personnelles :</Text> Informations permettant d'identifier directement ou indirectement une personne.{'\n'}
          • <Text style={styles.bold}>Géolocalisation :</Text> Positionnement géographique d'un incident environnemental via l'Application.{'\n'}
          • <Text style={styles.bold}>Images :</Text> Photos/vidéos capturées par l'Utilisateur portant sur les incidents signalés.{'\n'}
          • <Text style={styles.bold}>Transfert :</Text> Envoi des images des incidents aux autorités compétentes.{'\n'}
          • <Text style={styles.bold}>SMS :</Text> Service de message court.
        </Text>

        <Text style={styles.sectionTitle}>Champ d'application</Text>
        <Text style={styles.paragraph}>
          Le présent contrat s'applique à tous les services offerts par l'Application <Text style={styles.bold}>Map Action</Text> et à son utilisation.
        </Text>

        <Text style={styles.sectionTitle}>Objet</Text>
        <Text style={styles.paragraph}>
          Les présentes CGU définissent les relations contractuelles entre l'Utilisateur et <Text style={styles.bold}>Kaicedra Consulting SAS</Text> pour l'utilisation de l'Application.
        </Text>

        <Text style={styles.sectionTitle}>Description du service</Text>
        <Text style={styles.paragraph}>
          L'Application permet aux utilisateurs de signaler des incidents environnementaux (d'origine humaine ou naturelle) en prenant des photos/vidéos/notes vocales et en les partageant avec les autorités compétentes.
        </Text>

        <Text style={styles.sectionTitle}>Accès et inscription</Text>
        <Text style={styles.paragraph}>
          L'Utilisateur peut utiliser l'Application sans inscription pour signaler des incidents. Toutefois, pour suivre le traitement de ces signalements, l'Utilisateur doit créer un compte en fournissant des informations exactes.{'\n\n'}
          • L'Utilisateur est responsable de la confidentialité de ses identifiants.{'\n'}
          • Si l'Utilisateur souhaite supprimer son compte, toutes les données associées seront supprimées conformément à la <Text style={styles.bold}>Politique de Confidentialité</Text>.
        </Text>

        <Text style={styles.sectionTitle}>Utilisation de l'Application</Text>
        <Text style={styles.paragraph}>
          En utilisant l'Application, vous vous engagez à :{'\n\n'}
          • Respecter les lois en vigueur.{'\n'}
          • Ne pas violer les droits de propriété intellectuelle liés aux contenus.{'\n'}
          • Ne pas collecter de données personnelles sur d'autres utilisateurs.{'\n'}
          • Ne pas interférer avec le bon fonctionnement de l'Application.
        </Text>

        <Text style={styles.sectionTitle}>Propriété Intellectuelle</Text>
        <Text style={styles.paragraph}>
          Tous les droits liés à l'utilisation de l'Application sont la propriété exclusive de <Text style={styles.bold}>Kaicedra Consulting SAS</Text>. L'utilisateur renonce à tout droit de réclamation concernant les résultats générés par l'utilisation de l'application.
        </Text>

        <Text style={styles.sectionTitle}>Contenus générés par les utilisateurs</Text>
        <Text style={styles.paragraph}>
          L'Utilisateur est seul responsable des contenus partagés via l'Application.{'\n\n'}
          Les images et vidéos capturées via l'Application sont à la fois utilisées pour <Text style={styles.bold}>le signalement des incidents environnementaux</Text> aux autorités compétentes et peuvent également être réutilisées par <Text style={styles.bold}>Kaicedra Consulting SAS</Text> à des fins <Text style={styles.bold}>de communication, de sensibilisation</Text> ou dans le cadre d'<Text style={styles.bold}>études</Text> visant à améliorer la gestion environnementale. En acceptant ces CGU, vous consentez à cette utilisation.
        </Text>

        <Text style={styles.sectionTitle}>Traitement des signalements</Text>
        <Text style={styles.paragraph}>
          Les signalements sont transmis aux autorités compétentes. L'Application ne garantit pas la prise en charge effective de tous les signalements par ces autorités.
        </Text>

        <Text style={styles.sectionTitle}>Traitement des données personnelles</Text>
        <Text style={styles.paragraph}>
          L'Application collecte et traite les données personnelles conformément à la loi N°2013-015 du 21 mai 2013 relative à la protection des données à caractère personnel en République du Mali et à la <Text style={styles.bold}>Politique de Confidentialité</Text>, qui est disponible dans l'Application et sur le site web.{'\n\n'}
          • <Text style={styles.bold}>Données collectées :</Text> Géolocalisation, photos/vidéos/notes vocales/textes des incidents, identifiants de connexion.{'\n'}
          • <Text style={styles.bold}>Finalité :</Text> Les données sont collectées dans le but d'améliorer le service et de faciliter les interventions des autorités compétentes.{'\n'}
          • <Text style={styles.bold}>Durée de conservation :</Text> Les données collectées sont conservées pendant une période définie par la loi.{'\n'}
          • <Text style={styles.bold}>Droits de l'utilisateur :</Text> Vous avez le droit d'accéder à vos données, de les corriger ou de les supprimer en contactant <Text style={styles.bold}>Kaicedra Consulting SAS</Text> via l'adresse suivante : contact@kaicedra-consulting.ml.
        </Text>

        <Text style={styles.sectionTitle}>Partage d'informations et divulgation</Text>
        <Text style={styles.paragraph}>
          Vos données personnelles ne seront divulguées qu'avec votre consentement ou lorsque la loi l'exige.
        </Text>

        <Text style={styles.sectionTitle}>Sécurité des données</Text>
        <Text style={styles.paragraph}>
          Des mesures techniques et organisationnelles appropriées sont mises en place pour protéger vos données. Cependant, aucun système n'est totalement sécurisé et vous êtes responsable de la protection de vos identifiants d'accès.
        </Text>

        <Text style={styles.sectionTitle}>Limitation de la responsabilité</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Kaicedra Consulting SAS</Text> ne peut être tenue responsable des dommages résultant de l'utilisation ou de l'impossibilité d'utiliser l'Application, y compris :{'\n\n'}
          • Les interruptions de service.{'\n'}
          • L'absence de prise en charge des signalements par les autorités compétentes.
        </Text>

        <Text style={styles.sectionTitle}>Modifications des CGU</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Kaicedra Consulting SAS</Text> se réserve le droit de modifier les présentes CGU à tout moment. Vous serez informé par notification dans l'Application ou par email.
        </Text>

        <Text style={styles.sectionTitle}>Communications électroniques</Text>
        <Text style={styles.paragraph}>
          En accepting ces CGU, vous acceptez de recevoir toutes les communications liées à l'Application par voie électronique.
        </Text>

        <Text style={styles.sectionTitle}>Clôture du compte</Text>
        <Text style={styles.paragraph}>
          L'Utilisateur peut clôturer son compte à tout moment sans préavis. En cas de résiliation, toutes les données seront supprimées, à l'exception des informations légalement obligatoires à conserver.
        </Text>

        <Text style={styles.sectionTitle}>Clause de force majeure</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Kaicedra Consulting SAS</Text> ne saurait être responsable en cas de force majeure, c'est-à-dire tout événement imprévisible et irrésistible empêchant l'exécution normale des CGU (catastrophes naturelles, cyberattaques, etc.).
        </Text>

        <Text style={styles.sectionTitle}>Droit applicable et juridiction compétente</Text>
        <Text style={styles.paragraph}>
          Les présentes CGU sont régies par le droit malien. Tout litige sera soumis aux tribunaux compétents du Mali.
        </Text>

        <Text style={styles.sectionTitle}>Accord, Termes et Conditions</Text>
        <Text style={styles.paragraph}>
          En utilisant l'Application, vous reconnaissez avoir lu, compris, et accepté les présentes CGU, y compris celles relatives à la collecte, l'utilisation et le stockage de vos données personnelles.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question relative à l'Application ou aux présentes CGU, veuillez contacter : <Text style={styles.bold}>contact@map-action.com</Text>.
        </Text>

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
  companyInfo: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
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