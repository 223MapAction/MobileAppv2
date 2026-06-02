import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { createFieldReport } from '../api/AgentReports';
import { COLORS } from '../Composants/themeConfig';
import { getAuthUser } from '../storage/authStorageAgent';

export default function FormulaireReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Récupération robuste de l'ID (gère les différents noms de clés possibles)
  const incidentId = params.incidentId || params.id || params.incident_id;

  // États du formulaire
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [location, setLocation] = useState({ lat: null, lon: null });
  
  // États de chargement et d'interface
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-détection de la position GPS à l'ouverture de l'écran
  useEffect(() => {
    requestAndGetLocation();
  }, []);

  // Fonction pour récupérer la position GPS réelle de l'agent
  const requestAndGetLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permission refusée",
          "L'accès à la position est nécessaire pour certifier que vous êtes sur les lieux de l'incident (règle des 100 mètres)."
        );
        setLoadingLocation(false);
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        lat: currentPosition.coords.latitude,
        lon: currentPosition.coords.longitude,
      });
    } catch (error) {
      console.error("Erreur de récupération GPS :", error);
      Alert.alert("Erreur GPS", "Impossible de capter votre position actuelle. Vérifiez que votre localisation est activée.");
    } finally {
      setLoadingLocation(false);
    }
  };

  // Fonction pour choisir ou prendre une photo du terrain
  const handlePickImage = async (useCamera = false) => {
    try {
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert("Permission requise", "L'accès à l'appareil ou à la galerie a été refusé.");
        return;
      }

      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection d'image :", error);
      Alert.alert("Erreur", "Un problème est survenu lors de la capture de l'image.");
    }
  };

  // Soumission finale du rapport
  const handleSubmitReport = async () => {
    if (!incidentId) {
      Alert.alert("Erreur technique", "ID de l'incident introuvable.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await getAuthUser();
      if (!session || !session.token) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter pour soumettre ce rapport.");
        setIsSubmitting(false);
        return;
      }

      // Formatage strict des données pour correspondre aux attentes des APIs (multipart/form-data)
      const reportPayload = {
        incidentId: String(incidentId), 
        lat: location.lat ? location.lat.toFixed(7) : null,
        lon: location.lon ? location.lon.toFixed(7) : null,
        notes: notes.trim(),
        photoUri
      };

      console.log("=== ENVOI DU RAPPORT TERRAIN ===");
      console.log("Payload généré par le formulaire :", reportPayload);

      const response = await createFieldReport(session.token, reportPayload);

      if (response.ok) {
        Alert.alert(
          "Rapport Transmis !",
          "Votre rapport terrain a bien été enregistré. Le statut de l'incident est passé à 'Rapporté'.",
          [{ 
            text: "Parfait", 
            onPress: () => {
              // Option A : Si tes onglets sont définis sur la route '/tabs_agent'
              router.replace('/HistoriqueReportsScreen');
              
            } 
          }]
        );
      } else {
        const serverError = response.error?.detail || response.error?.error || "Une erreur est survenue lors de l'enregistrement.";
        Alert.alert("Échec de la soumission", serverError);
      }
    } catch (err) {
      console.error("Erreur durant la soumission du rapport :", err);
      Alert.alert("Erreur réseau", "Impossible de joindre le serveur central.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Écran d'erreur bloquant si l'id de l'incident n'a pas pu être résolu
  if (!incidentId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#EF4444" />
        <Text style={styles.errorText}>Erreur : Aucun incident associé à ce rapport.</Text>
        <TouchableOpacity style={styles.errorReturnBtn} onPress={() => router.back()}>
          <Text style={styles.errorReturnBtnText}>Retourner en arrière</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* HEADER DE LA PAGE */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau Rapport Terrain</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} bounces={false}>
        
        {/* BLOC GEO-LOCALISATION FORCEE */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="map-marker-check" size={22} color="#059669" />
            <Text style={styles.cardTitle}>Validation Géographique</Text>
          </View>
          
          {loadingLocation ? (
            <View style={styles.geoLoadingView}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.geoSubText}>Calcul de vos coordonnées satellites en cours...</Text>
            </View>
          ) : (
            <View style={styles.geoSuccessView}>
              <Text style={styles.geoCoordinatesText}>
                {location.lat && location.lon 
                  ? `Latitude : ${location.lat.toFixed(5)} \nLongitude : ${location.lon.toFixed(5)}`
                  : "Coordonnées GPS introuvables."}
              </Text>
              <TouchableOpacity style={styles.refreshGeoBtn} onPress={requestAndGetLocation}>
                <Ionicons name="refresh" size={16} color={COLORS.primary} />
                <Text style={styles.refreshGeoText}>Actualiser</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* BLOC CAPTURE VISUELLE (PHOTO) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="camera" size={22} color={COLORS.secondary} />
            <Text style={styles.cardTitle}>Preuve d'intervention visuelle</Text>
          </View>

          {photoUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.deletePhotoBadge} onPress={() => setPhotoUri(null)}>
                <Ionicons name="trash" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoActionRow}>
              <TouchableOpacity style={styles.photoSelectorBtn} onPress={() => handlePickImage(true)}>
                <Ionicons name="camera-outline" size={26} color={COLORS.primary} />
                <Text style={styles.photoBtnText}>Appareil Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.photoSelectorBtn, styles.photoSelectorBtnOutline]} onPress={() => handlePickImage(false)}>
                <Ionicons name="image-outline" size={26} color="#4B5563" />
                <Text style={[styles.photoBtnText, { color: '#4B5563' }]}>Galerie</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* BLOC NOTES / COMMENTAIRES */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="notebook-edit-outline" size={22} color={COLORS.secondary} />
            <Text style={styles.cardTitle}>Observations de terrain</Text>
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="Décrivez précisément les faits constatés, l'état d'avancement ou les mesures d'urgence prises sur place..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {/* BOUTON DE SOUMISSION DEFINITIVE */}
        <TouchableOpacity 
          style={[styles.submitButton, (isSubmitting || loadingLocation) && styles.submitButtonDisabled]}
          onPress={handleSubmitReport}
          disabled={isSubmitting || loadingLocation}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <View style={styles.submitBtnContent}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={22} color="white" />
              <Text style={styles.submitButtonText}>Transmettre le rapport officiel</Text>
            </View>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 20 },
  errorText: { color: '#EF4444', fontWeight: '700', fontSize: 15, marginTop: 12, textAlign: 'center' },
  errorReturnBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#E5E7EB', borderRadius: 10 },
  errorReturnBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  closeButton: { padding: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  headerSpacer: { width: 40 },
  
  scrollContainer: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.3 },
  
  geoLoadingView: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  geoSubText: { fontSize: 13, color: '#6B7280' },
  geoSuccessView: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  geoCoordinatesText: { fontSize: 13, color: '#1F2937', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 18 },
  refreshGeoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, borderRadius: 8, backgroundColor: '#EFF6FF' },
  refreshGeoText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  photoActionRow: { flexDirection: 'row', gap: 12 },
  photoSelectorBtn: { flex: 1, height: 90, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed' },
  photoSelectorBtnOutline: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' },
  photoBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  imagePreviewContainer: { width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  deletePhotoBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#EF4444', padding: 8, borderRadius: 20 },

  textArea: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 14, color: '#1F2937', minHeight: 120 },

  submitButton: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 14, marginTop: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  submitButtonDisabled: { backgroundColor: '#9CA3AF', opacity: 0.7 },
  submitBtnContent: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  submitButtonText: { color: 'white', fontSize: 15, fontWeight: '700' }
});