import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

// Lecture d'une vidéo jointe à un incident (citoyen ou agent). Affiche une
// miniature (photo de l'incident si disponible) avec un bouton lecture par
// dessus ; au tap, remplace la miniature par un lecteur vidéo natif avec
// contrôles. N'existait dans aucun des 3 écrans de détail auparavant.
export default function VideoPlayer({ uri, posterUri }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!uri) return null;

  if (isPlaying) {
    return (
      <View style={styles.container}>
        <Video
          source={{ uri }}
          style={styles.media}
          useNativeControls
          resizeMode={ResizeMode.COVER}
          shouldPlay
        />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={() => setIsPlaying(true)} activeOpacity={0.9}>
      {posterUri ? (
        <Image source={{ uri: posterUri }} style={styles.media} />
      ) : (
        <View style={[styles.media, styles.fallback]}>
          <Ionicons name="videocam-outline" size={40} color="white" />
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.playCircle}>
          <Ionicons name="play" size={28} color="black" style={{ marginLeft: 3 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 4,
    backgroundColor: '#000',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
