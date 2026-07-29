import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { envoyerIncident } from './incidents';

const AGENT_OFFLINE_QUEUE_KEY = '@MapAction:agent_offline_queue';
let isSynchronizing = false;

export const OfflineManagerAgent = {

  /**
   * Sauvegarde un incident en local pour l'agent
   */
  saveForLater: async (incidentData) => {
    try {
      const existingQueue = await AsyncStorage.getItem(AGENT_OFFLINE_QUEUE_KEY);
      const queue = existingQueue ? JSON.parse(existingQueue) : [];

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
      await AsyncStorage.setItem(AGENT_OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      // console.log(`📌 [QUEUE AGENT] Incident sauvegardé localement (ID Local: ${newIncident.id_local})`);
      return true;
    } catch (e) {
      // console.error("❌ [AGENT OFFLINE ERROR] Échec sauvegarde locale :", e);
      return false;
    }
  },

  /**
   * Récupère la liste des incidents stockés hors-ligne
   */
  getPendingIncidents: async () => {
    try {
      const existingQueue = await AsyncStorage.getItem(AGENT_OFFLINE_QUEUE_KEY);
      return existingQueue ? JSON.parse(existingQueue) : [];
    } catch (e) {
      // console.error("❌ [AGENT OFFLINE ERROR] Échec lecture queue :", e);
      return [];
    }
  },

  /**
   * Tente de vider la file d'attente dès que l'agent a du réseau
   */
  syncPendingIncidents: async () => {
    // 🛡️ VERROU IMMÉDIAT (Lock synchrone avant tout "await")
    if (isSynchronizing) {
      // console.log("🔒 [SYNCHRO AGENT] Synchronisation déjà en cours. Appel ignoré.");
      return;
    }

    isSynchronizing = true; // Positionné AVANT tout appel asynchrone

    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        // console.log("🚫 [SYNCHRO AGENT] Pas de connexion réseau disponible.");
        return;
      }

      const existingQueue = await AsyncStorage.getItem(AGENT_OFFLINE_QUEUE_KEY);
      if (!existingQueue) return;

      const queue = JSON.parse(existingQueue);
      if (!Array.isArray(queue) || queue.length === 0) return;

      // console.log(`📤 [SYNCHRO AGENT DEBUT] Traitement de ${queue.length} incident(s) en attente...`);

      // ⚠️ PROTECTION ANTI-DOUBLON : Vider la file locale AVANT envoi
      await AsyncStorage.setItem(AGENT_OFFLINE_QUEUE_KEY, JSON.stringify([]));

      const failedIncidents = [];
      
      for (const incident of queue) {
        const { id_local, isOffline, agent_token, ...apiPayload } = incident;

        // console.log(`🚀 [SYNCHRO AGENT ENVOI] ID Local: ${id_local} | Titre: "${apiPayload.title || 'Sans titre'}"`);

        // Inclusion explicite du token (2ème paramètre de envoyerIncident)
        const tokenToUse = agent_token || apiPayload.token;
        const result = await envoyerIncident(apiPayload, tokenToUse);
        
        if (result && (result.ok || result.status === 200 || result.status === 201)) {
          // console.log(`✅ [SYNCHRO AGENT SUCCÈS] Incident local ${id_local} accepté par le serveur !`);
        } else {
          // console.warn(`❌ [SYNCHRO AGENT ÉCHEC] Incident local ${id_local} conservé en file d'attente. Raison :`, result?.error);
          failedIncidents.push(incident);
        }
      }

      if (failedIncidents.length > 0) {
        // En cas d'échec partiel, réinjecter les échecs dans AsyncStorage
        const currentQueue = JSON.parse((await AsyncStorage.getItem(AGENT_OFFLINE_QUEUE_KEY)) || '[]');
        const updatedQueue = [...currentQueue, ...failedIncidents];
        await AsyncStorage.setItem(AGENT_OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
        // console.log(`⚠️ [SYNCHRO AGENT FIN] ${failedIncidents.length} incident(s) réinjectés pour la prochaine tentative.`);
      } else {
        // console.log(`🎉 [SYNCHRO AGENT FIN] Tous les incidents ont été synchronisés avec succès !`);
      }

    } catch (error) {
      // console.error("❌ [SYNCHRO AGENT CRITICAL ERROR] :", error);
    } finally {
      isSynchronizing = false; // 🔓 Libération définitive du verrou
    }
  }
};