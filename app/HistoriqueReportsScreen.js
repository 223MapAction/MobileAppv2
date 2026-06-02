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
        // On trie du plus récent au plus ancien si le backend ne le fait pas
        const sortedData = Array.isArray(response.data) ? response.data : [response.data];
        setReports(sortedData);
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

    return (
      <View style={styles.reportCard}>
        {/* En-tête du rapport */}
        <View style={styles.cardHeader}>
          <View style={styles.incidentInfo}>
            <Text style={styles.incidentIdText}>Incident #{item.id || item.incidentId || "N/A"}</Text>
            <Text style={styles.dateText}>{dateCreation}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Transmis</Text>
          </View>
        </View>

        {/* Contenu textuel */}
        <Text style={styles.notesText} numberOfLines={3}>
          {item.notes || "Aucune observation rédigée."}
        </Text>

        {/* Section coordonnées GPS & Média */}
        <View style={styles.cardFooter}>
          <View style={styles.geoRow}>
            <Ionicons name="location-sharp" size={14} color="#059669" />
            <Text style={styles.geoText}>
              Lat: {parseFloat(item.lat || 0).toFixed(4)} | Lon: {parseFloat(item.lon || 0).toFixed(4)}
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
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
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
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={60} color="#9CA3AF" />
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14, fontWeight: '500' },
  errorText: { color: '#EF4444', fontWeight: '600', fontSize: 14, marginTop: 10, textAlign: 'center' },
  retryBtn: { marginTop: 15, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#EFF6FF', borderRadius: 10 },
  retryBtnText: { color: COLORS.primary, fontWeight: '700' },

  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  listContainer: { padding: 16, paddingBottom: 30 },
  
  reportCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.03, 
    shadowRadius: 3 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  incidentIdText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  dateText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#065F46', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  
  notesText: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 14 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  geoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  geoText: { fontSize: 12, color: '#4B5563', fontFamily: 'monospace' },
  
  photoAttachedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  photoAttachedText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, paddingHorizontal: 30 }
});