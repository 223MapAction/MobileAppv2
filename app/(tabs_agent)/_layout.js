import { Ionicons } from '@expo/vector-icons'; // Inclus dans Expo
import { useFocusEffect } from '@react-navigation/native';
import { Tabs, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchNotifications } from '../../api/notificationCitizen';
import mapActionLogo from "../../assets/LogoMapAction.png";
import { COLORS } from '../../Composants/themeConfig';
import { getActiveAccessToken } from '../../hooks/usePushNotifications';
import { getUnreadCount, setUnreadCount as setSharedUnreadCount, subscribeUnreadCount } from '../../services/notificationBadge';

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(getUnreadCount());
  const router = useRouter();

  // Reflète immédiatement la mise à jour optimiste faite par
  // notificationsCitizenScrenn.js (marquage lu à la vue de la liste) sans
  // attendre le prochain fetch ci-dessous, qui peut arriver avant que les
  // PATCH is_read envoyés en arrière-plan n'aient atteint le serveur.
  useEffect(() => subscribeUnreadCount(setUnreadCount), []);

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
            setSharedUnreadCount(count);
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
        // Groupement des éléments à droite (Texte Statut + Notification)
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            {/* BOUTON NOTIFICATION */}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/notificationsCitizenScrenn')}
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

          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="assigner"
        options={{
          title: 'Incidents Assignés',
          tabBarIcon: ({ color }) => <Ionicons name="person-add-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Incidents Signalés',
          tabBarIcon: ({ color }) => <Ionicons name="warning" size={24} color={color} />,
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
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    gap: 10, // Espace équilibré entre le texte et la cloche
  },
  headerButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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