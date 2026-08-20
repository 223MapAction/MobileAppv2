import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { BackHandler, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import { COLORS } from './themeConfig';

const { width, height } = Dimensions.get('window');

// Capture vidéo in-app partagée citoyen/agent (voir hooks/useVideoRecorder.js
// pour le pourquoi du remplacement d'ImagePicker). Volontairement une simple
// View plein écran en position absolue plutôt qu'un <Modal> React Native :
// SignalerIncidentScreen est déjà présenté en `presentation: 'modal'` par
// expo-router (voir app/_layout.js), et imbriquer un second Modal natif
// dedans cassait l'affichage (mesure de fenêtre en conflit). Pas d'étape
// d'aperçu/validation séparée : dès que l'enregistrement s'arrête (coupure
// auto à maxDuration, ou stop manuel), la vidéo est directement remontée au
// formulaire parent — même principe que le vocal.
//
// mode="video" est indispensable : CameraView démarre en mode 'picture' par
// défaut, et recordAsync() échoue silencieusement (Alert "Impossible
// d'enregistrer la vidéo") tant que la session n'est pas explicitement en
// mode vidéo. videoQuality="480p" reprend le réglage de la v1 (moins
// gourmand, plus fiable sur les appareils bas/moyen de gamme).
export default function VideoRecorderModal({ visible, onClose, onConfirm, maxDuration = 10 }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);

  const {
    cameraRef,
    isRecording,
    elapsedSeconds,
    videoUri,
    videoThumbnail,
    startRecording,
    stopRecording,
    reset,
  } = useVideoRecorder({ maxDuration });

  // Repart d'un état propre à chaque nouvelle ouverture de l'écran. La
  // session caméra native met un instant à s'initialiser : sans attendre
  // onCameraReady, un tap trop rapide sur "enregistrer" fait échouer
  // recordAsync().
  useEffect(() => {
    if (visible) {
      reset();
      setIsCameraReady(false);
    }
  }, [visible]);

  // Dès que l'enregistrement produit une vidéo (uri + vignette prêtes),
  // on la remonte automatiquement au parent et on ferme l'écran.
  useEffect(() => {
    if (videoUri) {
      onConfirm(videoUri, videoThumbnail);
      reset();
    }
  }, [videoUri]);

  // Le bouton retour Android doit fermer l'écran vidéo plutôt que de
  // retomber sur l'écran en dessous.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  const hasPermissions = cameraPermission?.granted && micPermission?.granted;

  if (!visible) return null;

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {!hasPermissions ? (
          <View style={[styles.container, styles.centered]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.permissionText}>
              Accès à la caméra et au micro nécessaire pour filmer une vidéo.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={async () => {
                await requestCameraPermission();
                await requestMicPermission();
              }}
            >
              <Text style={styles.permissionBtnText}>Autoriser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            ref={cameraRef}
            mode="video"
            videoQuality="480p"
            onCameraReady={() => setIsCameraReady(true)}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isRecording}
            >
              <Ionicons name="close" size={22} color={isRecording ? 'rgba(255,255,255,0.4)' : 'white'} />
            </TouchableOpacity>

            {isRecording && (
              <View style={styles.timerBadge}>
                <View style={styles.recDot} />
                <Text style={styles.timerText}>{elapsedSeconds}s / {maxDuration}s</Text>
              </View>
            )}

            <View style={styles.overlay}>
              <Text style={styles.hintText}>
                {isRecording ? 'Enregistrement en cours…' : `Vidéo (max ${maxDuration}s)`}
              </Text>
              <TouchableOpacity
                style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
                disabled={!isRecording && !isCameraReady}
              >
                <View style={[styles.recordInner, isRecording && styles.recordInnerActive]} />
              </TouchableOpacity>
            </View>
          </CameraView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 9999,
    elevation: 9999,
  },
  container: {
    width,
    height,
    backgroundColor: COLORS.secondary || '#1A1A1A',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  permissionText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timerBadge: {
    position: 'absolute',
    top: 55,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
  },
  timerText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  hintText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.9,
  },
  recordBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordBtnActive: {
    borderColor: '#e74c3c',
  },
  recordInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
  },
  recordInnerActive: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
  },
});
