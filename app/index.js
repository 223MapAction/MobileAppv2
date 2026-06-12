import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Mapimg1 from "../assets/mapAction1.png";
import { COLORS } from '../Composants/themeConfig';
import { getAuthUser, getOnboardingViewed, getTermsAccepted } from '../storage/authStorage';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const onboardingViewed = await getOnboardingViewed();
        const termsAccepted = await getTermsAccepted();
        const user = await getAuthUser();

        setTimeout(() => {
          if (!termsAccepted) {
            router.replace('/TermsAndConditions');
          } else if (!onboardingViewed) {
            router.replace('/OnboardingScreen');
          } else if (!user) {
            router.replace('/Authentification');
          } else {
            router.replace('/(tabs)');
          }
        }, 3500);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setTimeout(() => {
          router.replace('/TermsAndConditions');
        }, 3500);
      }
    };

    checkOnboarding();
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