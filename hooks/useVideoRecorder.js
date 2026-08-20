import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

const DEFAULT_MAX_DURATION = 10;

// Enregistrement vidéo in-app (plafond configurable, 10s par défaut) pour les
// écrans de signalement d'incident. Remplace l'ancien flux basé sur
// ImagePicker.launchCameraAsync (caméra native de l'OS) : `videoMaxDuration`
// n'y était qu'une suggestion souvent ignorée par l'appli caméra du
// téléphone, d'où le rejet après-coup des vidéos trop longues. Ici c'est
// notre propre CameraView qui pilote l'enregistrement via
// recordAsync({ maxDuration }), donc la coupure à 10s est garantie côté app
// — même principe que useAudioRecorder. codec: 'avc1' (H.264) verrouille un
// format largement compatible plutôt que de dépendre d'un défaut implicite.
export function useVideoRecorder({ maxDuration = DEFAULT_MAX_DURATION } = {}) {
  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [videoUri, setVideoUri] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    setIsRecording(true);
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => (prev >= maxDuration ? prev : prev + 1));
    }, 1000);

    try {
      const result = await cameraRef.current.recordAsync({ maxDuration, codec: 'avc1' });
      if (result?.uri) {
        // Génère la vignette avant de publier l'état, pour que uri et
        // thumbnail arrivent ensemble au même rendu (le parent s'en sert
        // pour valider la vidéo automatiquement dès qu'elle est prête).
        let thumbUri = null;
        try {
          const thumb = await VideoThumbnails.getThumbnailAsync(result.uri, { time: 1000 });
          thumbUri = thumb.uri;
        } catch (e) {
          thumbUri = null;
        }
        setVideoThumbnail(thumbUri);
        setVideoUri(result.uri);
      }
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'enregistrer la vidéo.");
    } finally {
      clearInterval(timerRef.current);
      setIsRecording(false);
      setElapsedSeconds(0);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const reset = () => {
    setVideoUri(null);
    setVideoThumbnail(null);
  };

  return {
    cameraRef,
    isRecording,
    elapsedSeconds,
    videoUri,
    videoThumbnail,
    maxDuration,
    startRecording,
    stopRecording,
    reset,
  };
}
