import { apiEndPoint } from "./apiUrl";
//  Importation des fonctions de stockage créées à l'étape 1
import { saveAuthUser } from "../storage/authStorageAgent";

/**
 * Connexion d'un agent de terrain via téléphone + PIN 4 chiffres
 */
export async function loginAgent(phone, pin) {
  // console.log("=== API CALL: loginAgent ===");
  // console.log("-> URL cible :", `${apiEndPoint}/agent-pin-login/`);

  try {
    const response = await fetch(`${apiEndPoint}/agent-pin-login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ phone, pin }),
    });

    const resultData = await response.json();

    if (response.ok) {
      // console.log("-> [API SUCCESS] Connexion réussie pour l'agent :", resultData.user?.first_name);

      // 🔑 CRUCIAL : On prépare l'objet session avec le token et les infos de l'utilisateur
      const sessionData = {
        token: resultData.access,       // Ton access_token Bearer
        refresh: resultData.refresh,   // Ton refresh token si présent
        user: resultData.user          // Profil de l'agent (id, name, must_change_pin...)
      };

      // 💾 Sauvegarde physique immédiate sur le téléphone
      await saveAuthUser(sessionData);

      return { ok: true, data: resultData };
    } else {
      // console.error("-> [API SERVER ERROR] Le serveur a rejeté la connexion :", resultData);
      return { ok: false, error: resultData };
    }
  } catch (error) {
    // console.error("-> [API NETWORK ERROR] Impossible de joindre le serveur :", error);
    return { ok: false, error: { message: "Impossible de contacter le serveur. Vérifiez votre connexion." } };
  }
}

/**
 * Change le code PIN de l'agent connecté
 */
export async function changeAgentPin(oldPin, newPin, token) {
  // console.log("=== API CALL: changeAgentPin ===");
  // console.log("-> URL cible :", `${apiEndPoint}/agent/change-pin/`);

  if (!token) {
    // console.error("-> [API ERROR] Token d'authentification manquant");
    return { ok: false, error: { message: "Session expirée. Veuillez vous reconnecter." } };
  }

  try {
    const response = await fetch(`${apiEndPoint}/agent/change-pin/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        old_pin: oldPin,
        new_pin: newPin
      }),
    });

    const resultData = await response.json();

    if (response.ok) {
      // console.log("-> [API SUCCESS] PIN changé avec succès");
      
      // 💡 Optionnel mais recommandé : Si ton API renvoie un nouvel utilisateur 
      // ou met à jour `must_change_pin: false`, tu pourras mettre à jour le storage ici.
      
      return { ok: true, data: resultData };
    } else {
      // console.error("-> [API SERVER ERROR] Échec du changement de PIN :", resultData);
      return { ok: false, error: resultData };
    }
  } catch (error) {
    // console.error("-> [API NETWORK ERROR] Impossible de joindre le serveur :", error);
    return { ok: false, error: { message: "Erreur réseau. Impossible de contacter le serveur." } };
  }
}