import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../Composants/themeConfig';
import { setOnboardingViewed } from '../storage/authStorage';

const { width, height } = Dimensions.get('window');

const DATA = [
  {
    id: '1',
    title: 'Repérez les incidents\nautour de vous',
    description: 'Déchets, pollution, eaux usées...\nsignalez ce que vous observez.',
    image: require('../assets/onboarding1.png'), 
  },
  {
    id: '2',
    title: 'Prenez une photo\nde l’incident',
    description: 'Capturez le problème en quelques secondes.\nLe lieu est enregistré automatiquement.',
    image: require('../assets/onboarding2.png'), 
  },
  {
    id: '3',
    title: 'Suivez l’impact\nde vos signalements',
    description: 'Chaque signalement citoyen peut faire\nla différence. Suivez l’évolution de vos\nincidents et voyez leur impact.',
    image: require('../assets/onboarding3.png'), 
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const router = useRouter();

  const viewConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50
  }), []);

  const viewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const handleFinishOnboarding = async () => {
    await setOnboardingViewed(); 
    router.replace('/Authentification'); 
  };

  const handleNext = () => {
    if (currentIndex < DATA.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinishOnboarding();
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo d'en tête */}
      <View style={styles.logoContainer}>
         <Image source={require('../assets/LogoMapAction.png')} style={styles.topLogo} resizeMode="contain" />
      </View>

      {/* Liste coulissante des cartes */}
      <FlatList
        data={DATA}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item.image} style={styles.illustration} resizeMode="contain" />
            <Text style={styles.title}>
              {item.title.split('\n')[0]}
              {item.title.split('\n')[1] && <Text style={styles.titleBlue}>{'\n'}{item.title.split('\n')[1]}</Text>}
            </Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      {/* Zone de Contrôles Fixes (Bas) */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {DATA.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 8, 8], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return (
              <Animated.View 
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: currentIndex === i ? '#2596D7' : '#D9D9D9' }]} 
                key={i.toString()} 
              />
            );
          })}
        </View>

        {/* Bouton Suivant / Commencer */}
        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {currentIndex === DATA.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
          {currentIndex !== DATA.length - 1 && (
            <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>

        {/* Bouton Passer */}
        <TouchableOpacity style={styles.skipButton} onPress={handleFinishOnboarding}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  logoContainer: { alignItems: 'center', marginTop: height * 0.05, height: 40 },
  topLogo: { width: 120, height: '100%' },
  slide: { width: width, alignItems: 'center', paddingHorizontal: 30, paddingTop: 10 },
  // Légère réduction de l'illustration sur les petits écrans si nécessaire pour laisser respirer le bas
  illustration: { width: width * 0.85, height: height * 0.40, borderRadius: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#1B254B', textAlign: 'center', marginTop: 20, lineHeight: 34 },
  titleBlue: { color: COLORS.primary },
  description: { fontSize: 15, color: COLORS.gray1, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  
  // CORRECTION ICI : Remplacement du height * 0.04 par une marge fixe plus haute sur Android
  footer: { 
    paddingHorizontal: 30, 
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 60 : 20 
  },
  
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 5 },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  // Ajustement de la marge haute du bouton passer pour équilibrer la remontée
  skipButton: { alignItems: 'center', marginTop: 15, paddingVertical: 8 },
  skipText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});