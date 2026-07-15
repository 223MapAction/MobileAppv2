import { FontAwesome } from '@expo/vector-icons'; // Importation de FontAwesome pour l'icône de fermeture
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Pour éviter l'encoche de l'iPhone (Dynamic Island)
import { COLORS } from '../../Composants/themeConfig';

const { width, height } = Dimensions.get('window');

export default function TabTwoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Gestion des marges de l'encoche iOS
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  // --- NAVIGATION VERS LE FORMULAIRE ---
  const handleAccept = () => {
    if (photo && photo.uri) {
      console.log("Photo validée, navigation vers le formulaire...");
      router.push({
        pathname: "/SignalerIncidentScreen", 
        params: { photoUri: photo.uri }
      });
      
      // On réinitialise pour le prochain retour sur cet écran
      setPhoto(null);
    }
  };

  // --- GESTION DES PERMISSIONS ---
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        {/* Bouton retour également présent sur l'écran d'autorisation */}
        <TouchableOpacity 
          style={[styles.closeButton, { top: insets.top > 0 ? insets.top + 10 : 30 }]} 
          onPress={() => router.back()}
        >
          <FontAwesome name="times" size={20} color="white" />
        </TouchableOpacity>

        <Text style={styles.textInfo}>Accès à la caméra nécessaire</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnActionPermission}>
          <Text style={{ color: 'white' }}>Autoriser l'appareil photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- CAPTURE ---
  const takePicture = async () => {
    if (cameraRef.current && isCameraReady && !loading) {
      try {
        setLoading(true);
        const options = { quality: 0.3, base64: false };
        const data = await cameraRef.current.takePictureAsync(options);
        setPhoto(data);
      } catch (e) {
        console.error("Erreur capture:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- AFFICHAGE APERÇU ---
  if (photo && photo.uri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        
        {/* Bouton retour rapide (X) sur l'aperçu si on veut juste quitter */}
        <TouchableOpacity 
          style={[styles.closeButton, { top: insets.top > 0 ? insets.top + 10 : 30 }]} 
          onPress={() => setPhoto(null)}
        >
          <FontAwesome name="times" size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.btnAction, { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'white' }]} 
            onPress={() => setPhoto(null)}
          >
            <Text style={styles.btnText}>Réessayer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btnAction, { backgroundColor: COLORS.primary }]} 
            onPress={handleAccept}
          >
            <Text style={styles.btnText}>Accepter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- AFFICHAGE CAMÉRA ---
  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFill}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
      >
        {/* 1. BOUTON RETOUR POUR IPHONE (flottant en haut à gauche) */}
        <TouchableOpacity 
          style={[styles.closeButton, { top: insets.top > 0 ? insets.top + 10 : 30 }]} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <FontAwesome name="times" size={22} color="white" />
        </TouchableOpacity>

        <View style={styles.overlay}>
          {loading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    width: width,
    height: height,
  },
  // Style du bouton de fermeture transparent
  closeButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Fond semi-transparent pour rester visible peu importe le décor
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureBtn: {
    width: width * 0.22, 
    height: width * 0.22,
    borderRadius: (width * 0.22) / 2,
    borderWidth: 5,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  captureInner: {
    width: width * 0.16,
    height: width * 0.16,
    borderRadius: (width * 0.16) / 2,
    backgroundColor: COLORS.white,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  btnAction: {
    width: width * 0.42,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
  },
  btnActionPermission: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 20
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textInfo: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    paddingHorizontal: 20,
  }
});