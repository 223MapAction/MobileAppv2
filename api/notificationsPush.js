import { getAccessToken } from "../storage/authStorage";
import { apiEndPoint } from "./apiUrl";

/**
 * Enregistre le token FCM de l'appareil auprès du backend, pour recevoir
 * les notifications push (incident pris en compte / résolu). JWT requis.
 * POST et PUT font strictement la même chose côté backend.
 */
export async function registerFcmToken(fcmToken) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { ok: false, error: { message: "Session expirée. Veuillez vous reconnecter." } };
    }

    const response = await fetch(`${apiEndPoint}/users/fcm-token/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ fcm_token: fcmToken }),
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
