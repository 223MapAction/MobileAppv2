import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../Composants/themeConfig';

export default function DetailIncidentAgentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [incidentDetail, setIncidentDetail] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  useEffect(() => {
    if (params.incident_detail) {
      try {
        const decodedDetails = JSON.parse(params.incident_detail);
        setIncidentDetail(decodedDetails);
      } catch (error) {
        console.error("Erreur de décodage des détails de l'incident :", error);
        Alert.alert("Erreur", "Impossible de charger les détails de cette mission.");
      }
    }
  }, [params.incident_detail]);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // Fonction pour ouvrir la navigation GPS (Google Maps / Apple Maps)
  const handleOpenNavigation = () => {
    const lat = incidentDetail?.lattitude;
    const lon = incidentDetail?.longitude;

    if (!lat || !lon || lat === "null" || lon === "null") {
      Alert.alert("Localisation indisponible", "Cet incident ne possède pas de coordonnées géographiques précises.");
      return;
    }

    // URL universelle fonctionnelle sur iOS et Android
    const label = encodeURIComponent(incidentDetail.title || "Incident Terrain");
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lon}(${label})`,
      android: `geo:0,0?q=${lat},${lon}(${label})`
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback sur le navigateur web si l'app native échoue
          const browserUrl = `http://googleusercontent.com/maps.google.com/?q=${lat},${lon}`;
          return Linking.openURL(browserUrl);
        }
      })
      .catch((err) => console.error("Erreur de lancement du GPS :", err));
  };

  const handlePlayPauseAudio = async () => {
    if (!incidentDetail?.audio) return;
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      setAudioLoading(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: incidentDetail.audio },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      setAudioLoading(false);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      setAudioLoading(false);
      console.error("Erreur de lecture audio :", error);
      Alert.alert("Échec", "La note vocale n'a pas pu être lue.");
    }
  };

  const getEtatBadge = (etat) => {
    switch (etat) {
      case 'taken_into_account':
        return { label: 'Pris en compte', bg: '#EFF6FF', text: '#1E40AF' };
      case 'declared':
        return { label: 'Déclaré', bg: '#FEF3C7', text: '#D97706' };
      case 'resolved':
        return { label: 'Résolu', bg: '#D1FAE5', text: '#10B981' };
      default:
        return { label: etat || 'Inconnu', bg: '#F3F4F6', text: '#374151' };
    }
  };

  if (!incidentDetail) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  const badge = getEtatBadge(incidentDetail.etat);

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView style={{ flex: 1 }} bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* SECTION HEADER IMAGE */}
        <View style={styles.imageContainer}>
          {incidentDetail.photo ? (
            <Image source={{ uri: incidentDetail.photo }} style={styles.mainImage} />
          ) : (
            <View style={styles.noImageView}>
              <Ionicons name="image-outline" size={60} color="#9CA3AF" />
              <Text style={styles.noImageText}>Aucune illustration photo</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* CONTENU PRINCIPAL */}
        <View style={styles.contentCard}>
          {/* TITRE & STATUT */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{incidentDetail.title || params.incident_title || "Sans titre"}</Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          </View>

          {/* LOCALISATION / ZONE */}
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker-radius" size={18} color={COLORS.primary} />
              <Text style={styles.metaText}>
                <Text style={{ fontWeight: '700' }}>Zone :</Text> {incidentDetail.zone || "Non spécifiée"}
              </Text>
            </View>
            
            {incidentDetail.lattitude && incidentDetail.longitude !== "null" && (
              <View style={[styles.metaRow, { marginTop: 8 }]}>
                <MaterialCommunityIcons name="compass-outline" size={18} color={COLORS.gray1} />
                <Text style={styles.coordinatesText}>
                  Lat: {incidentDetail.lattitude} | Lon: {incidentDetail.longitude}
                </Text>
              </View>
            )}
          </View>

          {/* DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description terrain</Text>
            <Text style={styles.descriptionText}>
              {incidentDetail.description?.trim() ? incidentDetail.description : "L'informateur n'a pas ajouté de description textuelle."}
            </Text>
          </View>

          {/* COMPOSANT AUDIO SI DISPONIBLE */}
          {incidentDetail.audio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Note Vocale jointe</Text>
              <TouchableOpacity 
                style={[styles.audioContainer, isPlaying && styles.audioPlayingBorder]} 
                onPress={handlePlayPauseAudio}
                disabled={audioLoading}
              >
                {audioLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons 
                    name={isPlaying ? "pause-circle" : "play-circle"} 
                    size={44} 
                    color={COLORS.primary} 
                  />
                )}
                <View style={styles.audioInfo}>
                  <Text style={styles.audioTitle}>
                    {isPlaying ? "Lecture en cours..." : "Enregistrement vocal terrain"}
                  </Text>
                  <Text style={styles.audioSubtitle}>
                    {isPlaying ? "Cliquez pour mettre en pause" : "Cliquez pour écouter l'audio"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ZONE FIXE DES ACTIONS TERRAIN (BAS DE PAGE) */}
      <View style={styles.actionToolbar}>
        {/* BOUTON GPS GOOGLE MAPS */}
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={handleOpenNavigation}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="google-maps" size={22} color="white" />
          <Text style={styles.navButtonText}>Aller sur la zone</Text>
        </TouchableOpacity>

        {/* BOUTON FAIRE UN RAPPORT */}
        <TouchableOpacity 
          style={styles.reportButton} 
          onPress={() => {
            router.push({
              pathname: '/FormulaireReportScreen', 
              params: { incidentId: incidentDetail.id } // CORRECTION : Extrait l'ID de l'objet parsé
            });
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="clipboard-text-plus-outline" size={22} color={COLORS.primary} />
          <Text style={styles.reportButtonText}>Faire un report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, color: COLORS.gray1, fontSize: 14 },
  imageContainer: { width: '100%', height: 260, backgroundColor: '#E5E7EB', position: 'relative' },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  noImageView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E5E7EB' },
  noImageText: { marginTop: 8, color: '#6B7280', fontWeight: '500', fontSize: 14 },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'white', padding: 10, borderRadius: 25, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
  contentCard: { flex: 1, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 5 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.secondary, flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  metaBox: { backgroundColor: '#F3F4F6', padding: 14, borderRadius: 14, marginBottom: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { marginLeft: 8, fontSize: 14, color: '#374151' },
  coordinatesText: { marginLeft: 8, fontSize: 12, color: '#6B7280', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  descriptionText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
  audioContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  audioPlayingBorder: { borderColor: COLORS.primary, backgroundColor: '#DBEAFE' },
  audioInfo: { marginLeft: 12, flex: 1 },
  audioTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  audioSubtitle: { fontSize: 12, color: '#1E40AF', opacity: 0.8, marginTop: 2 },

  actionToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  navButton: {
    flex: 1,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  navButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  reportButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  reportButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  }
});