import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../Composants/themeConfig';

const { width, height } = Dimensions.get('window');

export default function ProfilScreen() {
  

  const MenuItem = ({ icon, title, color = COLORS.primary, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[styles.menuText, { color: color === COLORS.primary ? COLORS.secondary : color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray1 || '#ccc'} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      

      <View style={styles.header}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://media.licdn.com/dms/image/v2/D4D03AQFx8LLGwRZKiw/profile-displayphoto-scale_400_400/B4DZ15XCNVIEAg-/0/1775857576684?e=1777507200&v=beta&t=BxfRd-kXNjFzkeMVbyjIul8mR-uwPuPW3kVmUbExryA' }} // Remplace par ton image locale si besoin
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editBadge}>
            <Ionicons name="camera" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>Hamidou Barry</Text>
      </View>


      <View style={styles.menuContainer}>
        
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="person-outline" title="Information personnelle" />
          <MenuItem icon="information-circle-outline" title="À propos de nous" />
        </View>

        <Text style={styles.sectionTitle}>Assistance et information</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="help-circle-outline" title="FAQ" />
          <MenuItem icon="document-text-outline" title="Conditions et termes" />
          <MenuItem icon="mail-outline" title="Contactez-nous" />
        </View>

        <Text style={styles.sectionTitle}>Connexion</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="trash-outline" title="Supprimer mon compte" />
          <MenuItem icon="log-out-outline" title="Déconnexion" color="#FF4444" />
        </View>

      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    paddingVertical: height * 0.05,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 15,
    
  },
  profileImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: (width * 0.25) / 2,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: width * 0.055,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray1,
    marginBottom: 10,
    marginLeft: 5,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingVertical: 5,
    marginBottom: 25,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.white,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
});