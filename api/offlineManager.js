import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { envoyerIncident } from './incidents';

// CLÉ 1 : File d'attente temporaire (Online / Offline)
const OFFLINE_QUEUE_KEY = '@incident_offline_queue';
// CLÉ 2 : Historique permanent UNIQUEMENT pour les anonymes
const ANONYMOUS_HISTORY_KEY = '@incident_anonymous_history';

let isSynchronizing = false;

export const OfflineManager = {

  // ==========================================
  // 1. GESTION DE LA FILE D'ATTENTE (QUEUE OFFLINE)
  // ==========================================

  // Sauvegarder un incident bloqué par le réseau
  saveForLater: async (incidentData) => {
    try {
      const existingQueue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      
      const newIncident = { 
        ...incidentData, 
        id_local: Date.now().toString(),
        title: incidentData.title || "Incident Signalé",
        created_at: incidentData.created_at || new Date().toISOString(),
        isOffline: true
      };
      
      queue.push(newIncident);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log("[Queue] Incident ajouté à la liste d'attente offline.");
      return true;
    } catch (e) {
      console.error("Erreur sauvegarde locale queue :", e);
      return false;
    }
  },

  // Récupérer les incidents en attente d'envoi
  getPendingIncidents: async () => {
    try {
      const existingQueue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return existingQueue ? JSON.parse(existingQueue) : [];
    } catch (e) {
      console.error("Erreur lecture incidents locaux :", e);
      return [];
    }
  },


  // ==========================================
  // 2. GESTION DE L'HISTORIQUE DES ANONYMES
  // ==========================================

  // Sauvegarder définitivement un incident réussi dans l'historique anonyme local
  saveToAnonymousHistory: async (serverIncidentData) => {
    try {
      const existingHistory = await AsyncStorage.getItem(ANONYMOUS_HISTORY_KEY);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Sécurité anti-doublon : on vérifie si l'ID serveur existe déjà dans l'historique
      const dejaStocke = history.some(item => item.id === serverIncidentData.id);
      
      if (!dejaStocke) {
        history.unshift(serverIncidentData); // On l'ajoute en haut de la liste
        await AsyncStorage.setItem(ANONYMOUS_HISTORY_KEY, JSON.stringify(history));
        console.log("[History] Incident sauvegardé dans l'historique anonyme.");
      }
    } catch (e) {
      console.error("Erreur écriture historique anonyme :", e);
    }
  },

  // Récupérer l'historique pour l'affichage de l'utilisateur anonyme
  getAnonymousHistory: async () => {
    try {
      const existingHistory = await AsyncStorage.getItem(ANONYMOUS_HISTORY_KEY);
      return existingHistory ? JSON.parse(existingHistory) : [];
    } catch (e) {
      console.error("Erreur lecture historique anonyme :", e);
      return [];
    }
  },

  // Remplacement de ton ancienne méthode pour ton écran d'affichage global
  getAllSaved: async (userId = null) => {
    if (userId) {
      // Si on a un utilisateur connecté, on ne lit pas le local persistant, on gère via l'API en ligne
      return [];
    } else {
      // Si utilisateur anonyme, on renvoie son historique dédié
      return await OfflineManager.getAnonymousHistory();
    }
  },


  // ==========================================
  // 3. LOGIQUE DE SYNCHRONISATION AUTOMATIQUE
  // ==========================================
  syncPendingIncidents: async () => {
    if (isSynchronizing) {
      console.log("Synchro déjà en cours, annulation de l'appel doublon.");
      return;
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    isSynchronizing = true;

    try {
      const existingQueue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!existingQueue) {
        isSynchronizing = false;
        return;
      }

      let queue = JSON.parse(existingQueue);
      if (queue.length === 0) {
        isSynchronizing = false;
        return;
      }

      console.log(`[Synchro] Début du traitement pour ${queue.length} incident(s)...`);
      const updatedQueue = [];
      
      for (const incident of queue) {
        const { id_local, isOffline, ...apiData } = incident;

        // Envoi au serveur (Supabase)
        const result = await envoyerIncident(apiData);
        
        if (result.ok) {
          // L'incident a été stocké avec succès sur le serveur !
          const serverIncident = result.data; 

          // S'il s'agissait d'un incident ANONYME (pas de user_id),
          // on le transfère immédiatement dans son historique local persistant
          if (!apiData.user_id) {
            await OfflineManager.saveToAnonymousHistory(serverIncident);
          }
        } else {
          // Si l'envoi échoue (ex: timeout serveur), on garde l'incident dans la queue
          updatedQueue.push(incident);
        }
      }

      // On remplace la file d'attente uniquement par les incidents qui ont échoué
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
      
      if (updatedQueue.length === 0) {
        console.log("[Synchro] Succès ! Tous les incidents offline ont été synchronisés.");
      } else {
        console.log(`[Synchro] Terminé. ${updatedQueue.length} incident(s) ont échoué et réessaieront plus tard.`);
      }

    } catch (error) {
      console.error("Erreur pendant la synchronisation :", error);
    } finally {
      isSynchronizing = false;
    }
  }
};

