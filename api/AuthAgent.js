import { apiEndPoint } from "./apiUrl";
//  Importation des fonctions de stockage créées à l'étape 1
import { saveAuthUser } from "../storage/authStorageAgent";

/**
 * Connexion d'un agent de terrain via téléphone + PIN 4 chiffres
 */
export async function loginAgent(phone, pin) {
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
      // 🔑 CRUCIAL : On prépare l'objet session avec le token et les infos de l'utilisateur
      const sessionData = {
        token: resultData.access,       // Ton access_token Bearer
        refresh: resultData.refresh,   // Ton refresh token si présent
        user: resultData.user,          // Profil de l'agent (id, name, must_change_pin...)
        loggedInAt: Date.now(),         // Point de départ de la durée de validité de la session (voir storage/sessionConfig.js)
      };

      // 💾 Sauvegarde physique immédiate sur le téléphone
      await saveAuthUser(sessionData);

      return { ok: true, data: resultData };
    } else {
      return { ok: false, error: resultData };
    }
  } catch (error) {
    return { ok: false, error: { message: "Impossible de contacter le serveur. Vérifiez votre connexion." } };
  }
}

/**
 * Demande l'envoi d'un e-mail de réinitialisation du code PIN.
 * Envoyer l'un ou l'autre (téléphone ou e-mail), pas besoin des deux.
 * Public — ne nécessite pas de token. La suite (choix du nouveau PIN) se
 * passe entièrement hors de l'app, dans une page web envoyée par e-mail.
 */
export async function requestResetPin({ phone, email }) {
  try {
    const response = await fetch(`${apiEndPoint}/agent/request-reset-pin/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(phone ? { phone } : { email }),
    });

    const resultData = await response.json();

    if (response.ok) {
      return { ok: true, data: resultData };
    } else {
      return { ok: false, error: resultData };
    }
  } catch (error) {
    return { ok: false, error: { message: "Impossible de contacter le serveur. Vérifiez votre connexion." } };
  }
}

/**
 * Change le code PIN de l'agent connecté
 */
export async function changeAgentPin(oldPin, newPin, token) {
  if (!token) {
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
      // 💡 Optionnel mais recommandé : Si ton API renvoie un nouvel utilisateur
      // ou met à jour `must_change_pin: false`, tu pourras mettre à jour le storage ici.

      return { ok: true, data: resultData };
    } else {
      return { ok: false, error: resultData };
    }
  } catch (error) {
    return { ok: false, error: { message: "Erreur réseau. Impossible de contacter le serveur." } };
  }
}