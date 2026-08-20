import { apiEndPoint } from "./apiUrl";

/**
 * Récupère les notifications de l'utilisateur authentifié. Le token est
 * passé explicitement (citoyen ou agent, cf. hooks/usePushNotifications.js
 * getActiveAccessToken) plutôt que lu ici — l'endpoint n'est pas garanti
 * spécifique à un rôle.
 */
export async function fetchNotifications(token) {
  try {
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiEndPoint}/notifications/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Notification fetch failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Marque une notification comme lue. Aucun endpoint "mark as read" n'est
 * documenté côté backend — pattern DRF standard le plus probable vu que
 * `is_read` existe déjà comme champ sur les notifications retournées par
 * fetchNotifications. À confirmer par le test ; best-effort, ne bloque
 * jamais l'UI (voir notificationsCitizenScrenn.js, mise à jour locale
 * optimiste indépendante du résultat de cet appel).
 */
export async function markNotificationAsRead(id, token) {
  try {
    if (!token) {
      return { ok: false, error: { message: "No authentication token found" } };
    }

    const response = await fetch(`${apiEndPoint}/notifications/${id}/`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_read: true }),
    });

    if (!response.ok) {
      return { ok: false, error: { status: response.status } };
    }

    return { ok: true, data: await response.json() };
  } catch (error) {
    return { ok: false, error };
  }
}

export default {
  fetchNotifications,
  markNotificationAsRead,
};