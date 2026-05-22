import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

export default function ProfilScreen() {
  const router = useRouter();

  // Simulation d'une action au clic sur une ligne du menu
  const handleMenuPress = (route) => {
    console.log(`Navigation vers : ${route}`);
    // Plus tard : router.push(route)
  };

  const handleLogout = () => {
    // Redirection vers l'écran d'authentification lors de la déconnexion
    router.replace('/Authentification');
  };

  // Composant réutilisable pour chaque ligne de menu (Item)
  const MenuItem = ({ title, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuItemText}>{title}</Text>
      <Feather name="chevron-right" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER : AVATAR ET NOM */}
        <View style={styles.headerSection}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={50} color="white" />
          </View>
          <Text style={styles.userName}>Racine Sy</Text>
        </View>

        {/* SECTION : COMPTE */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.cardGroup}>
            <MenuItem title="Informations personnels" onPress={() => handleMenuPress('infos')} />
            <View style={styles.divider} />
            <MenuItem title="A propos de nous" onPress={() => handleMenuPress('about')} />
          </View>
        </View>

        {/* SECTION : ASSISTANCE ET INFORMATION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Assistance et information</Text>
          <View style={styles.cardGroup}>
            <MenuItem title="Conditions et termes d’utilisation" onPress={() => handleMenuPress('terms')} />
          </View>
        </View>

        {/* SECTION : CONNEXION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Connexion</Text>
          <View style={styles.cardGroup}>
            <MenuItem title="Se déconnecter" onPress={handleLogout} />
          </View>
        </View>

      </ScrollView>

      {/* FOOTER : VERSION (Fixé tout en bas) */}
      <View style={styles.footerVersion}>
        <Text style={styles.versionText}>version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Fond gris très clair
  },
  scrollContent: {
    paddingBottom: 60, // Laisse de l'espace pour ne pas chevaucher le numéro de version
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: height * 0.04,
    backgroundColor: '#F9FAFB',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3498db', // Le bleu exact de ta maquette
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  // SECTIONS & TITRES
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    paddingLeft: 4,
  },
  
  // GROUPES DE CARTES (Bords arrondis blancs)
  cardGroup: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    // Ombres légères
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 5,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },

  // TEXTE DE VERSION EN BAS
  footerVersion: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});