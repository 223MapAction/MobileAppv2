import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from './themeConfig';

// Lecture d'une note vocale jointe à un incident (citoyen ou agent).
// Reprend la logique déjà éprouvée dans l'ancien
// DetailIncidentAssigner.js (Audio.Sound, play/pause, nettoyage au
// démontage), désormais partagée entre les 3 écrans de détail.
export default function AudioPlayer({ uri }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const togglePlayback = async () => {
    if (!uri) return;
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

      setIsLoading(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      setIsLoading(false);
      console.error('Erreur de lecture audio :', error);
      Alert.alert('Échec', "La note vocale n'a pas pu être lue.");
    }
  };

  if (!uri) return null;

  return (
    <TouchableOpacity
      style={[styles.container, isPlaying && styles.containerActive]}
      onPress={togglePlayback}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={44} color={COLORS.primary} />
      )}
      <View style={styles.info}>
        <Text style={styles.title}>
          {isPlaying ? 'Lecture en cours...' : 'Note vocale'}
        </Text>
        <Text style={styles.subtitle}>
          {isPlaying ? 'Appuyer pour mettre en pause' : 'Appuyer pour écouter'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  containerActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#DBEAFE',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  subtitle: {
    fontSize: 12,
    color: '#1E40AF',
    opacity: 0.8,
    marginTop: 2,
  },
});
