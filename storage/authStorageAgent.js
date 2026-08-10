import AsyncStorage from '@react-native-async-storage/async-storage';
import { AGENT_SESSION_MAX_AGE_MS } from './sessionConfig';
import { AGENT_KEY } from './storageKeys';

// Une session sans `loggedInAt` (ancien format, avant l'ajout de cette
// limite) n'est pas considérée comme expirée pour éviter de déconnecter
// des agents déjà connectés au moment de la mise à jour de l'app.
const isSessionExpired = (agentData) => {
  if (!agentData?.loggedInAt) return false;
  return Date.now() - agentData.loggedInAt > AGENT_SESSION_MAX_AGE_MS;
};

/**
 * Sauvegarde les informations de l'agent connecté (User + Tokens)
 */
export const saveAuthUser = async (agentData) => {
  try {
    const jsonValue = JSON.stringify(agentData);
    await AsyncStorage.setItem(AGENT_KEY, jsonValue);
    console.log("-> [STORAGE SUCCESS] Données de l'agent sauvegardées.");
    return true;
  } catch (error) {
    console.error("-> [STORAGE ERROR] Échec de la sauvegarde de l'agent :", error);
    return false;
  }
};

/**
 * Récupère les données complètes de l'agent connecté depuis le stockage.
 * Renvoie null si la session a dépassé AGENT_SESSION_MAX_AGE_MS (et la
 * nettoie au passage), comme si l'agent n'était pas connecté.
 */
export const getAuthUser = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(AGENT_KEY);
    if (jsonValue == null) return null;

    const agentData = JSON.parse(jsonValue);
    if (isSessionExpired(agentData)) {
      await AsyncStorage.removeItem(AGENT_KEY);
      return null;
    }

    return agentData;
  } catch (error) {
    console.error("-> [STORAGE ERROR] Échec de la lecture de l'agent :", error);
    return null;
  }
};

/**
 * Récupère directement le token d'accès (access token) de l'agent.
 * Passe par getAuthUser() pour bénéficier de la même vérification
 * d'expiration sans la dupliquer.
 */
export const getAuthToken = async () => {
  const agentData = await getAuthUser();
  if (!agentData) return null;
  // Retourne le token selon la structure de la réponse API (soit agentData.token, soit agentData.access)
  return agentData?.token || agentData?.access || agentData;
};

/**
 * Supprime la session de l'agent (Déconnexion)
 */
export const clearAuthUser = async () => {
  try {
    await AsyncStorage.removeItem(AGENT_KEY);
    console.log("-> [STORAGE SUCCESS] Session agent nettoyée.");
    return true;
  } catch (error) {
    console.error("-> [STORAGE ERROR] Échec du nettoyage de la session agent :", error);
    return false;
  }
};