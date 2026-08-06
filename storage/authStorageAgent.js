import AsyncStorage from '@react-native-async-storage/async-storage';
import { AGENT_KEY } from './storageKeys';

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
 * Récupère les données complètes de l'agent connecté depuis le stockage
 */
export const getAuthUser = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(AGENT_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error("-> [STORAGE ERROR] Échec de la lecture de l'agent :", error);
    return null;
  }
};

/**
 * Récupère directement le token d'accès (access token) de l'agent
 */
export const getAuthToken = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(AGENT_KEY);
    if (jsonValue != null) {
      const agentData = JSON.parse(jsonValue);
      // Retourne le token selon la structure de ta réponse API (soit agentData.token, soit agentData.access)
      return agentData?.token || agentData?.access || agentData;
    }
    return null;
  } catch (error) {
    console.error("-> [STORAGE ERROR] Échec de la lecture du token agent :", error);
    return null;
  }
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