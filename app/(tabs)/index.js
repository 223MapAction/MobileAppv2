import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMesIncidents } from '../../api/incidents';
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

  useEffect(() => {
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
        }
      } catch (error) {
        console.error("Erreur initialisation:", error);
      } finally {
        setLoading(false);
      }
    };
    initHome();
  }, []);

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

  // Fonction pour formater la date si disponible
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const renderIncidentItem = ({ item }) => (
    <View style={styles.incidentCard}>
      <Image source={{ uri: item.photo }} style={styles.incidentImage} />
      
      <View style={styles.incidentInfo}>
        {/* Ligne du Haut : Titre et Statut */}
        <View style={styles.cardHeader}>
          <Text style={styles.incidentTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.etat) }]}>
            <Text style={styles.statusText}>{item.etat}</Text>
          </View>
        </View>

        {/* Ligne du Milieu : Zone (sous le titre) */}
        <Text style={styles.incidentZone}>{item.zone || "Zone non spécifiée"}</Text>

        {/* Ligne du Bas : Date en bas à droite */}
        <View style={styles.cardFooter}>
          <Text style={styles.incidentDate}>{formatDate(item.created_at || item.date)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.container}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {user ? (
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
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderIncidentItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun incident dans cette catégorie.</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
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
              <Ionicons name="scan-outline" size={24} color={COLORS.white} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Scanner l'incident</Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: width * 0.05, 
    paddingTop: 10 
  },
  filterBar: { 
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: COLORS.white, 
    marginRight: 10, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  filterChipActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary 
  },
  filterText: { 
    color: COLORS.gray1, 
    fontWeight: '600', 
    fontSize: 13 
  },
  filterTextActive: { 
    color: 'white' 
  },
  listContainer: { flex: 1 },

  // --- NOUVEAUX STYLES POUR L'ITEM ---
  incidentCard: { 
    flexDirection: 'row', 
    backgroundColor: '#f8f9fa', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 15, 
    alignItems: 'flex-start', // Changé de center à flex-start pour mieux aligner le contenu textuel
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  incidentImage: { width: 70, height: 70, borderRadius: 10 },
  incidentInfo: { marginLeft: 12, flex: 1 },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  incidentTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: COLORS.secondary,
    flex: 1, // Pour éviter que le titre n'écrase le badge
    marginRight: 8
  },
  incidentZone: {
    fontSize: 13,
    color: COLORS.gray1,
    marginBottom: 8
  },
  cardFooter: {
    alignItems: 'flex-end', // Aligne la date à droite
  },
  incidentDate: {
    fontSize: 11,
    color: COLORS.gray1,
    fontStyle: 'italic'
  },
  // ---------------------------------

  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6, 
  },
  statusText: { 
    color: 'white', 
    fontSize: 9, 
    fontWeight: 'bold', 
    textTransform: 'uppercase' 
  },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.gray1 },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center',marginTop: -80, },
  mainImage: { width: width * 0.8, height: height * 0.3, marginBottom: height * 0.03 },
  title: { fontSize: width * 0.055, fontWeight: '700', color: COLORS.secondary, marginBottom: 10 },
  description: { fontSize: width * 0.038, color: COLORS.gray1, textAlign: 'center' },
  scanButton: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12, width: width * 0.8, position: 'absolute', bottom: 70, left: width * 0.10, alignItems: 'center', elevation: 5 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonIcon: { marginRight: 10 },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});