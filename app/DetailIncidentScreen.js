import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getIncidentByIdOnline } from '../api/incidents';
import { OfflineManager } from '../api/offlineManager';
import AudioPlayer from '../Composants/AudioPlayer';
import { COLORS } from '../Composants/themeConfig';
import VideoPlayer from '../Composants/VideoPlayer';
import { getActiveAccessToken } from '../hooks/usePushNotifications';

const { width } = Dimensions.get('window');

export default function DetailIncidentScreen() {
  const router = useRouter();
  const { id, isLocal } = useLocalSearchParams();
  
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerDetailIncident = async () => {
      setLoading(true);
      try {
        if (isLocal === 'true') {
          // Un incident local peut être soit en attente d'envoi (file
          // d'attente offline, citoyen connecté ou anonyme), soit un
          // incident anonyme déjà synchronisé (historique dédié) —
          // on cherche dans les deux réserves.
          const [pendingIncidents, anonymousHistory] = await Promise.all([
            OfflineManager.getPendingIncidents(),
            OfflineManager.getAnonymousHistory(),
          ]);
          const localItems = [...pendingIncidents, ...anonymousHistory];
          const found = localItems.find(item =>
            (item.id?.toString() === id || item.id_local?.toString() === id)
          );
          setIncident(found);
        } else {
          const token = await getActiveAccessToken();

          if (token) {
            const result = await getIncidentByIdOnline(id, token);
            if (result.ok) {
              setIncident(result.data);
            } else {
              console.error("Erreur API de détails:", result.error);
            }
          }
        }
      } catch (error) {
        console.error("Erreur récupération détails incident :", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) chargerDetailIncident();
  }, [id, isLocal]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'declared': return 'Déclaré';
      case 'taken_into_account': return 'Prise en compte';
      case 'resolved': return 'Résolu';
      default: return 'En traitement';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'declared': return COLORS.primary;
      case 'taken_into_account': return '#6c5ce7'; // Violet/Bleu
      case 'resolved': return '#2ecc71'; // Vert
      default: return COLORS.primary;
    }
  };

  // --- NOUVEAU : Fonction pour gérer le style des barres de progression ---
  const renderStatusStepper = (currentStatus) => {
    const steps = ['declared', 'taken_into_account', 'resolved'];
    const currentIndex = steps.indexOf(currentStatus);

    return (
      <View style={styles.stepperContainer}>
        {steps.map((step, index) => {
          // La barre s'allume si l'état actuel est supérieur ou égal à cette étape
          const isVisited = currentIndex >= index;
          const barColor = isVisited ? getStatusColor(currentStatus) : '#e0e0e0';

          return (
            <View key={step} style={styles.stepWrapper}>
              <View style={[styles.stepBar, { backgroundColor: barColor }]} />
              <Text style={[styles.stepLabel, isVisited && { color: getStatusColor(currentStatus), fontWeight: '600' }]}>
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
        <Text style={styles.errorText}>Impossible de charger les détails de ce rapport.</Text>
        <TouchableOpacity style={styles.backButtonText} onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail d'un report</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Image Principale */}
        {incident.photo ? (
          <Image source={{ uri: incident.photo }} style={styles.mainImage} contentFit="cover" />
        ) : (
          <View style={[styles.mainImage, styles.fallbackImage]}>
            <Ionicons name="image-outline" size={50} color={COLORS.gray1} />
          </View>
        )}

        {/* --- AJOUT DE LA BARRE DES TROIS ÉTATS --- */}
        {renderStatusStepper(incident.etat)}

        {/* Description & Badge de statut */}
        <View style={styles.sectionRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionValue}>{incident.description || "Pas de description"}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.etat) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(incident.etat) }]}>
              {getStatusLabel(incident.etat).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Position GPS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position</Text>
          <Text style={styles.sectionValue}>{incident.zone || "Niamana attbougou"}</Text>
        </View>

        {/* Note Vocale */}
        {incident.audio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note vocal</Text>
            <AudioPlayer uri={incident.audio} />
          </View>
        )}

        {/* Vidéo */}
        {incident.video && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vidéo</Text>
            <VideoPlayer uri={incident.video} posterUri={incident.photo} />
          </View>
        )}

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
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  mainImage: { width: '100%', height: 230, borderRadius: 16, marginBottom: 10 }, // Marge réduite pour coller au stepper
  fallbackImage: { backgroundColor: '#f5f6fa', justifyContent: 'center', alignItems: 'center' },
  
  // --- STYLE DU STEPPER (LES 3 BARRES) ---
  stepperContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, marginTop: 5 },
  stepWrapper: { flex: 1, marginRight: 8 },
  stepBar: { height: 6, borderRadius: 3, marginBottom: 6 },
  stepLabel: { fontSize: 11, color: '#b2bec3', textAlign: 'center', fontWeight: '500' },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2c3e50', marginBottom: 6 },
  sectionValue: { fontSize: 15, color: '#7f8c8d', lineHeight: 20 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  errorText: { fontSize: 15, color: '#7f8c8d', marginBottom: 15 },
  backButtonText: { padding: 10 }
});