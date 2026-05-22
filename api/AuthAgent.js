import { apiEndPoint } from "./apiUrl";

/**
 * Connexion d'un agent de terrain via téléphone + PIN 4 chiffres
 * @param {string} phone - Numéro au format international (ex: +22375323212)
 * @param {string} pin - Code PIN à 4 chiffres
 * @returns {Promise<Object>} Résultat avec statut {ok: true, data} ou {ok: false, error}
 */
export async function loginAgent(phone, pin) {
  console.log("=== API CALL: loginAgent ===");
  console.log("-> URL cible :", `${apiEndPoint}/agent-pin-login/`);
  console.log("-> Payload envoyé :", { phone, pin: "****" });

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
      console.log("-> [API SUCCESS] Connexion réussie pour l'agent :", resultData.user?.first_name);
      return { ok: true, data: resultData };
    } else {
      console.error("-> [API SERVER ERROR] Le serveur a rejeté la connexion :", resultData);
      return { ok: false, error: resultData };
    }
  } catch (error) {
    console.error("-> [API NETWORK ERROR] Impossible de joindre le serveur :", error);
    return { ok: false, error: { message: "Impossible de contacter le serveur. Vérifiez votre connexion." } };
  }
}

/**
 * Change le code PIN de l'agent connecté
 * @param {string} oldPin - PIN actuel (4 chiffres)
 * @param {string} newPin - Nouveau PIN (4 chiffres)
 * @param {string} token - Le token d'authentification (JWT) de l'agent connecté
 * @returns {Promise<Object>} Résultat avec statut {ok: true, data} ou {ok: false, error}
 */
export async function changeAgentPin(oldPin, newPin, token) {
  console.log("=== API CALL: changeAgentPin ===");
  console.log("-> URL cible :", `${apiEndPoint}/agent/change-pin/`);

  if (!token) {
    console.error("-> [API ERROR] Token d'authentification manquant");
    return { ok: false, error: { message: "Session expirée. Veuillez vous reconnecter." } };
  }

  try {
    const response = await fetch(`${apiEndPoint}/agent/change-pin/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`, // Header crucial pour l'authentification Django/Express
      },
      body: JSON.stringify({
        old_pin: oldPin,
        new_pin: newPin
      }),
    });

    const resultData = await response.json();

    if (response.ok) {
      console.log("-> [API SUCCESS] PIN changé avec succès");
      return { ok: true, data: resultData };
    } else {
      console.error("-> [API SERVER ERROR] Échec du changement de PIN :", resultData);
      return { ok: false, error: resultData };
    }
  } catch (error) {
    console.error("-> [API NETWORK ERROR] Impossible de joindre le serveur :", error);
    return { ok: false, error: { message: "Erreur réseau. Impossible de contacter le serveur." } };
  }
}