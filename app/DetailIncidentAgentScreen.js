import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getIncidentByIdOnline } from '../api/incidents';
import { OfflineManagerAgent } from '../api/OfflineManagerAgent'; // Importation du gestionnaire local
import AudioPlayer from '../Composants/AudioPlayer';
import { COLORS } from '../Composants/themeConfig';
import VideoPlayer from '../Composants/VideoPlayer';
import { getAuthUser } from '../storage/authStorageAgent';

export default function DetailIncidentAgentScreen() {
  const router = useRouter();
  const { id, isLocal } = useLocalSearchParams(); // Récupère l'ID et l'indicateur hors-ligne
  
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerIncidentDirect = async () => {
      if (!id) return;
      
      setLoading(true);
      console.log(`\n=== [DEBUG DETAIL] ID reçu: ${id} (Type: ${typeof id}) | Mode local: ${isLocal} ===`);

      try {
        // --- CAS 1 : L'INCIDENT EST STOCKÉ EN LOCAL (HORS-LIGNE) ---
        if (isLocal === 'true') {
          try {
            const localIncidents = await OfflineManagerAgent.getPendingIncidents() || [];
            const foundLocal = localIncidents.find(item => 
              (item?.id_local?.toString() === id.toString()) || (item?.id?.toString() === id.toString())
            );

            if (foundLocal) {
              console.log("=== [DEBUG DETAIL] Incident trouvé dans le cache local (Offline) ===");
              setIncident(foundLocal);
              setLoading(false);
              return;
            }
          } catch (localErr) {
            console.error("Erreur lecture cache local detail :", localErr);
          }
        }

        // --- CAS 2 : APPEL API EN LIGNE STANDARD ---
        const session = await getAuthUser().catch(() => null);
        const token = session?.access || session?.token || session; // Gestion de la double structure possible du token

        if (!token) {
          Alert.alert("Session introuvable", "Votre session a expiré. Veuillez vous reconnecter.");
          setLoading(false);
          return;
        }
        
        // Sécurité : On tente de passer l'ID en nombre si c'est ce qu'attend ton backend
        const cleanId = isNaN(Number(id)) ? id : Number(id);
        const result = await getIncidentByIdOnline(cleanId, token).catch((e) => {
          console.error("Erreur lors de l'appel getIncidentByIdOnline :", e);
          return null;
        });
        
        console.log("=== [DEBUG DETAIL] Structure complète du result API :", JSON.stringify(result));

        if (result && result.ok && result.data) {
          // Extraction robuste de l'objet incident (au cas où il est encapsulé)
          const apiIncidentData = result.data?.incident || result.data?.data || result.data;
          setIncident(apiIncidentData);
        } else {
          console.warn("-> [DEBUG DETAIL] Échec ou incident non trouvé sur l'API. Tentative de repli local globale...");
          
          // Fallback de secours si non trouvé en ligne : recherche globale en local
          const localIncidents = await OfflineManagerAgent.getPendingIncidents().catch(() => []) || [];
          const foundFallback = localIncidents.find(item => 
            (item?.id_local?.toString() === id.toString()) || (item?.id?.toString() === id.toString())
          );

          if (foundFallback) {
            console.log("=== [DEBUG DETAIL] Incident de secours trouvé en local ===");
            setIncident(foundFallback);
          } else {
            Alert.alert("Incident introuvable", "Les détails de cet incident ne sont pas disponibles actuellement.");
          }
        }
      } catch (error) {
        console.error("Erreur globale lors de la récupération du détail :", error);
        Alert.alert("Erreur de connexion", "Impossible de récupérer les détails. Veuillez vérifier votre réseau.");
      } finally {
        setLoading(false);
      }
    };

    chargerIncidentDirect();
  }, [id, isLocal]);

  // Convertit les états de la base de données pour l'affichage textuel
  const getStatusLabel = (status) => {
    switch (status) {
      case 'declared': return 'Déclaré';
      case 'taken_into_account': return 'Prise en compte';
      case 'resolved': return 'Résolu';
      default: return 'En traitement';
    }
  };

  // Associe la bonne couleur à chaque état
  const getStatusColor = (status) => {
    switch (status) {
      case 'declared': return COLORS.primary;
      case 'taken_into_account': return '#6c5ce7'; // Violet
      case 'resolved': return '#2ecc71'; // Vert
      default: return COLORS.primary;
    }
  };

  // Composant visuel du Stepper (Barre de progression des statuts)
  const renderStatusStepper = (currentStatus) => {
    const steps = ['declared', 'taken_into_account', 'resolved'];
    const safeStatus = steps.includes(currentStatus) ? currentStatus : 'declared';
    const currentIndex = steps.indexOf(safeStatus);

    return (
      <View style={styles.stepperContainer}>
        {steps.map((step, index) => {
          const isVisited = currentIndex >= index;
          const barColor = isVisited ? getStatusColor(safeStatus) : '#e0e0e0';

          return (
            <View key={step} style={styles.stepWrapper}>
              <View style={[styles.stepBar, { backgroundColor: barColor }]} />
              <Text style={[styles.stepLabel, isVisited && { color: getStatusColor(safeStatus), fontWeight: '600' }]}>
                {getStatusLabel(step)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.gray1} style={{ marginBottom: 10 }} />
        <Text style={styles.errorText}>Incident introuvable.</Text>
        <Text style={{ color: COLORS.gray1, fontSize: 12, marginBottom: 20 }}>ID recherché : {id}</Text>
        <TouchableOpacity style={styles.backButtonText} onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Support des deux versions linguistiques ou clés (API vs Local)
  const currentEtat = incident?.etat || incident?.status || 'declared';
  const currentTitle = incident?.title || incident?.titre || "Incident sans titre";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail de l'incident</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Image Principale */}
        {incident.photo ? (
          <Image source={{ uri: incident.photo }} style={styles.mainImage} contentFit="cover" cachePolicy="disk" />
        ) : (
          <View style={[styles.mainImage, styles.fallbackImage]}>
            <Ionicons name="image-outline" size={50} color={COLORS.gray1} />
          </View>
        )}

        {/* Barre des trois états (Stepper) */}
        {renderStatusStepper(currentEtat)}

        {/* Titre de l'incident */}
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.incidentTitle}>{currentTitle}</Text>
        </View>

        {/* Description & Badge de statut */}
        <View style={styles.sectionRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionValue}>{incident.description || "Pas de description renseignée"}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentEtat) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(currentEtat) }]}>
              {incident.isOffline ? "HORS-LIGNE" : getStatusLabel(currentEtat).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Position / Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position / Zone</Text>
          <Text style={styles.sectionValue}>{incident.zone || "Zone non spécifiée"}</Text>
        </View>

        {/* Note Vocale */}
        {incident.audio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note vocale</Text>
            <AudioPlayer uri={incident.audio} />
          </View>
        ) : null}

        {/* Vidéo */}
        {incident.video ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vidéo</Text>
            <VideoPlayer uri={incident.video} posterUri={incident.photo} />
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  mainImage: { width: '100%', height: 230, borderRadius: 16, marginBottom: 10 },
  fallbackImage: { backgroundColor: '#f5f6fa', justifyContent: 'center', alignItems: 'center' },
  
  stepperContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, marginTop: 5 },
  stepWrapper: { flex: 1, marginRight: 8 },
  stepBar: { height: 6, borderRadius: 3, marginBottom: 6 },
  stepLabel: { fontSize: 11, color: '#b2bec3', textAlign: 'center', fontWeight: '500' },

  incidentTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2c3e50', marginBottom: 6 },
  sectionValue: { fontSize: 15, color: '#7f8c8d', lineHeight: 20 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  errorText: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  backButtonText: { padding: 10 }
});