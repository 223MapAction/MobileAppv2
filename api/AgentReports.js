import { Platform } from "react-native";
import { apiEndPoint } from "./apiUrl";

const API_BASE_URL = apiEndPoint;

/**
 * Crée un rapport terrain pour un incident assigné
 * @param {string} token - Le token Bearer de l'agent
 * @param {Object} reportData - Contient { incidentId, lat, lon, notes, photoUri }
 */
export const createFieldReport = async (token, reportData) => {
  try {
    console.log("=== DEBUG START: createFieldReport ===");
    console.log("Token fourni :", token ? "Présent (Valide)" : "MANQUANT");
    console.log("Data reçue par la fonction :", reportData);

    const formData = new FormData();
    
    // CORRECTION : Forcer la conversion en String propre pour le FormData sur Android
    // Assure-toi que reportData.incidentId n'est pas undefined/null avant d'appeler String()
    if (reportData.incidentId) {
        formData.append('incident', String(reportData.incidentId));
    } else {
        console.error("ERREUR DEBUG : incidentId est manquant dans reportData !");
    }
    
    if (reportData.lat) formData.append('location_lat', String(reportData.lat));
    if (reportData.lon) formData.append('location_lon', String(reportData.lon));
    if (reportData.notes) formData.append('notes', reportData.notes);

    // Gestion de la photo
    if (reportData.photoUri) {
      const filename = reportData.photoUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const cleanUri = Platform.OS === 'android' ? reportData.photoUri : reportData.photoUri.replace('file://', '');

      formData.append('photo', {
        uri: cleanUri,
        name: filename || 'incident_photo.jpg',
        type: type,
      });
    }

    // URL corrigée sans doublon /MapApi/
    const fullUrl = `${API_BASE_URL}/field-reports/`; 
    console.log("URL de destination ciblée :", fullUrl);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // Content-Type géré automatiquement
      },
      body: formData,
    });

    console.log("Statut de la réponse HTTP :", response.status);
    
    // Sécurité au cas où le serveur renvoie du HTML
    const responseText = await response.text();
    let data = {};
    
    try {
      data = JSON.parse(responseText);
    } catch (jsonErr) {
      console.error("Le serveur n'a pas renvoyé de JSON valide. Texte reçu :", responseText);
      return { ok: false, error: { detail: `Erreur serveur (${response.status}).` } };
    }

    console.log("Payload de retour du serveur :", data);
    console.log("=== DEBUG END ===");

    if (response.ok) {
      return { ok: true, data };
    } else {
      console.error("Erreur API Field Report :", data);
      return { ok: false, error: data };
    }
  } catch (error) {
    console.error("Erreur critique createFieldReport :", error);
    return { ok: false, error: error.message };
  }
};

/**
 * Récupère la liste des rapports terrain soumis par l'agent connecté
 */
export const getAgentReports = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/field-reports/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();
    console.log(json);
    

    if (response.ok) {
      return { ok: true, data: json };
    } else {
      return { ok: false, error: json };
    }
  } catch (error) {
    console.error("Erreur API getAgentReports :", error);
    return { ok: false, error: { detail: "Impossible de joindre le serveur central." } };
  }
};