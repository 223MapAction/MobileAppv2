import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IMG1 from "../assets/scanIMG1.png";
import { COLORS } from '../Composants/themeConfig';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={IMG1} 
        style={styles.mainImage} 
        contentFit="contain" 
      />

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Reporter un incident</Text>
        
        <Text style={styles.description}>Décrivez le problème rencontré pour une{"\n"} prise en compte</Text>

        <TouchableOpacity 
          style={styles.scanButton}
          activeOpacity={0.8}
          // onPress={() => console.log("Lancement du scan...")}
        >
        <View style={styles.buttonContent}>
            <Ionicons name="scan-outline" size={24} color={COLORS.white} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Scanner l'incident</Text>
        </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: COLORS.gray2,
    paddingHorizontal: width * 0.05, 
  },
  mainImage: {
    width: width * 0.8,
    height: height * 0.3,
    marginBottom: height * 0.03, 
  },
  contentContainer: {
    alignItems: 'center', 
    width: '100%',
  },
  title: {
    fontSize: width * 0.055,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: height * 0.015,
  },
  description: {
    fontSize: width * 0.038,
    color: COLORS.gray1,
    textAlign: 'center', 
    marginBottom: height * 0.04, 
    lineHeight: width * 0.055,
  },
 scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: height * 0.018,
    borderRadius: 12,
    width: width * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonContent: {
    flexDirection: 'row', // Aligne icône et texte sur la même ligne
    alignItems: 'center', // Centre verticalement l'icône et le texte
  },
  buttonIcon: {
    marginRight: 10, // Espace entre l'icône et le texte
  },
  buttonText: {
    color: COLORS.white,
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
});