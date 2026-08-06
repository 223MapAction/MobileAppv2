import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchNotifications } from '../api/notificationCitizen';
import { COLORS } from '../Composants/themeConfig';
import ScreenHeader from '../Composants/ScreenHeader';

export default function NotificationsCitizenScreen() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await fetchNotifications();
      if (data) {
        const list = Array.isArray(data) ? data : (data.results || []);
        setNotifications([...list].reverse());
      }
    } catch (error) {
      // Échec silencieux en production
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotifications(false);
  };

  const renderNotificationItem = ({ item }) => {
    const itemDate = item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        <View style={[styles.iconContainer, { backgroundColor: item.is_read ? '#F5F5F5' : COLORS.primary + '15' }]}>
          <Ionicons 
            name={item.is_read ? "mail-open-outline" : "mail-unread-outline"} 
            size={22} 
            color={item.is_read ? COLORS.gray1 : COLORS.primary} 
          />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRowCard}>
            <Text style={[styles.title, !item.is_read && styles.unreadText]} numberOfLines={1}>
              {item.title || "Mise à jour d'incident"}
            </Text>
            <Text style={styles.date}>{itemDate}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {item.message || item.description || "Aucun détail fourni."}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Mes notifications" />

      {/* Liste des notifications */}
      <FlatList
        data={notifications}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            colors={[COLORS.primary]} 
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={COLORS.gray1} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
              Vous serez notifié dès qu'il y aura du nouveau sur vos incidents.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  scrollContent: { 
    padding: 20,
    flexGrow: 1,
  },
  
  // Design des cartes de notifications
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 2,
  },
  headerRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333', // Forcé en couleur foncée visible
    maxWidth: '75%',
  },
  unreadText: {
    fontWeight: '700',
    color: '#000000', // Plus sombre si non lu
  },
  date: {
    fontSize: 11,
    color: COLORS.gray1 || '#888',
    fontWeight: '500',
  },
  message: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  
  // État vide
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});