import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails'; // <-- Nouvel import
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { envoyerIncident } from "../api/incidents";
import { OfflineManager } from '../api/offlineManager';
import { COLORS } from '../Composants/themeConfig';
import { getAuthUser } from '../storage/authStorage';

const { width } = Dimensions.get('window');

export default function SignalerIncidentScreen() {
  const router = useRouter();
  const route = useRoute();
  const { photoUri: initialPhoto } = route.params || {};

  // ÉTATS GENERAUX
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);

  // ÉTATS MULTIMEDIA
  const [photoUri, setPhotoUri] = useState(initialPhoto);
  const [videoUri, setVideoUri] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null); // <-- Vignette vidéo
  const [audioUri, setAudioUri] = useState(null);
  const [recording, setRecording] = useState(null);
  const [audioLevels, setAudioLevels] = useState([1, 1, 1, 1, 1]); 

  // Charger les infos de l'utilisateur connecté
  useEffect(() => {
    const loadUser = async () => {
      const userData = await getAuthUser();
      setUser(userData);
    };
    loadUser();
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
    } catch (error) {
      console.error("Erreur localisation:", error);
      setLocationError(true);
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    obtenirPosition();
  }, []);

  // Enregistrement de la vidéo et extraction de la vignette
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
      quality: 0.7,
    });

    if (!result.canceled) {
      const sourceUri = result.assets[0].uri;
      setVideoUri(sourceUri);

      // Génération de la bannière visuelle à partir de la première seconde du fichier
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(sourceUri, {
          time: 1000,
        });
        setVideoThumbnail(uri);
      } catch (e) {
        console.warn("Erreur génération vignette vidéo:", e);
      }
    }
  };

  // Audio : Démarrer l'enregistrement
  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        
        const recordingOptions = {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
            meteringEnabled: true,
          },
          ios: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
            meteringEnabled: true,
          },
        };

        const { recording } = await Audio.Recording.createAsync(
          recordingOptions,
          (status) => {
            if (status.metering !== undefined) {
              const normalizedLevel = Math.max(4, Math.min(35, (status.metering + 160) / 4));
              setAudioLevels((prev) => {
                const newLevels = [...prev, normalizedLevel];
                if (newLevels.length > 15) newLevels.shift();
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

  // Audio : Arrêter l'enregistrement
  async function stopRecording() {
    try {
      setRecording(null);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setAudioLevels([1, 1, 1, 1, 1]);
    } catch (error) {
      // Gestion erreur silencieuse
    }
  }

  // Soumission de l'incident (Gère le online et le offline storage)
 const handleSendIncident = async () => {
  if (!location) {
    Alert.alert("Erreur", "Impossible d'envoyer l'incident sans position GPS.");
    return;
  }

  const network = await NetInfo.fetch();
  setSending(true);

  const incidentData = {
    user_id: user?.id || null, 
    title: description ? description.substring(0, 25) + "..." : "Incident anonyme",
    description: description || "",
    lattitude: location.coords.latitude.toString(),
    longitude: location.coords.longitude.toString(),
    zone: location.address?.city || "Bamako",
    photo: photoUri || "", 
    audio: audioUri || "", 
    video: videoUri || "", 
    etat: "declared",
  };

  try {
    if (network.isConnected) {
      // ---- CAS 1 : EN LIGNE ----
      const result = await envoyerIncident(incidentData);
      
      if (result.ok) {
        // SI L'UTILISATEUR EST ANONYME (Pas connecté)
        if (!user) {
          // On enregistre directement la réponse officielle du serveur dans son historique permanent
          // result.data contient déjà l'ID unique généré par la base de données et le created_at réel
          await OfflineManager.saveToAnonymousHistory(result.data);
        }
        
        Alert.alert("Succès", user ? "Incident envoyé avec succès !" : "Incident anonyme envoyé avec succès !");
        router.replace('/(tabs)');
      } else {
        throw new Error("Erreur serveur");
      }
    } else {
      // ---- CAS 2 : HORS LIGNE (Pas d'internet) ----
      const saved = await OfflineManager.saveForLater(incidentData);
      if (saved) {
        Alert.alert(
          "Mode Hors-ligne", 
          "Pas de connexion. L'incident a été enregistré localement et sera envoyé dès que vous aurez internet.",
          [{ text: "OK", onPress: () => router.replace('/(tabs)') }]
        );
      }
    }
  } catch (error) {
    // ---- CAS 3 : ERREUR RÉSEAU / TIMEOUT ----
    console.error("Erreur durant l'envoi :", error);
    const savedFallback = await OfflineManager.saveForLater(incidentData);
    if (savedFallback) {
      Alert.alert(
        "Incident sauvegardé", 
        "Une erreur réseau est survenue, mais votre incident a été mis en sécurité localement.",
        [{ text: "OK", onPress: () => router.replace('/(tabs)') }]
      );
    }
  } finally {
    setSending(false);
  }
};

  // Écran d'erreur si la géolocalisation fait défaut
  if (!loadingLocation && locationError) {
    return (
      <View style={styles.containerBlocked}>
        <Ionicons name="location-off" size={80} color="#e74c3c" />
        <Text style={styles.blockedTitle}>Localisation requise</Text>
        <Text style={styles.blockedText}>
          Impossible de signaler un incident sans coordonnées GPS. Veuillez activer votre GPS et autoriser l'application à accéder à votre position.
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
        <Text style={styles.headerTitle}>Signaler un incident</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* SECTION MULTIMEDIA : PHOTOS & VIDEOS */}
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
          >
            {/* Affichage dynamique : Vignette vidéo ou icône par défaut */}
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

        {/* CHAMP TEXTE : DESCRIPTION */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Facultatif)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Décrivez le problème ici..."
            multiline={true}
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        {/* COMPOSANT AUDIO STYLE MESSAGERIE */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Audio (Facultatif)</Text>
          <TouchableOpacity 
            style={[styles.actionRow, audioUri && {borderColor: COLORS.primary, borderWidth: 2}]} 
            onPress={recording ? stopRecording : startRecording}
          >
            <View style={styles.textContainer}>
              <Text style={styles.actionTitle}>
                {recording ? "Enregistrement en cours..." : audioUri ? "Vocal enregistré" : "Ajouter un vocal"}
              </Text>
              
              {recording ? (
                <View style={styles.waveContainer}>
                  {audioLevels.map((level, index) => (
                    <View key={index} style={[styles.waveBar, { height: level }]} />
                  ))}
                </View>
              ) : (
                <Text style={styles.actionSub}>
                  {audioUri ? "Appuyez pour réenregistrer" : "Appuyez pour enregistrer"}
                </Text>
              )}
            </View>

            <View style={[styles.iconCircleRight, recording && {backgroundColor: '#e74c3c'}]}>
              <MaterialIcons name={recording ? "stop" : "mic-none"} size={26} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* MODULE DE RECOGNITION DE POSITION INTERNE */}
        <View style={styles.locationGroup}>
          <Text style={styles.label}>Position de l'incident</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={24} color={COLORS.red1} />
            <View style={styles.locationTextData}>
              {loadingLocation ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Text style={styles.addressText}>{location?.address?.city || 'Bamako'}, {location?.address?.street || 'Position actuelle'}</Text>
                  <Text style={styles.coordsText}>{location?.coords.latitude.toFixed(5)}, {location?.coords.longitude.toFixed(5)}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* BOUTON D'ACTION PRINCIPAL */}
        <TouchableOpacity 
          style={[styles.submitBtn, (sending || loadingLocation) && {backgroundColor: 'gray'}]} 
          onPress={handleSendIncident}
          disabled={sending || loadingLocation}
        >
          {sending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Envoyer l'incident</Text>
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
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 50, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.gray2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'black' },
  closeBtn: { position: 'absolute', right: 20, top: 50 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  card: { width: width * 0.43, height: width * 0.43, backgroundColor: 'white', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray2, elevation: 2, overflow: 'hidden' },
  cardActive: { borderColor: COLORS.primary, borderWidth: 2 },
  cardImage: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  cardText: { marginTop: 10, fontWeight: '600', fontSize: 15, color: COLORS.primary },
  checkBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 12 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.secondary, marginBottom: 8 },
  textArea: { backgroundColor: 'white', borderRadius: 12, padding: 15, height: 100, borderColor: COLORS.gray2, borderWidth: 1, fontSize: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, borderColor: COLORS.gray2, borderWidth: 1, justifyContent: 'space-between' },
  textContainer: { flex: 1 },
  iconCircleRight: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: '600' },
  actionSub: { fontSize: 13, color: 'gray' },
  locationGroup: { marginBottom: 30 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  locationTextData: { marginLeft: 12, flex: 1 },
  addressText: { fontSize: 15, fontWeight: '600', color: COLORS.secondary },
  coordsText: { fontSize: 12, color: COLORS.gray1, marginTop: 2 },
  submitBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  submitBtnText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  
  // Interface bloquée (Absence GPS)
  containerBlocked: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fcfcfc' },
  blockedTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, color: '#2c3e50' },
  blockedText: { fontSize: 15, color: '#7f8c8d', textAlign: 'center', marginTop: 10, marginBottom: 30, lineHeight: 22 },
  retryBtn: { backgroundColor: COLORS.primary, width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  retryBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { width: '100%', paddingVertical: 15, alignItems: 'center' },
  cancelBtnText: { color: '#7f8c8d', fontSize: 16, fontWeight: '600' },
  
  // Onde d'enregistrement audio
  waveContainer: { flexDirection: 'row', alignItems: 'center', height: 40, marginTop: 5 },
  waveBar: { width: 3, backgroundColor: '#e74c3c', marginHorizontal: 2, borderRadius: 2 },
});