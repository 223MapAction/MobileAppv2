import { Ionicons } from '@expo/vector-icons'; // Inclus dans Expo
import { Tabs } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import mapActionLogo from "../../assets/LogoMapAction.png";
import { COLORS } from '../../Composants/themeConfig';

export default function TabLayout() {
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
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
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
  },
});