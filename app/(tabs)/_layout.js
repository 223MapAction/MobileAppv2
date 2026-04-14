import { Ionicons } from '@expo/vector-icons'; // Inclus dans Expo
import { Tabs } from 'expo-router';
import { Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../Composants/themeConfig';
import mapActionLogo from "../assets/LogoMapAction.png";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        headerShadowVisible: false,
        headerTitle: () => (
          <Image 
            source={mapActionLogo} 
            style={{ width: 100, height: 40, }} 
            resizeMode="contain" 
          />
        ),
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 15 }}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
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
          title: 'Scan',
          tabBarIcon: ({ color }) => <Ionicons name="scan-outline" size={24} color={color} />,
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