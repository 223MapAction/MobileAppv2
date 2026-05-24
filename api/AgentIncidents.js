import { apiEndPoint } from "./apiUrl";

/**
 * Récupère les incidents assignés à l'agent connecté
 * @param {string} token - Le token Bearer (JWT) de l'agent
 * @returns {Promise<Object>} Résultat avec statut {ok: true, data} ou {ok: false, error}
 */
export async function getAssignedIncidents(token) {
  console.log("=== API CALL: getAssignedIncidents ===");
  console.log("-> URL cible :", `${apiEndPoint}/agent/assigned-incidents/`);

  if (!token) {
    console.error("-> [API ERROR] Jeton d'authentification absent.");
    return { ok: false, error: { message: "Session invalide. Veuillez vous reconnecter." } };
  }

  try {
    const response = await fetch(`${apiEndPoint}/agent/assigned-incidents/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const resultData = await response.json();

    if (response.ok) {
      console.log(`-> [API SUCCESS] ${resultData.length} incident(s) récupéré(s).`);
      return { ok: true, data: resultData };
    } else {
      console.error("-> [API SERVER ERROR] Échec de récupération des incidents :", resultData);
      return { ok: false, error: resultData };
    }
  } catch (error) {
    console.error("-> [API NETWORK ERROR] Impossible de charger les incidents :", error);
    return { ok: false, error: { message: "Erreur réseau. Impossible de joindre le serveur." } };
  }
}