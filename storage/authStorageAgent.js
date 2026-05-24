import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@MapAction:auth_user';

/**
 * Sauvegarde les informations de l'agent connecté (User + Tokens)
 */
export const saveAuthUser = async (userData) => {
  try {
    const jsonValue = JSON.stringify(userData);
    await AsyncStorage.setItem(AUTH_KEY, jsonValue);
    console.log("-> [STORAGE SUCCESS] Données de session sauvegardées.");
    return true;
  } catch (error) {
    console.error("-> [STORAGE ERROR] Échec de la sauvegarde de session :", error);
    return false;
  }
};

/**
 * Récupère les données de l'agent connecté depuis le stockage
 */
export const getAuthUser = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(AUTH_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error("-> [STORAGE ERROR] Échec de la lecture de session :", error);
    return null;
  }
};

/**
 * Supprime la session (Déconnexion)
 */
export const clearAuthUser = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_KEY);
    console.log("-> [STORAGE SUCCESS] Session nettoyée.");
    return true;
  } catch (error) {
    console.error("-> [STORAGE ERROR] Échec du nettoyage de session :", error);
    return false;
  }
};