import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../Composants/themeConfig';

// IMPORTATION DE TES SERVICES ET DE TON STORAGE
import { getAssignedIncidents } from '../../api/AgentIncidents';
import { getAuthUser } from '../../storage/authStorageAgent';

export default function AssignerScreen() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fonction principale de chargement des données
  const fetchMissions = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. On récupère la session de l'agent dans le stockage du téléphone
      const session = await getAuthUser();
      
      if (session && session.token) {
        // 2. On appelle l'API en lui fournissant le token récupéré
        const result = await getAssignedIncidents(session.token);
        
        if (result.ok) {
          setIncidents(result.data); // On met les incidents dans notre State pour l'affichage
        } else {
          Alert.alert("Erreur Serveur", result.error?.message || "Impossible de récupérer vos assignations.");
        }
      } else {
        Alert.alert("Session introuvable", "Veuillez vous reconnecter pour accéder à vos tâches.");
      }
    } catch (err) {
      console.error("Erreur lors du cycle fetchMissions :", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger automatiquement les incidents dès l'affichage de la page
  useEffect(() => {
    fetchMissions();
  }, []);

  // Design d'une carte d'incident unique
  const renderIncidentCard = ({ item }) => {
    // Formatage propre de la date limite reçue (ex: "2026-06-01T17:00:00Z")
    const expiration = new Date(item.deadline).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.incidentTitle}>{item.incident_title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'pending' ? '#FEF3C7' : '#D1FAE5' }]}>
            <Text style={[styles.statusText, { color: item.status === 'pending' ? '#D97706' : '#10B981' }]}>
              {item.status === 'pending' ? 'En attente' : 'Rapporté'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <FontAwesome name="user" size={14} color={COLORS.gray1} style={styles.iconWidthFix} />
            <Text style={styles.infoText}>Donneur d'ordre : {item.assigned_by_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#EF4444" style={styles.iconWidthFix} />
            <Text style={[styles.infoText, { color: '#EF4444', fontWeight: '600' }]}>
              Délai : {expiration}
            </Text>
          </View>
        </View>

        {/* Bouton pour déclencher l'intervention sur le terrain */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert("Intervention", `Préparation du rapport terrain pour l'incident #${item.incident}`)}
        >
          <Text style={styles.actionButtonText}>Intervenir sur le terrain</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  // Écran d'attente pendant le chargement initial
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Recherche de vos missions en cours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderIncidentCard}
        contentContainerStyle={styles.listPadding}
        // Gère le geste "tirer pour rafraîchir" la liste
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchMissions(true)} colors={[COLORS.primary]} />
        }
        // S'affiche si l'agent n'a aucun incident dans son tableau
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={70} color={COLORS.gray1} />
            <Text style={styles.emptyText}>Excellent ! Aucun incident ne vous est assigné pour le moment.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  listPadding: { padding: 15, paddingBottom: 30 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.gray1, fontSize: 14, fontWeight: '500' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  incidentTitle: { fontSize: 16, fontWeight: '700', color: COLORS.secondary, flex: 1, marginRight: 10, lineHeight: 22 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardBody: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconWidthFix: { width: 22, textAlign: 'center' },
  infoText: { fontSize: 13, color: '#4B5563' },
  actionButton: { backgroundColor: COLORS.primary, flexDirection: 'row', height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', color: COLORS.gray1, marginTop: 15, fontSize: 15, lineHeight: 22, fontWeight: '500' }
});