import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { COLORS } from './Composants/themeConfig';
import Mapimg1 from "./assets/mapAction1.png";

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <MotiView
        from={{ 
          opacity: 0, 
          scale: 0.3,
          translateY: 50 
        }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          translateY: 0 
        }}
        transition={{ 
          type: 'spring', 
          duration: 1500,
          damping: 12 
        }}
      >
        <Image 
          source={Mapimg1} 
          style={styles.logo} 
          contentFit="contain" 
        />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary, 
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6, 
  },
});