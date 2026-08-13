import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

const MAX_DURATION_MS = 10000;

// State machine d'enregistrement audio (plafond 10s) pour les écrans de
// signalement d'incident. La courbe de niveau sonore et le nombre de barres
// affichées sont volontairement réglés différemment entre citoyen et agent
// (pur réglage visuel, pas une divergence de comportement), donc passés en
// paramètres plutôt que figés ici.
export function useAudioRecorder({
  idleLevels,
  normalizeLevel,
  maxLevelsCount,
  onLimitReached,
  startErrorMessage,
  stopErrorLogPrefix,
}) {
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [audioLevels, setAudioLevels] = useState(idleLevels);
  const recordingRef = useRef(null);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: { ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android, meteringEnabled: true },
        ios: { ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios, meteringEnabled: true },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions,
        async (status) => {
          if (status.metering !== undefined) {
            const normalizedLevel = normalizeLevel(status.metering);
            setAudioLevels((prev) => {
              const newLevels = [...prev, normalizedLevel];
              if (newLevels.length > maxLevelsCount) newLevels.shift();
              return newLevels;
            });
          }
          if (status.durationMillis >= MAX_DURATION_MS) {
            await stopRecording();
            onLimitReached?.();
          }
        },
        100
      );

      // Affectation synchrone (plutôt que via un useEffect sur `recording`,
      // qui laissait une fenêtre où recordingRef pouvait être en retard
      // d'un cycle de rendu si stopRecording était appelé juste après).
      recordingRef.current = newRecording;
      setRecording(newRecording);
    } catch (err) {
      Alert.alert('Erreur', startErrorMessage);
    }
  };

  const stopRecording = async () => {
    const activeRecording = recordingRef.current;
    if (!activeRecording) return;

    setRecording(null);
    try {
      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();
      setAudioUri(uri);
    } catch (error) {
      console.error(stopErrorLogPrefix, error);
    } finally {
      recordingRef.current = null;
      setAudioLevels(idleLevels);
    }
  };

  const deleteAudio = () => {
    setAudioUri(null);
    setAudioLevels(idleLevels);
  };

  // Arrête proprement le micro si l'écran est démonté en cours d'enregistrement.
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  return { recording, audioUri, audioLevels, startRecording, stopRecording, deleteAudio };
}
