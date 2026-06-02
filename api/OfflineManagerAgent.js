import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { envoyerIncident } from './incidents';

// Clé d'archivage dédiée uniquement aux agents
const AGENT_OFFLINE_QUEUE_KEY = '@MapAction:agent_offline_queue';

let isSynchronizing = false;

export const OfflineManagerAgent = {

  /**
   * Met en attente le rapport d'un agent si le réseau est indisponible
   */
  saveForLater: async (incidentData) => {
    try {
      const existingQueue = await AsyncStorage.getItem(AGENT_OFFLINE_QUEUE_KEY);
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      
      const newIncident = { 
        ...incidentData, 
        id_local: Date.now().toString(),
        created_at: incidentData.created_at || new Date().toISOString(),
        isOffline: true
      };
      
      queue.push(newIncident);
      await AsyncStorage.setItem(AGENT_OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log("-> [AGENT QUEUE] Rapport sauvegardé localement en attente de réseau.");
      return true;
    } catch (e) {
      console.error("-> [AGENT OFFLINE ERROR] Échec de la mise en file d'attente :", e);
      return false;
    }
  },

  /**
   * Récupère les rapports en attente de synchronisation
   */
  getPendingIncidents: async () => {
    try {
      const existingQueue = await AsyncStorage.getItem(AGENT_OFFLINE_QUEUE_KEY);
      return existingQueue ? JSON.parse(existingQueue) : [];
    } catch (e) {
      console.error("-> [AGENT OFFLINE ERROR] Échec de lecture de la file d'attente :", e);
      return [];
    }
  },

  /**
   * Tente de vider la file d'attente dès que l'agent retrouve du réseau
   */
  syncPendingIncidents: async () => {
    if (isSynchronizing) {
      console.log("-> [AGENT SYNCHRO] Déjà en cours, appel doublon ignoré.");
      return;
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    isSynchronizing = true;

    try {
      const existingQueue = await AsyncStorage.getItem(AGENT_OFFLINE_QUEUE_KEY);
      if (!existingQueue) {
        isSynchronizing = false;
        return;
      }

      let queue = JSON.parse(existingQueue);
      if (queue.length === 0) {
        isSynchronizing = false;
        return;
      }

      console.log(`-> [AGENT SYNCHRO START] Traitement de ${queue.length} rapports d'agents...`);
      const updatedQueue = [];
      
      for (const incident of queue) {
        // Extraction stricte du token de l'agent et des clés de gestion locale
        const { id_local, isOffline, agent_token, ...apiData } = incident;

        // Envoi au serveur sécurisé avec le token requis
        const result = await envoyerIncident(apiData, agent_token);
        
        if (!result.ok) {
          // Si l'envoi échoue (ex: token expiré ou coupure), on le garde dans la queue
          updatedQueue.push(incident);
          console.log(`-> [AGENT SYNCHRO FAILED] Un rapport n'a pas pu partir. Conservé.`);
        }
      }

      // Sauvegarde des seuls rapports en échec
      await AsyncStorage.setItem(AGENT_OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
      
      if (updatedQueue.length === 0) {
        console.log("-> [AGENT SYNCHRO SUCCESS] Tous les rapports agents ont été envoyés avec succès.");
      } else {
        console.log(`-> [AGENT SYNCHRO PARTIAL] ${updatedQueue.length} rapport(s) toujours bloqué(s).`);
      }

    } catch (error) {
      console.error("-> [AGENT SYNCHRO CRITICAL ERROR] :", error);
    } finally {
      isSynchronizing = false;
    }
  }
};