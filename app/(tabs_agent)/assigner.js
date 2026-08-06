import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router'; // 🔑 Ajout de useFocusEffect
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
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
  const router = useRouter();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // FILTRAGE : On ne garde que les incidents qui ne sont PAS au statut 'reported'
  const activeIncidents = useMemo(() => {
    return incidents.filter(item => item.status !== 'reported');
  }, [incidents]);

  // Mémorisation des incidents indexés par ID pour un accès instantané
  const incidentsCache = useMemo(() => {
    const cache = {};
    incidents.forEach((item) => {
      if (item.id) {
        cache[item.id] = item;
      }
    });
    return cache;
  }, [incidents]);

  // 🔑 Fonction modifiée avec gestion du mode silencieux
  const fetchMissions = async (showRefreshIndicator = false, isSilent = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else if (!isSilent) setLoading(true); // Pas de loader central si rafraîchissement en tâche de fond

    try {
      const session = await getAuthUser();
      
      if (session && session.token) {
        const result = await getAssignedIncidents(session.token);
        
        if (result && result.ok) {
          setIncidents(result.data || []);
        } else {
          Alert.alert(
            "Service momentanément indisponible", 
            "Impossible de synchroniser vos missions actuelles. Veuillez réessayer dans quelques instants."
          );
        }
      } else {
        Alert.alert(
          "Session expirée", 
          "Votre session de connexion n'est plus valide. Veuillez vous reconnecter."
        );
      }
    } catch (err) {
      console.error("Erreur critique lors du cycle fetchMissions :", err);
      Alert.alert(
        "Une erreur est survenue",
        "Un problème de connexion au serveur a été détecté. Vérifiez votre connexion Internet."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔑 Déclencheur intelligent : s'exécute à l'initialisation ET à chaque retour sur cet écran
  useFocusEffect(
    useCallback(() => {
      // Si on a déjà des données, on rafraîchit en arrière-plan (silencieusement)
      fetchMissions(false, incidents.length > 0);
    }, [])
  );

  // Design d'une carte d'incident unique
  const renderIncidentCard = ({ item }) => {
    let expiration = "Non définie";

    try {
      if (item.deadline) {
        expiration = new Date(item.deadline).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
      }
    } catch (dateError) {
      console.error("Erreur formatage date :", dateError);
    }

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          if (item && item.id) {
            const cachedItem = incidentsCache[item.id];

            router.push({
              pathname: '/DetailIncidentAssigner',
              params: { 
                id: item.id, 
                incident_title: item.incident_title || "Incident sans titre",
                fromAssignment: 'true',
                incident_detail: JSON.stringify(cachedItem?.incident_detail || {})
              }
            });
          } else {
            Alert.alert("Information", "Impossible d'ouvrir les détails : Identifiant de mission manquant.");
          }
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.incidentTitle}>{item.incident_title || "Incident sans titre"}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'pending' ? '#FEF3C7' : '#D1FAE5' }]}>
            <Text style={[styles.statusText, { color: item.status === 'pending' ? '#D97706' : '#10B981' }]}>
              {item.status === 'pending' ? 'En attente' : 'Rapporté'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <FontAwesome name="user" size={14} color={COLORS.gray1} style={styles.iconWidthFix} />
            <Text style={styles.infoText}>Donneur d'ordre : {item.assigned_by_name || "Non spécifié"}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#EF4444" style={styles.iconWidthFix} />
            <Text style={[styles.infoText, { color: '#EF4444', fontWeight: '600' }]}>
              Délai : {expiration}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>Voir plus de détails (Photo, Audio, État...)</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && incidents.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Recherche de vos missions en cours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.uxHeader}>
        <View>
          <Text style={styles.uxHeaderTitle}>Missions Terrain</Text>
          <Text style={styles.uxHeaderSubtitle}>Vos interventions en attente</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.historyCircleBtn}
          onPress={() => router.push('/HistoriqueReportsScreen')} 
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="clipboard-text-clock-outline" size={22} color={COLORS.primary} />
          <Text style={styles.historyBtnLabel}>Mes Rapports</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeIncidents} 
        keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
        renderItem={renderIncidentCard}
        contentContainerStyle={styles.listPadding}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => fetchMissions(true)} 
            colors={[COLORS.primary]} 
          />
        }
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
  uxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.gray200,
  },
  uxHeaderTitle: { fontSize: 20, fontWeight: '800', color: COLORS.secondary },
  uxHeaderSubtitle: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  historyCircleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  historyBtnLabel: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  listPadding: { padding: 15, paddingBottom: 30 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.gray1, fontSize: 14, fontWeight: '500' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  incidentTitle: { fontSize: 16, fontWeight: '700', color: COLORS.secondary, flex: 1, marginRight: 10, lineHeight: 22 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardBody: { paddingBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconWidthFix: { width: 22, textAlign: 'center' },
  infoText: { fontSize: 13, color: COLORS.gray600 },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: COLORS.gray100,
    paddingTop: 12, 
    marginTop: 8 
  },
  footerText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', color: COLORS.gray1, marginTop: 15, fontSize: 15, lineHeight: 22, fontWeight: '500' }
});