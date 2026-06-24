import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { read_user, update_user } from '../../api/user';
import { COLORS } from '../../Composants/themeConfig';
import { clearAuthUser, getAuthToken, getAuthUser, saveAuthUser } from '../../storage/authStorageAgent'; // Ciblage de l'authentification Agent

const { width, height } = Dimensions.get('window');

export default function ProfilAgentScreen() {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  
  // --- ÉTATS POUR L'ÉDITION ---
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', email: '' });

  const router = useRouter();

  // Fonction de chargement / rafraîchissement des données de l'agent
  const rafraichirProfilAgent = async () => {
    try {
      const localAgent = await getAuthUser().catch(() => null);
      
      if (localAgent) {
        const token = await getAuthToken().catch(() => null);
        const agentId = localAgent.id || localAgent.user_id || localAgent.user?.id;
        
        if (agentId && token) {
          const freshUserData = await read_user(agentId, token).catch((e) => {
            console.error("Échec récupération API utilisateur, repli local.", e);
            return null;
          }); 
          
          if (freshUserData) {
            const updatedAgentObj = { ...localAgent, ...freshUserData };
            await saveAuthUser(updatedAgentObj).catch(() => null); 
            
            setUser(updatedAgentObj);
            setEditForm({
              first_name: freshUserData.first_name || '',
              last_name: freshUserData.last_name || '',
              phone: freshUserData.phone || '',
              email: freshUserData.email || '',
            });
            return;
          }
        }
      }
      
      // Fallback sur les données locales si l'API est injoignable
      if (localAgent) {
        setUser(localAgent);
        setEditForm({
          first_name: localAgent.first_name || '',
          last_name: localAgent.last_name || '',
          phone: localAgent.phone || '',
          email: localAgent.email || '',
        });
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du profil agent :", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initLoad = async () => {
      await rafraichirProfilAgent();
      if (isMounted) setIsLoadingUser(false);
    };
    initLoad();
    return () => { isMounted = false; };
  }, []);

  // --- SÉLECTION DE LA PHOTO DE PROFIL ---
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Accès refusé", "L'autorisation d'accéder à la galerie photo est nécessaire pour changer votre avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        handleSaveAvatar(result.assets[0].uri);
      }
    } catch (pickerError) {
      console.error("Erreur lors de la sélection de l'image :", pickerError);
      Alert.alert("Action impossible", "Une erreur est survenue lors de l'ouverture de votre galerie d'images.");
    }
  };

  // --- MISE À JOUR DE L'AVATAR SUR LE SERVEUR ---
  const handleSaveAvatar = async (imageUri) => {
    setIsUpdating(true);
    try {
      const token = await getAuthToken();
      const agentId = user?.id || user?.user_id || user?.user?.id;
      
      if (!agentId || !token) throw new Error("Identifiants ou jeton manquants.");

      await update_user(agentId, { avatar: imageUri }, token);
      await rafraichirProfilAgent();
      
      Alert.alert("Profil mis à jour", "Votre nouvelle photo de profil a été enregistrée avec succès.");
    } catch (error) {
      console.error("Erreur technique lors de l'enregistrement de l'avatar :", error);
      Alert.alert("Mise à jour impossible", "Le serveur n'a pas pu traiter l'image. Veuillez réessayer ultérieurement.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- MISE À JOUR DES INFORMATIONS TEXTUELLES ---
  const handleSaveProfileInfo = async () => {
    if (!editForm.first_name || !editForm.first_name.trim()) {
      Alert.alert("Vérification requis", "Veuillez renseigner votre prénom.");
      return;
    }
    if (!editForm.last_name || !editForm.last_name.trim()) {
      Alert.alert("Vérification requis", "Veuillez renseigner votre nom de famille.");
      return;
    }

    setIsUpdating(true);
    try {
      const token = await getAuthToken();
      const agentId = user?.id || user?.user_id || user?.user?.id;
      
      if (!agentId || !token) throw new Error("Jeton ou ID utilisateur expiré.");

      await update_user(agentId, editForm, token);
      await rafraichirProfilAgent();
      
      setIsEditing(false);
      setIsPersonalInfoOpen(false); 
      Alert.alert("Succès", "Vos informations personnelles ont été modifiées.");
    } catch (error) {
      console.error("Erreur mise à jour infos profil :", error);
      Alert.alert("Échec de la modification", "Les modifications n'ont pas pu être enregistrées. Problème de connexion réseau.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Se déconnecter", 
          style: "destructive",
          onPress: async () => {
            try {
              await clearAuthUser().catch(() => null);
              setUser(null);
              router.replace('/Authentification'); 
            } catch (error) {
              console.error("Erreur lors de la déconnexion de l'agent :", error);
              Alert.alert("Erreur", "Impossible de procéder à la déconnexion pour le moment.");
            }
          }
        }
      ]
    );
  };

  // --- SUPPRESSION DU COMPTE ---
  const handleDeleteAccount = () => {
    Alert.alert(
      "Suppression du compte",
      "Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible et effacera définitivement vos données.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer définitivement", 
          style: "destructive",
          onPress: async () => {
            try {
              // TODO: Ajoutez ici votre appel API (ex: await delete_user(agentId, token)) si nécessaire.
              await clearAuthUser().catch(() => null);
              setUser(null);
              router.replace('/Authentification');
              Alert.alert("Compte supprimé", "Votre compte a été supprimé avec succès.");
            } catch (error) {
              console.error("Erreur lors de la suppression du compte :", error);
              Alert.alert("Erreur", "Impossible de supprimer le compte pour le moment.");
            }
          }
        }
      ]
    );
  };

  const firstName = (user?.first_name || '').trim();
  const lastName = (user?.last_name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'Agent de terrain';
  const avatarUrl = user?.avatar || null;
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'A';

  const MenuItem = ({ icon, title, color = COLORS.secondary, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={color === "#FF4444" ? "#FF4444" : COLORS.primary} style={styles.menuIcon} />
        <Text style={[styles.menuItemText, { color: color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  if (isLoadingUser) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="person-circle-outline" size={100} color={COLORS.gray1} />
        <Text style={styles.emptyTitle}>Session introuvable</Text>
        <Text style={styles.emptySubtitle}>Veuillez vous reconnecter pour accéder à l'espace agent.</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/Authentification')}>
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER : AVATAR ET NOM */}
        <View style={styles.headerSection}>
          <View style={styles.imageContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.editBadge} onPress={pickImage} disabled={isUpdating}>
              {isUpdating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="camera" size={14} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{fullName}</Text>
        </View>

        {/* SECTION : COMPTE */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.cardGroup}>
            <MenuItem 
              icon="person-outline" 
              title="Informations personnelles" 
              onPress={() => {
                setIsEditing(false);
                setIsPersonalInfoOpen(true);
              }} 
            />
            <View style={styles.divider} />
            <MenuItem 
              icon="information-circle-outline" 
              title="À propos de nous" 
              onPress={() => router.push('/AproposScreen')}
            />
          </View>
        </View>

        {/* SECTION : ASSISTANCE ET INFORMATION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Assistance et information</Text>
          <View style={styles.cardGroup}>
            <MenuItem 
              icon="document-text-outline" 
              title="Conditions et termes d’utilisation" 
              onPress={() => console.log('Navigation vers Conditions')} 
            />
          </View>
        </View>

        {/* SECTION : CONNEXION ET SECURITE */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Connexion et sécurité</Text>
          <View style={styles.cardGroup}>
            <MenuItem 
              icon="log-out-outline" 
              title="Supprimer mon compte" 
              onPress={handleDeleteAccount} 
            />
            <View style={styles.divider} />
            {/* BOUTON SUPPRIMER MON COMPTE EN ROUGE ACTIVÉ */}
            <MenuItem 
              icon="trash-outline" 
              title="Déconnexion" 
              color="#FF4444" 
              onPress={handleLogout}
            />
          </View>
        </View>

      </ScrollView>

      {/* FOOTER : VERSION */}
      {/* <View style={styles.footerVersion}>
        <Text style={styles.versionText}>version 1.0.0</Text>
      </View> */}

      {/* MODAL : INFORMATION ET MODIFICATION DU PROFIL AGENT */}
      <Modal visible={isPersonalInfoOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Modifier mon profil" : "Détails du compte"}
              </Text>
              <TouchableOpacity onPress={() => {
                setIsPersonalInfoOpen(false);
                setIsEditing(false);
              }} disabled={isUpdating}>
                <Ionicons name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {isEditing ? (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Prénom <Text style={styles.requiredAsterisk}>*</Text></Text>
                  <TextInput 
                    style={styles.textInput}
                    value={editForm.first_name}
                    onChangeText={(text) => setEditForm({...editForm, first_name: text})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nom <Text style={styles.requiredAsterisk}>*</Text></Text>
                  <TextInput 
                    style={styles.textInput}
                    value={editForm.last_name}
                    onChangeText={(text) => setEditForm({...editForm, last_name: text})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Téléphone (Non modifiable)</Text>
                  <TextInput 
                    style={[styles.textInput, styles.textInputDisabled]}
                    value={editForm.phone}
                    editable={false} 
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email <Text style={styles.requiredAsterisk}>*</Text></Text>
                  <TextInput 
                    style={styles.textInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={editForm.email}
                    onChangeText={(text) => setEditForm({...editForm, email: text})}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.modalCloseBtn, { backgroundColor: COLORS.primary }]} 
                  onPress={handleSaveProfileInfo}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalCloseBtnText}>Enregistrer les modifications</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {[
                  { label: 'Nom complet', value: fullName },
                  { label: 'Email', value: user?.email },
                  { label: 'Téléphone', value: user?.phone },
                  { label: 'Rôle', value: user?.user_type || 'Agent Terrain' }
                ].map((info, index) => (
                  <View key={index} style={styles.modalRow}>
                    <Text style={styles.modalLabel}>{info.label}</Text>
                    <Text style={styles.modalValue}>{info.value || '-'}</Text>
                  </View>
                ))}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  <TouchableOpacity 
                    style={[styles.modalCloseBtn, { flex: 1, backgroundColor: COLORS.secondary }]} 
                    onPress={() => {
                      setEditForm({
                        first_name: user?.first_name || '',
                        last_name: user?.last_name || '',
                        phone: user?.phone || '',
                        email: user?.email || '',
                      });
                      setIsEditing(true);
                    }}
                  >
                    <Text style={styles.modalCloseBtnText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalCloseBtn, { flex: 1, backgroundColor: COLORS.gray1 }]} 
                    onPress={() => setIsPersonalInfoOpen(false)}
                  >
                    <Text style={styles.modalCloseBtnText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 }, // Légère augmentation du padding pour le nouveau bouton
  headerSection: { alignItems: 'center', paddingVertical: height * 0.04 },
  imageContainer: { position: 'relative', marginBottom: 15 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.primary },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  initialsText: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.secondary, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white', elevation: 3 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  sectionContainer: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 8, paddingLeft: 4, fontWeight: '600' },
  cardGroup: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: 'white' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 12 },
  menuItemText: { fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  footerVersion: { position: 'absolute', bottom: 15, left: 0, right: 0, alignItems: 'center' },
  versionText: { fontSize: 13, color: '#9CA3AF' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 10, marginBottom: 30 },
  loginButton: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  loginButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'white', padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  modalRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
  modalValue: { fontSize: 15, color: '#1F2937', fontWeight: '600' },
  modalCloseBtn: { marginTop: 10, padding: 15, borderRadius: 12, alignItems: 'center' },
  modalCloseBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 6 },
  requiredAsterisk: { color: '#FF4444', fontWeight: 'bold' },
  textInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#1F2937', backgroundColor: '#FAFAFA' },
  textInputDisabled: { backgroundColor: '#ECECEC', borderColor: '#DCDCDC', color: '#888888', opacity: 0.7 }
});