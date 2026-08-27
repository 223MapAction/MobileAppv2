import NetInfo from '@react-native-community/netinfo';
import { envoyerIncident } from './incidents';
import { readJsonArray, writeJsonArray } from './offlineQueueStorage';
import { getZoneFromOSM } from '../services/general';
import { AGENT_OFFLINE_QUEUE_KEY } from '../storage/storageKeys';

let isSynchronizing = false;

// Placeholders écrits par useIncidentLocation quand le géocodage inverse
// échoue faute de réseau au moment du signalement hors-ligne.
const isZoneUnresolved = (zone) => !zone || zone === 'Zone inconnue' || zone === 'Zone non récupérée';

export const OfflineManagerAgent = {

  /**
   * Sauvegarde un incident en local pour l'agent
   */
  saveForLater: async (incidentData) => {
    try {
      const queue = await readJsonArray(AGENT_OFFLINE_QUEUE_KEY);

      // 🛡️ Anti-doublon à la sauvegarde locale : vérification du contenu
      const isAlreadyInQueue = queue.some(item => 
        item.title === incidentData.title && 
        item.lattitude === incidentData.lattitude && 
        item.longitude === incidentData.longitude
      );

      if (isAlreadyInQueue) {
        console.log("⚠️ [QUEUE AGENT] Incident identique déjà en attente dans la file local. Ignoré.");
        return true;
      }
      
      const newIncident = { 
        ...incidentData, 
        id_local: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        created_at: incidentData.created_at || new Date().toISOString(),
        isOffline: true
      };
      
      queue.push(newIncident);
      await writeJsonArray(AGENT_OFFLINE_QUEUE_KEY, queue);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Récupère la liste des incidents stockés hors-ligne
   */
  getPendingIncidents: async () => {
    try {
      return await readJsonArray(AGENT_OFFLINE_QUEUE_KEY);
    } catch (e) {
      return [];
    }
  },

  /**
   * Tente de vider la file d'attente dès que l'agent a du réseau
   */
  syncPendingIncidents: async () => {
    // 🛡️ VERROU IMMÉDIAT (Lock synchrone avant tout "await")
    if (isSynchronizing) {
      console.log('[Synchro Agent] Synchro déjà en cours, appel ignoré.');
      return;
    }

    isSynchronizing = true; // Positionné AVANT tout appel asynchrone

    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        console.log('[Synchro Agent] Pas de connexion détectée (isConnected=false), synchro annulée.');
        return;
      }

      const queue = await readJsonArray(AGENT_OFFLINE_QUEUE_KEY);
      if (!Array.isArray(queue) || queue.length === 0) return;

      console.log(`[Synchro Agent] Début du traitement pour ${queue.length} incident(s)...`);

      // ⚠️ PROTECTION ANTI-DOUBLON : Vider la file locale AVANT envoi
      await writeJsonArray(AGENT_OFFLINE_QUEUE_KEY, []);

      const failedIncidents = [];

      for (const incident of queue) {
        const { id_local, isOffline, agent_token, ...apiPayload } = incident;

        // Zone captée hors-ligne = souvent un placeholder (pas de réseau au
        // moment du géocodage inverse) : on retente maintenant qu'on est
        // connecté, avant l'envoi, plutôt que de garder la valeur figée.
        if (isZoneUnresolved(apiPayload.zone) && apiPayload.lattitude && apiPayload.longitude) {
          const zoneRecuperee = await getZoneFromOSM(
            parseFloat(apiPayload.lattitude),
            parseFloat(apiPayload.longitude)
          );
          if (!isZoneUnresolved(zoneRecuperee)) {
            apiPayload.zone = zoneRecuperee;
          }
        }

        // Inclusion explicite du token (2ème paramètre de envoyerIncident)
        const tokenToUse = agent_token || apiPayload.token;
        const result = await envoyerIncident(apiPayload, tokenToUse);

        if (result && (result.ok || result.status === 200 || result.status === 201)) {
          console.log(`[Synchro Agent] Incident "${apiPayload.title || id_local}" envoyé avec succès.`);
        } else {
          console.warn(
            `[Synchro Agent] Échec d'envoi pour l'incident "${apiPayload.title || id_local}" (statut ${result?.status ?? 'inconnu'}) :`,
            result?.error
          );
          failedIncidents.push(incident);
        }
      }

      if (failedIncidents.length > 0) {
        // En cas d'échec partiel, réinjecter les échecs dans AsyncStorage
        const currentQueue = await readJsonArray(AGENT_OFFLINE_QUEUE_KEY);
        const updatedQueue = [...currentQueue, ...failedIncidents];
        await writeJsonArray(AGENT_OFFLINE_QUEUE_KEY, updatedQueue);
        console.log(`[Synchro Agent] Terminé. ${failedIncidents.length} incident(s) ont échoué et réessaieront plus tard.`);
      } else {
        console.log('[Synchro Agent] Succès ! Tous les incidents offline ont été synchronisés.');
      }

    } catch (error) {
      console.error('[Synchro Agent] Erreur pendant la synchronisation :', error);
    } finally {
      isSynchronizing = false; // 🔓 Libération définitive du verrou
    }
  }
};