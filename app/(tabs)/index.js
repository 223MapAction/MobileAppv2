import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMesIncidents } from '../../api/incidents';
import { OfflineManager } from '../../api/offlineManager'; // Gestionnaire local
import IMG_LOGIN from "../../assets/images/imageHomeLogin.png";
import IMG1 from "../../assets/scanIMG1.png";
import { COLORS } from '../../Composants/themeConfig';
import { getAuthToken, getAuthUser } from '../../storage/authStorage';

const { width, height } = Dimensions.get('window');

const STATUS_FILTERS = [
  { label: 'Tous', value: 'all' },
  { label: 'Déclarés', value: 'declared' },
  { label: 'Prise en compte', value: 'taken_into_account' },
  { label: 'Résolus', value: 'resolved' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showBanner, setShowBanner] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const initHome = async () => {
        setLoading(true);
        try {
          const [userData, tokenData] = await Promise.all([
            getAuthUser(),
            getAuthToken()
          ]);

          setUser(userData);
          const token = tokenData?.access || tokenData;

          if (userData?.id && token) {
            const result = await getMesIncidents(userData.id, token);
            if (result.ok) {
              setIncidents(result.data);
            } else {
              console.error("Erreur API:", result.error);
            }
          } else {
            const localIncidents = await OfflineManager.getAnonymousHistory();
            if (Array.isArray(localIncidents) && localIncidents.length > 0) {
              setIncidents(localIncidents);
            } else {
              setIncidents([]); 
            }
          }
        } catch (error) {
          console.error("Erreur initialisation:", error);
        } finally {
          setLoading(false);
        }
      };

      initHome();
    }, [])
  );

  const filteredIncidents = useMemo(() => {
    if (activeFilter === 'all') return incidents;
    return incidents.filter(item => item.etat === activeFilter);
  }, [incidents, activeFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'declared': return COLORS.primary;
      case 'taken_into_account': return '#f39c12';
      case 'resolved': return '#2ecc71';
      default: return COLORS.gray1;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('fr-FR');
    if (typeof dateString === 'string' && dateString.includes('/')) return dateString;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('fr-FR');
  };

  // --- MODIFICATION : Remplacement du View par un TouchableOpacity cliquable ---
  const renderIncidentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.incidentCard}
      activeOpacity={0.8}
      onPress={() => {
        router.push({
          pathname: '/DetailIncidentScreen',
          params: { 
            id: item.id || item.id_local, 
            isLocal: user ? 'false' : 'true' 
          }
        });
      }}
    >
      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.incidentImage} />
      ) : (
        <View style={[styles.incidentImage, styles.fallbackImageContainer]}>
          <Ionicons name="image-outline" size={30} color={COLORS.gray1} />
        </View>
      )}
      
      <View style={styles.incidentInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.incidentTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.etat) }]}>
            <Text style={styles.statusText}>{item.etat}</Text>
          </View>
        </View>

        <Text style={styles.incidentZone}>{item.zone || "Zone non spécifiée"}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.incidentDate}>{formatDate(item.created_at || item.date)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRegisterBanner = () => {
    if (user || !showBanner) return null; 
    
    return (
      <View style={styles.bannerContainer}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => setShowBanner(false)}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color="#7f8c8d" />
        </TouchableOpacity>

        <Image 
          source={IMG_LOGIN} 
          style={styles.bannerImage} 
          contentFit="contain" 
        />

        <Text style={styles.bannerTitle}>Envie d'en faire plus ?</Text>
        <Text style={styles.bannerDescription}>
          Rejoignez-nous en vous connectant pour rapporter autant d'incidents que nécessaire.
        </Text>

        <TouchableOpacity 
          style={styles.loginButton}
          activeOpacity={0.8}
          onPress={() => router.push('/Authentification')} 
        >
          <Text style={styles.loginButtonText}>CONNEXION</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const shouldShowList = user || incidents.length > 0;

  return (
    <View style={styles.container}>
      {shouldShowList ? (
        <View style={styles.listContainer}>
          <View style={{ height: 60 }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.filterBar}
            >
              {STATUS_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterChip, 
                    activeFilter === filter.value && styles.filterChipActive
                  ]}
                  onPress={() => setActiveFilter(filter.value)}
                >
                  <Text style={[
                    styles.filterText, 
                    activeFilter === filter.value && styles.filterTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredIncidents}
            keyExtractor={(item, index) => item.id?.toString() || item.created_at || index.toString()}
            renderItem={renderIncidentItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun incident dans cette catégorie.</Text>}
            ListFooterComponent={renderRegisterBanner} 
            contentContainerStyle={{ paddingBottom: 120 }} 
          />

          {!user && (
            <TouchableOpacity 
              style={styles.fabButton}
              activeOpacity={0.8}
              onPress={() => router.push('/scan')}
            >
              <Ionicons name="add" size={30} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <View style={styles.emptyContent}>
            <Image source={IMG1} style={styles.mainImage} contentFit="contain" />
            <Text style={styles.title}>Reporter un incident</Text>
            <Text style={styles.description}>
              Décrivez le problème rencontré{"\n"} pour une prise en compte
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.scanButton}
            activeOpacity={0.8}
            onPress={() => router.push('/scan')}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="scan-circle-outline" size={24} color={COLORS.white} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Scanner l'incident</Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: width * 0.05, paddingTop: 10 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  filterBar: { paddingVertical: 10, alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, marginRight: 10, borderWidth: 1, borderColor: '#eee' },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.gray1, fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: 'white' },
  listContainer: { flex: 1 },
  incidentCard: { flexDirection: 'row', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, marginBottom: 15, alignItems: 'flex-start', borderWidth: 1, borderColor: '#eee' },
  incidentImage: { width: 70, height: 70, borderRadius: 10 },
  fallbackImageContainer: { backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center' },
  incidentInfo: { marginLeft: 12, flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  incidentTitle: { fontSize: 15, fontWeight: '700', color: COLORS.secondary, flex: 1, marginRight: 8 },
  incidentZone: { fontSize: 13, color: COLORS.gray1, marginBottom: 8 },
  cardFooter: { alignItems: 'flex-end' },
  incidentDate: { fontSize: 11, color: COLORS.gray1, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { color: 'white', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.gray1 },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -80 },
  mainImage: { width: width * 0.8, height: height * 0.3, marginBottom: height * 0.03 },
  title: { fontSize: width * 0.055, fontWeight: '700', color: COLORS.secondary, marginBottom: 10 },
  description: { fontSize: width * 0.038, color: COLORS.gray1, textAlign: 'center' },
  scanButton: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12, width: width * 0.8, position: 'absolute', bottom: 70, left: width * 0.10, alignItems: 'center', elevation: 5 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonIcon: { marginRight: 10 },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  fabButton: { position: 'absolute', bottom: 30, right: 10, backgroundColor: COLORS.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  bannerContainer: {
    position: 'relative', 
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#f5f6fa',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, 
  },
  bannerImage: {
    width: width * 0.7,   
    height: height * 0.22, 
    marginBottom: 15,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  bannerDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});