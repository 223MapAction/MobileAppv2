import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { envoyerIncident } from './incidents';

const OFFLINE_QUEUE_KEY = '@incident_offline_queue';

export const OfflineManager = {
  // Sauvegarder un incident quand on est hors-ligne
  saveForLater: async (incidentData) => {
    try {
      const existingQueue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      
      // On ajoute l'ID temporaire pour le suivi local
      const newIncident = { 
        ...incidentData, 
        id_local: Date.now(),
        timestamp: new Date().toISOString() 
      };
      
      queue.push(newIncident);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (e) {
      console.error("Erreur sauvegarde locale", e);
      return false;
    }
  },

  // Synchroniser les incidents en attente
  syncPendingIncidents: async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    const existingQueue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!existingQueue) return;

    let queue = JSON.parse(existingQueue);
    if (queue.length === 0) return;

    console.log(`Synchro de ${queue.length} incidents en cours...`);

    const updatedQueue = [];
    
    for (const incident of queue) {
      const result = await envoyerIncident(incident);
      if (!result.ok) {
        // Si l'envoi échoue encore, on le garde dans la liste pour plus tard
        updatedQueue.push(incident);
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    if (updatedQueue.length === 0) {
        console.log("Tous les incidents offline ont été envoyés !");
    }
  }
};