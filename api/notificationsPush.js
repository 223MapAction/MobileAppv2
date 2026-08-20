import { apiEndPoint } from "./apiUrl";

/**
 * Enregistre le token FCM de l'appareil auprès du backend, pour recevoir
 * les notifications push (incident pris en compte / résolu). JWT requis
 * (citoyen ou agent de terrain, l'endpoint n'est pas spécifique à un rôle
 * — d'où le token passé explicitement plutôt que lu ici). POST et PUT
 * font strictement la même chose côté backend.
 */
export async function registerFcmToken(fcmToken, token) {
  try {
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
