import { FontAwesome } from '@expo/vector-icons'; // Importation pour la croix de fermeture
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Pour éviter l'encoche sur iOS
import { COLORS } from '../Composants/themeConfig';

const { width, height } = Dimensions.get('window');

export default function TabTwoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Gestion dynamique de l'encoche iOS
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  // Réinitialise la photo dès que l'écran reprend le focus (ex: retour arrière depuis le formulaire)
  useFocusEffect(
    useCallback(() => {
      setPhoto(null);
    }, [])
  );

  // --- NAVIGATION VERS LE FORMULAIRE ---
  const handleAccept = () => {
    if (photo && photo.uri) {
      router.push({
        pathname: "/SignalerIncidentScreenByAgent", 
        params: { photoUri: photo.uri }
      });
    }
  };

  // --- GESTION DES PERMISSIONS ---
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        {/* Bouton pour fermer même si les permissions ne sont pas encore accordées */}
        <TouchableOpacity 
          style={[styles.closeButton, { top: insets.top > 0 ? insets.top + 10 : 30 }]} 
          onPress={() => router.back()}
        >
          <FontAwesome name="times" size={20} color="white" />
        </TouchableOpacity>

        <Text style={styles.textInfo}>Accès à la caméra nécessaire pour capturer les anomalies sur le terrain.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnActionPermission}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Autoriser l'appareil photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- CAPTURE ---
  const takePicture = async () => {
    if (cameraRef.current && isCameraReady && !loading) {
      try {
        setLoading(true);
        const options = { quality: 0.4, base64: false }; // Qualité ajustée pour optimiser le transfert réseau
        const data = await cameraRef.current.takePictureAsync(options);
        if (data) setPhoto(data);
      } catch (e) {
        console.error("Erreur lors de la capture photo :", e);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- AFFICHAGE APERÇU (SI PHOTO CAPTURÉE) ---
  if (photo && photo.uri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        
        {/* Bouton de sortie rapide direct depuis l'aperçu */}
        <TouchableOpacity 
          style={[styles.closeButton, { top: insets.top > 0 ? insets.top + 10 : 30 }]} 
          onPress={() => setPhoto(null)}
        >
          <FontAwesome name="times" size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.btnAction, { backgroundColor: COLORS.gray1 || '#7f8c8d' }]} 
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

  // --- AFFICHAGE FLUX CAMÉRA ---
  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFill}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
      >
        {/* BOUTON RETOUR IPHONE (flottant en haut à gauche et s'adaptant à la barre d'état) */}
        <TouchableOpacity 
          style={[styles.closeButton, { top: insets.top > 0 ? insets.top + 10 : 30 }]} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <FontAwesome name="times" size={22} color="white" />
        </TouchableOpacity>

        <View style={styles.overlay}>
          {loading ? (
            <ActivityIndicator size="large" color="white" style={{ marginBottom: 40 }} />
          ) : (
            <TouchableOpacity 
              style={styles.captureBtn} 
              onPress={takePicture}
              activeOpacity={0.8}
              disabled={!isCameraReady}
            >
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
    backgroundColor: COLORS.secondary || '#1A1A1A',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  preview: {
    flex: 1,
    width: width,
    height: height,
  },
  // Bouton X stylisé et flottant
  closeButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Reste visible peu importe l'arrière-plan de la caméra
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
    borderColor: COLORS.white || '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  captureInner: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: (width * 0.15) / 2,
    backgroundColor: COLORS.white || '#ffffff',
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
    width: width * 0.43,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  btnActionPermission: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 25,
    elevation: 2,
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textInfo: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  }
});