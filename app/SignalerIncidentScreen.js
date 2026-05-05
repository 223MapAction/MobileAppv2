import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { envoyerIncident } from "../api/incidents";
import { COLORS } from '../Composants/themeConfig';
import { getAuthUser } from '../storage/authStorage';
const { width } = Dimensions.get('window');

export default function SignalerIncidentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { photoUri: initialPhoto } = route.params || {};


  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);

  const [photoUri, setPhotoUri] = useState(initialPhoto);
  const [videoUri, setVideoUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [recording, setRecording] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getAuthUser();
      setUser(userData);
    };
    loadUser();
  }, []);
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "La localisation est nécessaire.");
        setLoadingLocation(false);
        return;
      }
      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        let address = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        setLocation({ coords: currentLocation.coords, address: address[0] });
      } catch (error) {
        console.error("Erreur localisation:", error);
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);


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
      setVideoUri(result.assets[0].uri);
    }
  };

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  }

  async function stopRecording() {
    try {
      setRecording(null);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
    } catch (error) {
      // console.error("Erreur arrêt audio", error);
    }
  }


  const handleSendIncident = async () => {
  if (!location) {
    Alert.alert("Attente", "Localisation en cours...");
    return;
  }

  setSending(true);

  // Utilise l'optional chaining (?.) pour ne pas planter si user est null
  const incidentData = {
    user_id: user?.id || null, 
    title: "Incident MapAction",
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
    const result = await envoyerIncident(incidentData);
    if (result.ok) {
      Alert.alert("Succès", "Incident envoyé avec succès !", [
        { text: "OK", onPress: () => navigation.navigate('index') }
      ]);
    } else {
      Alert.alert("Erreur", "Le serveur n'a pas pu traiter le signalement.");
    }
  } catch (error) {
    Alert.alert("Erreur", "Une erreur critique est survenue.");
  } finally {
    setSending(false);
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Signaler un incident</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

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
            <Ionicons name={videoUri ? "videocam" : "videocam-outline"} size={40} color={videoUri ? COLORS.primary : "gray"} />
            <Text style={[styles.cardText, !videoUri && {color: 'gray'}]}>Vidéo</Text>
            {videoUri && (
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Audio (Facultatif)</Text>
          <TouchableOpacity 
            style={[styles.actionRow, audioUri && {borderColor: COLORS.primary, borderWidth: 2}]} 
            onPress={recording ? stopRecording : startRecording}
          >
            <View style={styles.textContainer}>
              <Text style={styles.actionTitle}>
                {recording ? "Enregistrement..." : audioUri ? "Vocal enregistré" : "Ajouter un vocal"}
              </Text>
              <Text style={styles.actionSub}>
                {recording ? "Appuyez pour arrêter" : "Appuyez pour enregistrer"}
              </Text>
            </View>
            <View style={[styles.iconCircleRight, recording && {backgroundColor: '#e74c3c'}]}>
              <MaterialIcons name={recording ? "stop" : "mic-none"} size={26} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* LOCATION */}
        <View style={styles.locationGroup}>
          <Text style={styles.label}>Position de l'incident</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={24} color={COLORS.red1} />
            <View style={styles.locationTextData}>
              {loadingLocation ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : location ? (
                <>
                  <Text style={styles.addressText}>{location.address?.city || 'Bamako'}, {location.address?.street || 'Position actuelle'}</Text>
                  <Text style={styles.coordsText}>{location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}</Text>
                </>
              ) : (
                <Text style={{color: 'red'}}>Position non détectée</Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, sending && {backgroundColor: 'gray'}]} 
          onPress={handleSendIncident}
          disabled={sending}
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
  container: { flex: 1, },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray2,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'black' },
  closeBtn: { position: 'absolute', right: 20, top: 50 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  card: {
    width: width * 0.43,
    height: width * 0.43,
    backgroundColor: 'white',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray2,
    elevation: 2,
    overflow: 'hidden',
  },
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
});