import { Ionicons } from '@expo/vector-icons'; // Inclus dans Expo
import { useFocusEffect } from '@react-navigation/native';
import { Tabs, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
// CORRECTION : Ajout de Text dans les imports de react-native
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchNotifications } from '../../api/notificationCitizen';
import mapActionLogo from "../../assets/LogoMapAction.png";
import { COLORS } from '../../Composants/themeConfig';
import { getActiveAccessToken } from '../../hooks/usePushNotifications';

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  // useFocusEffect (pas un simple useEffect) : la cloche doit se
  // resynchroniser à chaque retour sur cet onglet, notamment après avoir lu
  // des notifications dans l'écran dédié (voir notificationsCitizenScrenn.js).
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadNotifications = async () => {
        try {
          const token = await getActiveAccessToken();
          const data = await fetchNotifications(token);
          if (isMounted && data) {
            const list = Array.isArray(data) ? data : (data.results || []);
            const count = list.filter((n) => !n.is_read).length;
            setUnreadCount(count);
          }
        } catch (error) {
          // Échec silencieux pour la production
        }
      };

      loadNotifications();
      return () => { isMounted = false; };
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        headerShadowVisible: false,
        headerTitle: () => (
          <Image 
            source={mapActionLogo} 
            style={{ width: 100, height: 40 }} 
            resizeMode="contain" 
          />
        ),
        headerRight: () => (
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={() => router.push('/notificationsCitizenScrenn')} // Vérifie bien l'orthographe de ton fichier de page ici
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Signaler',
          tabBarIcon: ({ color }) => <Ionicons name="scan-circle-outline" size={24} color={color} />,
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  notificationButton: {
    marginRight: 15,
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    right: 1,
    top: 1,
    backgroundColor: '#FF3B30', 
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});