import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../Composants/themeConfig';
import { clearAuthToken, clearAuthUser, getAuthUser } from '../../storage/authStorage';
import Authentification from '../Authentification';

const { width, height } = Dimensions.get('window');

export default function ProfilScreen() {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const parsed = await getAuthUser();
        if (isMounted) setUser(parsed);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoadingUser(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await clearAuthUser();
    await clearAuthToken();
    setUser(null);
  };

  const firstName = (user?.first_name || '').trim();
  const lastName = (user?.last_name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'Utilisateur';
  const avatarUrl = user?.avatar || null;
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || `${user?.email?.[0] || ''}`.toUpperCase();

  const MenuItem = ({ icon, title, color = COLORS.primary, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[styles.menuText, { color: color === COLORS.primary ? COLORS.secondary : color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray1 || '#ccc'} />
    </TouchableOpacity>
  );

  if (isLoadingUser) return <View style={styles.container} />;

  if (!user) return <Authentification />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      

      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImageFallback}>
              <Text style={styles.profileImageFallbackText}>{initials || 'U'}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editBadge}>
            <Ionicons name="camera" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{fullName}</Text>
      </View>


      <View style={styles.menuContainer}>
        
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="person-outline" title="Information personnelle" onPress={() => setIsPersonalInfoOpen(true)} />
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
          <MenuItem icon="log-out-outline" title="Déconnexion" color="#FF4444" onPress={handleLogout} />
        </View>

      </View>

      <View style={{ height: 40 }} />

      <Modal
        visible={isPersonalInfoOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPersonalInfoOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Informations personnelles</Text>
              <TouchableOpacity onPress={() => setIsPersonalInfoOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Nom</Text>
              <Text style={styles.modalValue}>{fullName}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Email</Text>
              <Text style={styles.modalValue}>{user?.email || '-'}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Téléphone</Text>
              <Text style={styles.modalValue}>{user?.phone || '-'}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Adresse</Text>
              <Text style={styles.modalValue}>{user?.address || '-'}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Type</Text>
              <Text style={styles.modalValue}>{user?.user_type || '-'}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Points</Text>
              <Text style={styles.modalValue}>{String(user?.points ?? 0)}</Text>
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsPersonalInfoOpen(false)}>
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  profileImageFallback: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: (width * 0.25) / 2,
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageFallbackText: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: COLORS.secondary,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  modalRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray2,
  },
  modalLabel: {
    fontSize: 12,
    color: COLORS.gray1,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  modalValue: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  modalCloseBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});