import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMesIncidents } from '../../api/incidents';
import { OfflineManagerAgent } from '../../api/OfflineManagerAgent'; // Stockage offline dédié à l'agent
import IMG1 from "../../assets/scanIMG1.png"; // Image d'illustration si aucun incident
import { COLORS } from '../../Composants/themeConfig';
import { getAuthToken, getAuthUser } from '../../storage/authStorageAgent'; // Ciblage de l'authentification de l'agent

const { width, height } = Dimensions.get('window');

const STATUS_FILTERS = [
  { label: 'Tous', value: 'all' },
  { label: 'Déclarés', value: 'declared' },
  { label: 'Prise en compte', value: 'taken_into_account' },
  { label: 'Résolus', value: 'resolved' },
];

const STATUS_LABELS = {
  'declared': 'Déclaré',
  'taken_into_account': 'Pris en compte',
  'resolved': 'Résolu',
};

export default function AgentHomeScreen() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      const initAgentHome = async () => {
        setLoading(true);
        console.log("\n====== [DEBUG ACCUEIL AGENT] DÉBUT DE L'INITIALISATION ======");
        try {
          const [agentData, tokenData] = await Promise.all([
            getAuthUser().catch(e => { console.error(e); return null; }),
            getAuthToken().catch(e => { console.error(e); return null; })
          ]);

          setAgent(agentData);
          const token = tokenData;

          // Extraction sécurisée de l'ID de l'agent
          const agentId = agentData?.id || agentData?.user_id || agentData?.user?.id || null;
          console.log("=== [DEBUG DATA] Extraited AgentId :", agentId, "| Token présent :", !!token);

          if (agentId && token) {
            const result = await getMesIncidents(agentId, token);

            console.log("=== [DEBUG DATA] structure complète de result :", JSON.stringify(result));

            if (result && result.ok) {
              let localPending = [];
              try {
                localPending = await OfflineManagerAgent.getPendingIncidents() || [];
              } catch (storageErr) {
                console.error("Erreur récupération incidents locaux :", storageErr);
              }
              
              // Vérifie ici si le premier élément possède bien la propriété 'etat'
              if (result.data && result.data.length > 0) {
                console.log("=== [DEBUG DATA] Clés du premier incident de result.data :", Object.keys(result.data[0]));
              } else if (result.data && typeof result.data === 'object') {
                console.log("=== [DEBUG DATA] Clés de l'objet result.data :", Object.keys(result.data));
              }

              // Ajuste cette ligne selon ce que te crache le console.log du dessus !
              const apiIncidents = Array.isArray(result.data) 
                ? result.data 
                : (result.data?.incidents || result.data?.results || result.data?.data || []); // Ajout de filtres de secours courants

              console.log("=== [DEBUG DATA] Nombre d'incidents API extraits :", apiIncidents.length);
              console.log("=== [DEBUG DATA] Nombre d'incidents locaux (Offline) :", localPending.length);

              const fusionData = [...localPending, ...apiIncidents];
              setIncidents(fusionData);
            } else {
              console.warn("-> [DEBUG ACCUEIL AGENT] Échec API (result.ok est false). Bascule locale forcée.");
              await loadOnlyLocalData();
            }
          } else {
            console.warn("-> [DEBUG ACCUEIL AGENT] ID ou Token manquant.");
            await loadOnlyLocalData();
          }
        } catch (error) {
          console.error("❌ [DEBUG ACCUEIL AGENT] CRASH INITIALISATION :", error);
          Alert.alert(
            "Erreur de synchronisation",
            "Impossible d'actualiser l'ensemble de vos données. Affichage du mode hors-ligne."
          );
          await loadOnlyLocalData();
        } finally {
          setLoading(false);
          console.log("====== [DEBUG ACCUEIL AGENT] FIN DE L'INITIALISATION ======\n");
        }
      };

      const loadOnlyLocalData = async () => {
        try {
          const localPending = await OfflineManagerAgent.getPendingIncidents();
          setIncidents(localPending || []);
        } catch (err) {
          console.error("Erreur critique stockage local :", err);
          setIncidents([]);
        }
      };

      initAgentHome();
    }, [])
  );

  // Filtrage local sécurisé selon l'onglet actif
  const filteredIncidents = useMemo(() => {
    if (!incidents || !Array.isArray(incidents)) return [];
    if (activeFilter === 'all') return incidents;
    
    // Log temporaire pour vérifier si le filtrage bloque
    console.log(`=== [DEBUG FILTRE] Filtrage actif : "${activeFilter}" | Total incidents avant filtre : ${incidents.length}`);
    
    return incidents.filter(item => {
      // Gère à la fois la clé 'etat' ou 'status' si ton API utilise l'anglais
      const currentEtat = item?.etat || item?.status; 
      return item && currentEtat === activeFilter;
    });
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
    try {
      if (!dateString) return new Date().toLocaleDateString('fr-FR');
      if (typeof dateString === 'string' && dateString.includes('/')) return dateString;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('fr-FR');
    } catch (e) {
      return "Date non spécifiée";
    }
  };

  const renderIncidentItem = ({ item }) => {
    if (!item) return null;

    const currentEtat = item.etat || item.status || "declared";

    return (
      <TouchableOpacity 
        style={[styles.incidentCard, item.isOffline && styles.incidentCardOffline]}
        activeOpacity={0.8}
        onPress={() => {
          const targetId = item.id || item.id_local;
          if (targetId) {
            router.push({
              pathname: '/DetailIncidentAgentScreen',
              params: { id: targetId, isLocal: item.isOffline ? 'true' : 'false' }
            });
          } else {
            Alert.alert("Information", "Impossible d'ouvrir l'incident : Identifiant introuvable.");
          }
        }}
      >
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.incidentImage} cachePolicy="disk" />
        ) : (
          <View style={[styles.incidentImage, styles.fallbackImageContainer]}>
            <Ionicons name="image-outline" size={30} color={COLORS.gray1} />
          </View>
        )}
        
        <View style={styles.incidentInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.incidentTitle} numberOfLines={1}>
              {item.title || item.titre || "Sans titre"}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentEtat) }]}>
              <Text style={styles.statusText}>
                {item.isOffline 
                  ? "EN ATTENTE" 
                  : (STATUS_LABELS[currentEtat] || currentEtat || "Inconnu")}
              </Text>
            </View>
          </View>

          <Text style={styles.incidentZone}>{item.zone || "Zone non spécifiée"}</Text>

          <View style={styles.cardFooter}>
            {item.isOffline && (
              <View style={styles.offlineRow}>
                <Ionicons name="cloud-offline-outline" size={14} color="#e74c3c" style={{ marginRight: 4 }} />
                <Text style={styles.offlineText}>Hors-ligne</Text>
              </View>
            )}
            <Text style={styles.incidentDate}>{formatDate(item.created_at || item.date)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {incidents && incidents.length > 0 ? (
        <View style={styles.listContainer}>
          <View style={{ height: 60 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
              {STATUS_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[styles.filterChip, activeFilter === filter.value && styles.filterChipActive]}
                  onPress={() => setActiveFilter(filter.value)}
                >
                  <Text style={[styles.filterText, activeFilter === filter.value && styles.filterTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredIncidents}
            keyExtractor={(item, index) => item?.id?.toString() || item?.id_local || index.toString()}
            renderItem={renderIncidentItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyFilterContainer}>
                <Ionicons name="filter-outline" size={45} color={COLORS.gray1} style={{ marginBottom: 10 }} />
                <Text style={styles.emptyText}>Aucun incident trouvé pour ce statut.</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }} 
          />

          <TouchableOpacity style={styles.fabButton} activeOpacity={0.8} onPress={() => router.push('/scanAgent')}>
            <Ionicons name="add" size={30} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyContent}>
            <Image source={IMG1} style={styles.mainImage} contentFit="contain" />
            <Text style={styles.title}>Aucun incident pour le moment</Text>
            <Text style={styles.description}>
              Vous n'avez pas encore déclaré d'incident sur le terrain ou synchronisé de données locales.
            </Text>
          </View>

          <TouchableOpacity style={styles.scanButton} activeOpacity={0.8} onPress={() => router.push('/scanAgent')}>
            <View style={styles.buttonContent}>
              <Ionicons name="camera-outline" size={24} color={COLORS.white} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Photographier l’incident</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50, paddingHorizontal: width * 0.05, paddingTop: 10 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  filterBar: { paddingVertical: 10, alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, marginRight: 10, borderWidth: 1, borderColor: '#eee' },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.gray1, fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: 'white' },
  listContainer: { flex: 1 },
  incidentCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 15, alignItems: 'flex-start', borderWidth: 1, borderColor: '#eee', elevation: 1 },
  incidentCardOffline: { borderColor: '#f1c40f', borderWidth: 1.5 }, 
  incidentImage: { width: 70, height: 70, borderRadius: 10 },
  fallbackImageContainer: { backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center' },
  incidentInfo: { marginLeft: 12, flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  incidentTitle: { fontSize: 15, fontWeight: '700', color: COLORS.secondary, flex: 1, marginRight: 8 },
  incidentZone: { fontSize: 13, color: COLORS.gray1, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  incidentDate: { fontSize: 11, color: COLORS.gray1, fontStyle: 'italic', marginLeft: 'auto' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { color: 'white', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  emptyFilterContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyText: { textAlign: 'center', color: COLORS.gray1, fontSize: 14, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -40 },
  mainImage: { width: width * 0.8, height: height * 0.3, marginBottom: height * 0.03 },
  title: { fontSize: width * 0.052, fontWeight: '700', color: COLORS.secondary, marginBottom: 10 },
  description: { fontSize: width * 0.038, color: COLORS.gray1, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
  scanButton: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12, width: width * 0.8, marginBottom: 40, alignItems: 'center', elevation: 5 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonIcon: { marginRight: 10 },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  fabButton: { position: 'absolute', bottom: 30, right: 0, backgroundColor: COLORS.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  offlineRow: { flexDirection: 'row', alignItems: 'center' },
  offlineText: { fontSize: 11, color: '#e74c3c', fontWeight: '600' }
});