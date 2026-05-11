import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../Composants/themeConfig';
import { clearAuthToken, clearAuthUser, getAuthUser } from '../../storage/authStorage';

const { width, height } = Dimensions.get('window');

export default function ProfilScreen() {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const parsed = await getAuthUser();
        if (isMounted) setUser(parsed);
      } catch (error) {
        console.error("Erreur chargement user:", error);
      } finally {
        if (isMounted) setIsLoadingUser(false);
      }
    };
    loadUser();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    try {
      await clearAuthUser();
      await clearAuthToken();
      setUser(null);
      
      // Redirection vers la racine de l'auth pour sortir du layout (tabs)
      router.replace('/Authentification'); 
      console.log("Déconnexion réussie");
    } catch (error) {
      console.error("Erreur logout:", error);
    }
  };

  // Gestion des données utilisateur
  const firstName = (user?.first_name || '').trim();
  const lastName = (user?.last_name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'Utilisateur';
  const avatarUrl = user?.avatar || null;
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';

  const MenuItem = ({ icon, title, color = COLORS.primary, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[styles.menuText, { color: color === COLORS.primary ? COLORS.secondary : color }]}>
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray1} />
    </TouchableOpacity>
  );

  if (isLoadingUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Écran affiché si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="person-circle-outline" size={100} color={COLORS.gray1} />
        <Text style={styles.emptyTitle}>Vous n'êtes pas connecté</Text>
        <Text style={styles.emptySubtitle}>Connectez-vous pour accéder à votre profil et suivre vos incidents.</Text>
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => router.replace('/Authentification')}
        >
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Profil */}
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImageFallback}>
              <Text style={styles.profileImageFallbackText}>{initials}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editBadge}>
            <Ionicons name="camera" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{fullName}</Text>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="person-outline" title="Information personnelle" onPress={() => setIsPersonalInfoOpen(true)} />
          <MenuItem icon="information-circle-outline" title="À propos de nous" />
        </View>

        <Text style={styles.sectionTitle}>Assistance</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="help-circle-outline" title="FAQ" />
          <MenuItem icon="document-text-outline" title="Conditions et termes" />
          <MenuItem icon="mail-outline" title="Contactez-nous" />
        </View>

        <Text style={styles.sectionTitle}>Connexion</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="trash-outline" title="Supprimer mon compte"  onPress={handleLogout} />
          <MenuItem icon="log-out-outline" title="Déconnexion" color="#FF4444" onPress={handleLogout} />
        </View>
      </View>

      <View style={{ height: 40 }} />

      {/* Modal Informations */}
      <Modal visible={isPersonalInfoOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Détails du compte</Text>
              <TouchableOpacity onPress={() => setIsPersonalInfoOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'Nom complet', value: fullName },
              { label: 'Email', value: user?.email },
              { label: 'Téléphone', value: user?.phone },
              { label: 'Type de compte', value: user?.user_type }
            ].map((info, index) => (
              <View key={index} style={styles.modalRow}>
                <Text style={styles.modalLabel}>{info.label}</Text>
                <Text style={styles.modalValue}>{info.value || '-'}</Text>
              </View>
            ))}

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
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  header: { alignItems: 'center', paddingVertical: height * 0.04 },
  imageContainer: { position: 'relative', marginBottom: 15 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.primary },
  profileImageFallback: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  profileImageFallbackText: { fontSize: 32, fontWeight: 'bold', color: COLORS.secondary },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  userName: { fontSize: 20, fontWeight: 'bold', color: COLORS.secondary },
  
  menuContainer: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.gray1, marginBottom: 8, marginLeft: 5, textTransform: 'uppercase' },
  sectionCard: { backgroundColor: 'white', borderRadius: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16, marginLeft: 12, fontWeight: '500' },

  // Styles pour l'état non-connecté
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.secondary, marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray1, textAlign: 'center', marginTop: 10, marginBottom: 30 },
  loginButton: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  loginButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'white', padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalLabel: { fontSize: 11, color: COLORS.gray1, textTransform: 'uppercase', marginBottom: 4 },
  modalValue: { fontSize: 15, color: COLORS.secondary, fontWeight: '600' },
  modalCloseBtn: { marginTop: 20, backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  modalCloseBtnText: { color: 'white', fontWeight: 'bold' }
});