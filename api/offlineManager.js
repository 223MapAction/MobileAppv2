import NetInfo from '@react-native-community/netinfo';
import { envoyerIncident } from './incidents';
import { readJsonArray, writeJsonArray } from './offlineQueueStorage';
import { getZoneFromOSM } from '../services/general';
import { ANONYMOUS_HISTORY_KEY, OFFLINE_QUEUE_KEY } from '../storage/storageKeys';

let isSynchronizing = false;

// Placeholders écrits par useIncidentLocation quand le géocodage inverse
// échoue faute de réseau au moment du signalement hors-ligne.
const isZoneUnresolved = (zone) => !zone || zone === 'Zone inconnue' || zone === 'Zone non récupérée';

export const OfflineManager = {

  // ==========================================
  // 1. GESTION DE LA FILE D'ATTENTE (QUEUE OFFLINE)
  // ==========================================

  // Sauvegarder un incident bloqué par le réseau
  saveForLater: async (incidentData) => {
    try {
      const queue = await readJsonArray(OFFLINE_QUEUE_KEY);

      const newIncident = {
        ...incidentData,
        id_local: Date.now().toString(),
        title: incidentData.title || "Incident Signalé",
        created_at: incidentData.created_at || new Date().toISOString(),
        isOffline: true
      };

      queue.push(newIncident);
      await writeJsonArray(OFFLINE_QUEUE_KEY, queue);
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
      return await readJsonArray(OFFLINE_QUEUE_KEY);
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
      const history = await readJsonArray(ANONYMOUS_HISTORY_KEY);

      // Sécurité anti-doublon : on vérifie si l'ID serveur existe déjà dans l'historique
      const dejaStocke = history.some(item => item.id === serverIncidentData.id);

      if (!dejaStocke) {
        history.unshift(serverIncidentData); // On l'ajoute en haut de la liste
        await writeJsonArray(ANONYMOUS_HISTORY_KEY, history);
        console.log("[History] Incident sauvegardé dans l'historique anonyme.");
      }
    } catch (e) {
      console.error("Erreur écriture historique anonyme :", e);
    }
  },

  // Récupérer l'historique pour l'affichage de l'utilisateur anonyme
  getAnonymousHistory: async () => {
    try {
      return await readJsonArray(ANONYMOUS_HISTORY_KEY);
    } catch (e) {
      console.error("Erreur lecture historique anonyme :", e);
      return [];
    }
  },

  // Tout ce qui est disponible localement : la file d'attente (peu importe
  // le rôle) + l'historique anonyme si aucun utilisateur n'est connecté.
  getAllSaved: async (userId = null) => {
    const pending = await OfflineManager.getPendingIncidents();
    if (userId) {
      return pending;
    }
    const anonymousHistory = await OfflineManager.getAnonymousHistory();
    return [...pending, ...anonymousHistory];
  },


  // ==========================================
  // 3. LOGIQUE DE SYNCHRONISATION AUTOMATIQUE
  // ==========================================
  syncPendingIncidents: async () => {
    if (isSynchronizing) {
      console.log("Synchro déjà en cours, annulation de l'appel doublon.");
      return;
    }

    // Verrou posé AVANT tout await : si l'écouteur réseau se déclenche
    // deux fois rapprochées (ex. wifi connecté puis internet joignable),
    // les deux appels ne doivent pas passer le test ci-dessus en même
    // temps et traiter la même file en parallèle (double envoi).
    isSynchronizing = true;

    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) return;

      const queue = await readJsonArray(OFFLINE_QUEUE_KEY);
      if (queue.length === 0) {
        return;
      }

      console.log(`[Synchro] Début du traitement pour ${queue.length} incident(s)...`);
      const updatedQueue = [];
      
      for (const incident of queue) {
        const { id_local, isOffline, ...apiData } = incident;

        // Zone captée hors-ligne = souvent un placeholder (pas de réseau au
        // moment du géocodage inverse) : on retente maintenant qu'on est
        // connecté, avant l'envoi, plutôt que de garder la valeur figée.
        if (isZoneUnresolved(apiData.zone) && apiData.lattitude && apiData.longitude) {
          const zoneRecuperee = await getZoneFromOSM(
            parseFloat(apiData.lattitude),
            parseFloat(apiData.longitude)
          );
          if (!isZoneUnresolved(zoneRecuperee)) {
            apiData.zone = zoneRecuperee;
          }
        }

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
      await writeJsonArray(OFFLINE_QUEUE_KEY, updatedQueue);
      
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

