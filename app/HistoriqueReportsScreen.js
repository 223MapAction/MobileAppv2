import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getAgentReports } from '../api/AgentReports'; // Ajuste le chemin selon ton projet
import { COLORS } from '../Composants/themeConfig';
import { getAuthUser } from '../storage/authStorageAgent';

export default function HistoriqueReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Charger les rapports au démarrage
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const session = await getAuthUser();
      if (!session || !session.token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const response = await getAgentReports(session.token);
      if (response.ok) {
        // CORRECTION 1 : Extraction sécurisée du tableau depuis "results" ou la racine
        let rawData = response.data;
        let reportsArray = [];

        if (rawData && rawData.results && Array.isArray(rawData.results)) {
          reportsArray = rawData.results;
        } else if (Array.isArray(rawData)) {
          reportsArray = rawData;
        } else if (rawData) {
          reportsArray = [rawData];
        }

        setReports(reportsArray);
        setError(null);
      } else {
        setError(response.error?.detail || "Impossible de récupérer vos rapports.");
      }
    } catch (err) {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  // Rendu d'une carte de rapport
  const renderReportItem = ({ item }) => {
    // Formatage de la date si disponible
    const dateCreation = item.created_at 
      ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : "Date inconnue";

    // CORRECTION 2 : Alignement avec les clés réelles de l'API (location_lat / location_lon)
    const latitude = item.location_lat || item.lat || 0;
    const longitude = item.location_lon || item.lon || 0;

    return (
      <View style={styles.reportCard}>
        {/* En-tête du rapport */}
        <View style={styles.cardHeader}>
          <View style={styles.incidentInfo}>
            {/* CORRECTION 3 : Affichage du titre réel de l'incident et de la zone s'ils existent */}
            <Text style={styles.incidentIdText}>
              {item.incident_title || `Incident #${item.id?.substring(0, 8) || "N/A"}`}
            </Text>
            {item.incident_zone ? (
              <Text style={styles.zoneText}>Zone : {item.incident_zone}</Text>
            ) : null}
            <Text style={styles.dateText}>{dateCreation}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Transmis</Text>
          </View>
        </View>

        {/* Contenu textuel */}
        <Text style={styles.notesText} numberOfLines={3}>
          {item.notes || "Aucune observation rédigée (Visite effectuée)."}
        </Text>

        {/* Section coordonnées GPS & Média */}
        <View style={styles.cardFooter}>
          <View style={styles.geoRow}>
            <Ionicons name="location-sharp" size={14} color="#059669" />
            <Text style={styles.geoText}>
              Lat: {parseFloat(latitude).toFixed(4)} | Lon: {parseFloat(longitude).toFixed(4)}
            </Text>
          </View>

          {item.photoUri || item.photo ? (
            <View style={styles.photoAttachedBadge}>
              <Ionicons name="image" size={12} color={COLORS.primary} />
              <Text style={styles.photoAttachedText}>Photo jointe</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Récupération de vos rapports officiels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER DE LA PAGE AVEC BOUTON RETOUR INTEGRÉ */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace('/(tabs_agent)/assigner')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gray800} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Mes Rapports Envoyés</Text>
          <Text style={styles.headerSubtitle}>{reports.length} rapport(s) enregistré(s)</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchReports}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={60} color={COLORS.gray400} />
              <Text style={styles.emptyTitle}>Aucun rapport envoyé</Text>
              <Text style={styles.emptySub}>Vos rapports validés sur le terrain s'afficheront ici.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: COLORS.gray500, fontSize: 14, fontWeight: '500' },
  errorText: { color: '#EF4444', fontWeight: '600', fontSize: 14, marginTop: 10, textAlign: 'center' },
  retryBtn: { marginTop: 15, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#EFF6FF', borderRadius: 10 },
  retryBtnText: { color: COLORS.primary, fontWeight: '700' },

  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.gray200,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
    borderRadius: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.gray800 },
  headerSubtitle: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },

  listContainer: { padding: 16, paddingBottom: 30 },
  
  reportCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.03, 
    shadowRadius: 3 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  incidentIdText: { fontSize: 15, fontWeight: '700', color: COLORS.gray800, flex: 1, marginRight: 8 },
  zoneText: { fontSize: 12, color: COLORS.gray600, fontWeight: '600', marginTop: 2 },
  dateText: { fontSize: 12, color: COLORS.gray400, marginTop: 4 },
  statusBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#065F46', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  
  notesText: { fontSize: 14, color: COLORS.gray600, lineHeight: 20, marginBottom: 14 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 12 },
  geoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  geoText: { fontSize: 12, color: COLORS.gray600, fontFamily: 'monospace' },
  
  photoAttachedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  photoAttachedText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray700, marginTop: 12 },
  emptySub: { fontSize: 13, color: COLORS.gray500, textAlign: 'center', marginTop: 4, paddingHorizontal: 30 }
});