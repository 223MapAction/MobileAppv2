import * as storage from "../storage/authStorage";
import { getTokenByEmail, register } from "./Auth";

export async function handleGoogleLoginFlow(accessToken, dispatch, router) {
  try {
    // 1. Récupérer les infos chez Google
    const response = await fetch("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const googleUser = await response.json();

    const userInfo = {
      email: googleUser.email,
      first_name: googleUser.given_name,
      last_name: googleUser.family_name,
      avatar: googleUser.picture,
      provider: "Google",
    };

    // 2. Vérifier si l'utilisateur existe dans ton backend Django
    let data = await getTokenByEmail(userInfo.email);
    let token = data?.token;

    // 3. Inscription automatique si le compte n'existe pas
    if (!token) {
      console.log("Nouveau compte Google, inscription...");
      await register(userInfo);
      const newData = await getTokenByEmail(userInfo.email);
      token = newData.token;
    }

    // 4. Sauvegarde dans TON storage (tes fonctions)
    if (token) {
      await storage.setAuthToken(token); // Utilise ta fonction
      await storage.setAuthUser(userInfo); // Utilise ta fonction

      // 5. Mise à jour de Redux
      // Si tu n'as pas encore d'action onLogin, on envoie un objet simple
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { token, user: userInfo } 
      });

      // 6. Redirection
      router.replace('/(tabs)');
    }
  } catch (error) {
    console.error("Erreur dans socialAuth:", error);
    throw error;
  }
}