import { getTokenByEmail, register } from "../api/Auth"; // Ajuste le chemin vers tes requêtes API
import * as storage from "../storage/authStorage";

/**
 * Gère le flux complet d'authentification Google après l'obtention du token natif.
 * * @param {string} accessToken - Le jeton d'accès fourni par react-native-app-auth
 * @param {function} dispatch - La fonction dispatch de ton Redux / Context
 * @param {object} router - L'objet router d'expo-router pour la redirection
 */
export async function handleGoogleLoginFlow(accessToken, dispatch, router) {
  try {
    // 1. Récupérer les informations de l'utilisateur directement auprès de Google
    console.log("Récupération du profil utilisateur chez Google...");
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!response.ok) {
      throw new Error("Impossible de récupérer les informations de profil chez Google.");
    }

    const googleUser = await response.json();

    // Formatage propre pour ton backend Django
    const userInfo = {
      email: googleUser.email,
      first_name: googleUser.given_name || "",
      last_name: googleUser.family_name || "",
      avatar: googleUser.picture || "",
      provider: "Google",
    };

    console.log("Utilisateur Google converti :", userInfo.email);

    // 2. Vérifier si l'utilisateur existe déjà dans ton backend Django
    let data = await getTokenByEmail(userInfo.email);
    let token = data?.token;

    // 3. Inscription automatique sur Django si le compte n'existe pas encore
    if (!token) {
      console.log("Aucun token trouvé. Nouveau compte Google, inscription sur le serveur Django...");
      
      // Appel de ta fonction register de l'API backend
      await register(userInfo);
      
      // On retente de récupérer le token fraîchement généré
      const newData = await getTokenByEmail(userInfo.email);
      token = newData?.token;
    }

    // 4. Sauvegarde locale et connexion finale
    if (token) {
      console.log("Authentification réussie ! Sauvegarde des identifiants...");
      
      // Sauvegarde dans ton AsyncStorage / SecureStore via tes fonctions dédiées
      await storage.setAuthToken(token); 
      await storage.setAuthUser(userInfo); 

      // 5. Mise à jour de ton état global (Redux, Zustand ou Context)
      if (dispatch) {
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { token, user: userInfo } 
        });
      }

      // 6. Redirection vers l'application principale (les onglets)
      console.log("Redirection vers l'accueil...");
      router.replace('/(tabs)');
    } else {
      throw new Error("Le serveur Django n'a pas renvoyé de jeton d'authentification valide.");
    }

  } catch (error) {
    console.error("Erreur critique dans handleGoogleLoginFlow :", error);
    throw error; // Permet à l'écran LoginScreen d'attraper l'erreur et d'afficher l'Alerte
  }
}