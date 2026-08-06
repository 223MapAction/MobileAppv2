import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { delete_user, read_user, update_user } from '../../api/user';
import { COLORS } from '../../Composants/themeConfig';
import { clearAuthToken, clearAuthUser, getAccessToken, getAuthUser, setAuthUser } from '../../storage/authStorage';

const { height } = Dimensions.get('window');

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

export default function ProfilScreen() {
  const { signOut } = useAuth();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', email: '' });

  const router = useRouter();

  const rafraichirProfilUtilisateur = async () => {
    try {
      const localUser = await getAuthUser();
      
      if (localUser) {
        const token = await getAccessToken();

        const freshUserData = await read_user(localUser.id, token);
        
        if (freshUserData) {
          await setAuthUser(freshUserData); 
          setUser(freshUserData);
          setEditForm({
            first_name: freshUserData.first_name || '',
            last_name: freshUserData.last_name || '',
            phone: freshUserData.phone || '',
            email: freshUserData.email || '',
          });
          return;
        }
      }
      
      if (localUser) {
        setUser(localUser);
        setEditForm({
          first_name: localUser.first_name || '',
          last_name: localUser.last_name || '',
          phone: localUser.phone || '',
          email: localUser.email || '',
        });
      }
    } catch (error) {
      // Échec silencieux du rafraîchissement automatique en arrière-plan
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initLoad = async () => {
      await rafraichirProfilUtilisateur();
      if (isMounted) setIsLoadingUser(false);
    };
    initLoad();
    return () => { isMounted = false; };
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "Vous devez autoriser l'accès à vos photos pour modifier votre avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      handleSaveAvatar(result.assets[0].uri);
    }
  };

  const handleSaveAvatar = async (imageUri) => {
    setIsUpdating(true);
    try {
      const token = await getAccessToken();

      await update_user(user.id, { avatar: imageUri }, token);
      await rafraichirProfilUtilisateur();
      
      Alert.alert("Succès", "Votre photo de profil a été mise à jour !");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour la photo.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveProfileInfo = async () => {
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      Alert.alert("Champ obligatoire", "Le nom et le prénom ne peuvent pas être vides.");
      return;
    }

    setIsUpdating(true);
    try {
      const token = await getAccessToken();

      await update_user(user.id, editForm, token);
      await rafraichirProfilUtilisateur();
      
      setIsEditing(false);
      setIsPersonalInfoOpen(false); 
      Alert.alert("Succès", "Vos informations ont été modifiées avec succès !");
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de la modification.");
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
              // 1. Déconnexion Clerk si disponible
              if (typeof signOut === 'function') {
                await signOut().catch(() => null);
              }
              
              // 2. On redirige d'abord vers l'écran d'authentification 
              // pour quitter l'écran de profil actuel proprement avant de muter son état.
              router.replace('/Authentification'); 
              
              // 3. On nettoie les données locales en arrière-plan juste après
              setTimeout(async () => {
                await clearAuthUser().catch(() => null);
                await clearAuthToken().catch(() => null);
                setUser(null);
              }, 100);

            } catch (error) {
              Alert.alert("Erreur", "Impossible de procéder à la déconnexion.");
            }
          }
        }
      ]
    );
  };

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
              if (typeof signOut === 'function') {
                await signOut().catch(() => null);
              }
              const token = await getAccessToken();

              // Appel API pour supprimer le compte côté backend
              await delete_user(user.id, token);

              // Redirection immédiate avant le nettoyage d'état
              router.replace('/Authentification');

              // Nettoyage asynchrone sécurisé
              setTimeout(async () => {
                await clearAuthUser().catch(() => null);
                await clearAuthToken().catch(() => null);
                setUser(null);
                Alert.alert("Compte supprimé", "Votre compte a été supprimé avec succès.");
              }, 100);

            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le compte pour le moment.");
            }
          }
        }
      ]
    );
  };


  const firstName = (user?.first_name || '').trim();
  const lastName = (user?.last_name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'Utilisateur';
  const avatarUrl = user?.avatar || null;
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';

  if (isLoadingUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
   return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Zone d'invitation à la connexion */}
        <View style={styles.unauthCardContainer}>
          <View style={styles.unauthCard}>
            <View style={styles.unauthIconWrapper}>
              <Ionicons name="person-circle" size={80} color={COLORS.primary} />
            </View>
            <Text style={styles.unauthTitle}>Rejoignez-nous</Text>
            <Text style={styles.unauthSubtitle}>
              Connectez-vous à votre compte citoyen pour suivre vos démarches et accéder à votre profil complet.
            </Text>
            
            <TouchableOpacity 
              style={styles.unauthLoginBtn} 
              activeOpacity={0.8}
              onPress={() => router.replace('/Authentification')}
            >
              <Ionicons name="log-in-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.unauthLoginBtnText}>Se connecter / S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Section d'Assistance accessible sans compte */}
        <View style={[styles.menuContainer, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Besoin d'aide ?</Text>
          <View style={styles.sectionCard}>
            <MenuItem 
              icon="help-circle-outline" 
              title="Foire Aux Questions (FAQ)" 
              onPress={() => router.push('/FAQScreen')}
            />
            <MenuItem 
              icon="document-text-outline" 
              title="Conditions Générales d'Utilisation" 
              onPress={() => router.push('/CUG')} 
            />
            <MenuItem 
              icon="mail-outline" 
              title="Contacter le support client" 
              onPress={() => router.push('/ContactUsScreen')} 
            />
          </View>
          
          <Text style={styles.unauthFooterText}>
            Version de l'application 1.0.0
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImageFallback}>
              <Text style={styles.profileImageFallbackText}>{initials}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editBadge} onPress={pickImage} disabled={isUpdating}>
            {isUpdating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="camera" size={16} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{fullName}</Text>
        
        <TouchableOpacity 
          style={styles.editProfileInlineBtn} 
          onPress={() => {
            setEditForm({
              first_name: user?.first_name || '',
              last_name: user?.last_name || '',
              phone: user?.phone || '',
              email: user?.email || '',
            });
            setIsEditing(true);
            setIsPersonalInfoOpen(true); 
          }}
        >
          <Text style={styles.editProfileInlineText}>Modifier le profil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="person-outline" title="Information personnelle" onPress={() => {
            setIsEditing(false);
            setIsPersonalInfoOpen(true);
          }} />
          <MenuItem icon="information-circle-outline" title="À propos de nous" onPress={() => router.push('/AproposScreen')}/>
        </View>

        <Text style={styles.sectionTitle}>Assistance</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="help-circle-outline" title="FAQ" onPress={() => router.push('/FAQScreen')}/>
          <MenuItem icon="document-text-outline" title="Conditions et termes" onPress={() =>  router.push('/CUG')} />
          <MenuItem icon="mail-outline" title="Contactez-nous" onPress={() =>  router.push('/ContactUsScreen')} />
        </View>

        <Text style={styles.sectionTitle}>Connexion</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="trash-outline" title="Supprimer mon compte" onPress={handleDeleteAccount} />
          <MenuItem icon="log-out-outline" title="Déconnexion" color="#FF4444" onPress={handleLogout} />
        </View>
      </View>

      <View style={{ height: 40 }} />

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
              }}>
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
                    selectTextOnFocus={false}
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
                  { label: 'Type de compte', value: user?.user_type }
                ].map((info, index) => (
                  <View key={index} style={styles.modalRow}>
                    <Text style={styles.modalLabel}>{info.label}</Text>
                    <Text style={styles.modalValue}>{info.value || '-'}</Text>
                  </View>
                ))}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  <TouchableOpacity 
                    style={[styles.modalCloseBtn, { flex: 1, backgroundColor: COLORS.secondary }]} 
                    onPress={() => setIsEditing(true)}
                  >
                    <Text style={styles.modalCloseBtnText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalCloseBtn, { flex: 1 }]} 
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  header: { alignItems: 'center', paddingTop: height * 0.04, paddingBottom: 10 },
  imageContainer: { position: 'relative', marginBottom: 15 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.primary },
  profileImageFallback: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  profileImageFallbackText: { fontSize: 32, fontWeight: 'bold', color: COLORS.secondary },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  userName: { fontSize: 20, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 4 },
  editProfileInlineBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '12', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, marginTop: 4 },
  editProfileInlineText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  menuContainer: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.gray1, marginBottom: 8, marginLeft: 5, textTransform: 'uppercase' },
  sectionCard: { backgroundColor: 'white', borderRadius: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16, marginLeft: 12, fontWeight: '500' },

  unauthCardContainer: {
    paddingHorizontal: 20,
    paddingTop: height * 0.05,
    paddingBottom: 20,
  },
  unauthCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    // Ombres élégantes
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  unauthIconWrapper: {
    backgroundColor: COLORS.primary + '10', // Teinte très claire de ta couleur principale
    padding: 10,
    borderRadius: 50,
    marginBottom: 15,
  },
  unauthTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  unauthSubtitle: {
    fontSize: 14,
    color: COLORS.gray1,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
    marginBottom: 25,
  },
  unauthLoginBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    // Ombre sous le bouton d'action principal
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  unauthLoginBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  unauthFooterText: {
    fontSize: 11,
    textAlign: 'center',
    color: COLORS.gray1,
    marginTop: 15,
    opacity: 0.6,
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'white', padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalLabel: { fontSize: 11, color: COLORS.gray1, textTransform: 'uppercase', marginBottom: 4 },
  modalValue: { fontSize: 15, color: COLORS.secondary, fontWeight: '600' },
  modalCloseBtn: { marginTop: 10, backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  modalCloseBtnText: { color: 'white', fontWeight: 'bold' },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray1, marginBottom: 6 },
  requiredAsterisk: { color: '#FF4444', fontWeight: 'bold' },
  textInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.secondary, backgroundColor: '#FAFAFA' },
  textInputDisabled: { backgroundColor: '#ECECEC', borderColor: '#DCDCDC', color: '#888888', opacity: 0.7 }
});