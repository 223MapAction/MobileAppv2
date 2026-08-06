import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../Composants/themeConfig';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* HEADER BLOQUÉ : Sorti du ScrollView */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>À propos de Map Action</Text>
      </View>

      {/* CONTENU DÉFILANT */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Qui sommes-nous ?</Text>
        <Text style={styles.text}>
          Map Action est une application citoyenne développée par Kaicedra Consulting SAS,
          une entreprise malienne spécialisée dans la collecte, l’analyse et la
          valorisation de données dans les domaines de l’environnement, du BTP, de
          l’agriculture et de la foresterie.
        </Text>
        <Text style={styles.text}>
          L’application a été conçue pour faciliter le signalement, la documentation et le
          suivi des incidents environnementaux et d’assainissement au Mali.
        </Text>

        <Text style={styles.sectionTitle}>Notre mission</Text>
        <Text style={styles.text}>
          Notre mission est de rapprocher les citoyens, les collectivités territoriales, les
          services techniques de l’État et les acteurs de terrain autour d’un objectif
          commun : améliorer le cadre de vie et renforcer la gestion environnementale.
        </Text>
        <Text style={styles.text}>
          À travers une approche participative, Map Action permet à chaque citoyen de
          contribuer à l’identification des problèmes environnementaux visibles dans
          son quartier, sa commune ou sa localité.
        </Text>

        <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
        <Text style={styles.text}>
          Avec Map Action, un utilisateur peut signaler un incident environnemental ou
          d’assainissement à partir d’une photo, d’une vidéo, d’une note vocale ou d’une
          description géolocalisée.
        </Text>
        <Text style={styles.text}>
          Les informations transmises sont centralisées, analysées et mises à disposition
          des acteurs compétents, selon la nature de l’incident et la zone concernée, afin
          de faciliter la prise de décision, le suivi et l’organisation des interventions.
        </Text>
        <Text style={styles.text}>
          Map Action ne remplace pas les services publics compétents. L’application vise
          à améliorer la remontée d’informations, la coordination et la visibilité des
          problèmes signalés par les citoyens.
        </Text>
        <Text style={styles.contact}>Besoin d'aide ? contact@map-action.com</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  
  // Header bloqué
  headerRow: { 
    flexDirection: 'row',
    marginTop:30, 
    alignItems: 'center', 
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 10,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.primary,
    marginLeft: 10 
  },
  
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 40 
  },
  backButton: { padding: 10 },
  
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 20, 
    marginBottom: 10 
  },
  text: { 
    fontSize: 16, 
    lineHeight: 24, 
    color: '#333', 
    marginBottom: 10 
  },
  contact: { marginTop: 10, textAlign: 'center', color: '#888' }
});