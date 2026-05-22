import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Inclus dans Expo
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import mapActionLogo from "../../assets/LogoMapAction.png";
import { COLORS } from '../../Composants/themeConfig';

export default function TabLayout() {
  // État pour savoir si l'utilisateur est en ligne ou pas
  const [isOnline, setIsOnline] = useState(true);

  // Fonction pour basculer le statut en ligne / hors ligne
  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    console.log("Statut agent modifié. En ligne :", !isOnline);
  };

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
            
            {/* BADGE TEXTUEL STATUT EN LIGNE / HORS LIGNE */}
            <TouchableOpacity 
              style={[
                styles.statusBadge, 
                { backgroundColor: isOnline ? '#D1FAE5' : '#FEE2E2' } // Fond Vert clair ou Rouge clair
              ]} 
              onPress={toggleOnlineStatus}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.statusText, 
                { color: isOnline ? '#10B981' : '#EF4444' } // Texte Vert ou Rouge
              ]}>
                {isOnline ? "En ligne" : "Hors ligne"}
              </Text>
            </TouchableOpacity>

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
          title: 'Incident Assigner',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="presentation" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Incident Signaler',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="navigation-outline" size={24} color={color} />,
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12, // Bords bien arrondis style pilule
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});