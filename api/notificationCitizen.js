import { getAuthToken } from "../storage/authStorage";
import { apiEndPoint } from "./apiUrl";

/**
 * Récupère les notifications de l'utilisateur authentifié
 */
export async function fetchNotifications() {
  try {
    const tokenData = await getAuthToken();
    const token = tokenData?.access || tokenData;

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${apiEndPoint}/my-incidents/notifications/`, {
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

export default {
  fetchNotifications,
};