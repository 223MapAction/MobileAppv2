import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useRoute } from '@react-navigation/native';
import { getZoneFromOSM } from '../services/general';

import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { envoyerIncident } from "../api/incidents";
import { OfflineManagerAgent } from '../api/OfflineManagerAgent';
import { COLORS } from '../Composants/themeConfig';
import { getAuthToken, getAuthUser } from '../storage/authStorageAgent';

const { width } = Dimensions.get('window');

export default function SignalerIncidentScreen() {
  const router = useRouter();
  const route = useRoute();
  const { photoUri: initialPhoto } = route.params || {};

  // ÉTATS GÉNÉRAUX
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [zoneName, setZoneName] = useState('Bamako');
  const [locationError, setLocationError] = useState(false);
  const [sending, setSending] = useState(false);
  const [agent, setAgent] = useState(null); 

  // ÉTATS MULTIMÉDIA
  const [photoUri, setPhotoUri] = useState(initialPhoto);
  const [videoUri, setVideoUri] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [recording, setRecording] = useState(null);
  const [audioLevels, setAudioLevels] = useState([4, 4, 4, 4, 4]); 

  // Charger les infos de l'agent connecté
  useEffect(() => {
    const loadAgent = async () => {
      try {
        const agentData = await getAuthUser().catch(() => null);
        const tokenData = await getAuthToken().catch(() => null);
        const token = tokenData?.access || tokenData;

        if (!agentData || !token) {
          Alert.alert("Accès refusé", "Vous devez être connecté en tant qu'agent pour accéder à cet écran.", [
            { text: "OK", onPress: () => router.replace('/LoginAgent') }
          ]);
          return;
        }
        
        setAgent({ ...agentData, token });
      } catch (error) {
        console.error("Erreur chargement agent storage :", error);
      }
    };
    loadAgent();
  }, []);

  // Gestion de la géolocalisation
  const obtenirPosition = async () => {
    setLoadingLocation(true);
    setLocationError(false);
    
    try {
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setLocationError(true);
        setLoadingLocation(false);
        return;
      }

      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const request = await Location.requestForegroundPermissionsAsync();
        status = request.status;
      }

      if (status !== 'granted') {
        setLocationError(true);
        setLoadingLocation(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      let address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      
      setLocation({ coords: currentLocation.coords, address: address[0] });

      const zoneRecuperee = await getZoneFromOSM(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      ).catch(() => 'Bamako');
      
      setZoneName(zoneRecuperee);

    } catch (error) {
      console.error("Erreur localisation :", error);
      setLocationError(true);
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    obtenirPosition();
  }, []);

  // Sélection/Enregistrement Vidéo
  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission", "Accès caméra requis pour la vidéo.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5, // Compresse légèrement pour un téléversement plus rapide sur le terrain
    });

    if (!result.canceled) {
      const sourceUri = result.assets[0].uri;
      setVideoUri(sourceUri);

      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(sourceUri, { time: 1000 });
        setVideoThumbnail(uri);
      } catch (e) {
        console.warn("Erreur génération vignette vidéo:", e);
      }
    }
  };

  // Audio : Démarrer
  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        
        const recordingOptions = {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: { ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android, meteringEnabled: true },
          ios: { ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios, meteringEnabled: true },
        };

        const { recording } = await Audio.Recording.createAsync(
          recordingOptions,
          (status) => {
            if (status.metering !== undefined) {
              // Normalisation propre pour la hauteur des barres de l'onde visuelle
              const normalizedLevel = Math.max(4, Math.min(35, (status.metering + 160) / 4));
              setAudioLevels((prev) => {
                const newLevels = [...prev, normalizedLevel];
                if (newLevels.length > 18) newLevels.shift();
                return newLevels;
              });
            }
          },
          100
        );
        setRecording(recording);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  }

  // Audio : Arrêter
  async function stopRecording() {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      setAudioLevels([4, 4, 4, 4, 4]);
    } catch (error) {
      console.error("Erreur arrêt enregistrement audio :", error);
      setRecording(null);
    }
  }

  // Soumission finale de l'incident
  const handleSendIncident = async () => {
    if (!location) {
      Alert.alert("Erreur", "Impossible d'envoyer l'incident sans position GPS.");
      return;
    }

    if (!agent || !agent.token) {
      Alert.alert("Erreur", "Votre session d'agent est invalide. Veuillez vous reconnecter.");
      return;
    }

    setSending(true);
    const network = await NetInfo.fetch().catch(() => ({ isConnected: false }));

    // Extraction sécurisée et résiliente de l'ID utilisateur
    const targetUserId = agent?.id || agent?.user_id || agent?.user?.id || null;

    const incidentData = {
      user_id: targetUserId, 
      title: description ? (description.substring(0, 22) + "...") : "Incident Terrain",
      description: description || "",
      lattitude: location.coords.latitude.toString(),
      longitude: location.coords.longitude.toString(),
      zone: zoneName,
      photo: photoUri || "", 
      audio: audioUri || "", 
      video: videoUri || "", 
      etat: "declared",
      agent_token: agent.token 
    };

    try {
      if (network.isConnected) {
        // Envoi réseau standard
        const result = await envoyerIncident(incidentData, agent.token);
        
        if (result && result.ok) {
          Alert.alert("Succès", "Incident terrain envoyé et enregistré sur le serveur !");
          router.replace('/(tabs_agent)'); 
        } else {
          throw new Error("Échec de la validation serveur");
        }
      } else {
        // Stockage hors-ligne direct si pas de réseau détecté
        const saved = await OfflineManagerAgent.saveForLater(incidentData);
        if (saved) {
          Alert.alert(
            "Mode Hors-ligne", 
            "Aucune connexion réseau. L'incident a été stocké localement et sera synchronisé automatiquement à la détection d'Internet.",
            [{ text: "Compris", onPress: () => router.replace('/(tabs_agent)') }] 
          );
        }
      }
    } catch (error) {
      console.error("Erreur envoi direct (bascule sur cache local) :", error);
      // Sécurité en cas de timeout réseau ou crash API
      const savedFallback = await OfflineManagerAgent.saveForLater(incidentData);
      if (savedFallback) {
        Alert.alert(
          "Rapport mis en sécurité", 
          "Le serveur est momentanément inaccessible. Votre rapport a été stocké localement.",
          [{ text: "OK", onPress: () => router.replace('/(tabs_agent)') }] 
        );
      }
    } finally {
      setSending(false);
    }
  };

  if (!loadingLocation && locationError) {
    return (
      <View style={styles.containerBlocked}>
        <Ionicons name="location-off" size={80} color="#e74c3c" />
        <Text style={styles.blockedTitle}>Localisation requise</Text>
        <Text style={styles.blockedText}>
          Impossible de signaler un incident sans coordonnées GPS. Veuillez activer votre GPS et autoriser l'application.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={obtenirPosition}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rapport d'incident (Terrain)</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* CARTES MULTIMÉDIA (PHOTO & VIDÉO) */}
        <View style={styles.cardsRow}>
          <View style={[styles.card, photoUri && styles.cardActive]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.cardImage} />
            ) : (
              <Ionicons name="camera" size={40} color="gray" />
            )}
            <Text style={styles.cardText}>Photo</Text>
            {photoUri && (
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.card, videoUri && styles.cardActive]} 
            onPress={handlePickVideo}
            activeOpacity={0.8}
          >
            {videoThumbnail ? (
              <Image source={{ uri: videoThumbnail }} style={styles.cardImage} />
            ) : (
              <Ionicons name={videoUri ? "videocam" : "videocam-outline"} size={40} color={videoUri ? COLORS.primary : "gray"} />
            )}
            <Text style={[styles.cardText, !videoUri && {color: 'gray'}]}>Vidéo</Text>
            {videoUri && (
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* CHAMPS DESCRIPTION */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes de l'agent / Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Renseignez les constatations du terrain..."
            multiline={true}
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        {/* ENREGISTREMENT VOCAL */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Note vocale (Facultatif)</Text>
          <TouchableOpacity 
            style={[styles.actionRow, audioUri && {borderColor: COLORS.primary, borderWidth: 2}]} 
            onPress={recording ? stopRecording : startRecording}
            activeOpacity={0.9}
          >
            <View style={styles.textContainer}>
              <Text style={styles.actionTitle}>
                {recording ? "Enregistrement en cours..." : audioUri ? "Note vocale enregistrée" : "Enregistrer un vocal"}
              </Text>
              
              {recording ? (
                <View style={styles.waveContainer}>
                  {audioLevels.map((level, index) => (
                    <View key={index} style={[styles.waveBar, { height: level }]} />
                  ))}
                </View>
              ) : (
                <Text style={styles.actionSub}>
                  {audioUri ? "Appuyer pour réenregistrer" : "Appuyer pour démarrer le micro"}
                </Text>
              )}
            </View>

            <View style={[styles.iconCircleRight, recording && {backgroundColor: '#e74c3c'}]}>
              <MaterialIcons name={recording ? "stop" : "mic-none"} size={26} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* BLOC GEOLOCALISATION */}
        <View style={styles.locationGroup}>
          <Text style={styles.label}>Localisation d'intervention</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={24} color={COLORS.red1 || '#e74c3c'} />
            <View style={styles.locationTextData}>
              {loadingLocation ? (
                <ActivityIndicator size="small" color={COLORS.primary} alignSelf="flex-start" />
              ) : (
                <>
                  <Text style={styles.addressText}>{zoneName}{location?.address?.street ? `, ${location.address.street}` : ''}</Text>
                  <Text style={styles.coordsText}>{location?.coords?.latitude?.toFixed(5)}, {location?.coords?.longitude?.toFixed(5)}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* BOUTON DE SOUMISSION */}
        <TouchableOpacity 
          style={[styles.submitBtn, (sending || loadingLocation) && {backgroundColor: '#bdc3c7'}]} 
          onPress={handleSendIncident}
          disabled={sending || loadingLocation}
        >
          {sending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Soumettre le rapport</Text>
              <Ionicons name="send" size={20} color="white" style={{marginLeft: 10}} />
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 50, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.gray2 || '#f5f6fa' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'black' },
  closeBtn: { position: 'absolute', right: 20, top: 50 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  card: { width: width * 0.43, height: width * 0.43, backgroundColor: 'white', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray2 || '#f5f6fa', elevation: 2, overflow: 'hidden' },
  cardActive: { borderColor: COLORS.primary, borderWidth: 2 },
  cardImage: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  cardText: { marginTop: 10, fontWeight: '600', fontSize: 15, color: COLORS.primary },
  checkBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 12 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.secondary || '#2c3e50', marginBottom: 8 },
  textArea: { backgroundColor: 'white', borderRadius: 12, padding: 15, height: 100, borderColor: COLORS.gray2 || '#f5f6fa', borderWidth: 1, fontSize: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, borderColor: COLORS.gray2 || '#f5f6fa', borderWidth: 1, justifyContent: 'space-between' },
  textContainer: { flex: 1 },
  iconCircleRight: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: '600' },
  actionSub: { fontSize: 13, color: 'gray' },
  locationGroup: { marginBottom: 30 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  locationTextData: { marginLeft: 12, flex: 1 },
  addressText: { fontSize: 15, fontWeight: '600', color: COLORS.secondary || '#2c3e50' },
  coordsText: { fontSize: 12, color: COLORS.gray1 || '#7f8c8d', marginTop: 2 },
  submitBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  submitBtnText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  containerBlocked: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fcfcfc' },
  blockedTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, color: '#2c3e50' },
  blockedText: { fontSize: 15, color: '#7f8c8d', textAlign: 'center', marginTop: 10, marginBottom: 30, lineHeight: 22 },
  retryBtn: { backgroundColor: COLORS.primary, width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  retryBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { width: '100%', paddingVertical: 15, alignItems: 'center' },
  cancelBtnText: { color: '#7f8c8d', fontSize: 16, fontWeight: '600' },
  waveContainer: { flexDirection: 'row', alignItems: 'center', height: 25, marginTop: 8 },
  waveBar: { width: 3, backgroundColor: '#e74c3c', marginHorizontal: 1.5, borderRadius: 2 },
});