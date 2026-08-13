import { ApiUrl } from './apiUrl';

const apiEndPoint = ApiUrl + "/MapApi";

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export const envoyerIncident = async (payload, token) => {
  try {
    let formdata = new FormData();
    // On extrait photo, audio ET video du payload
    const { photo, audio, video, ...data } = payload;

    // Traitement de la Photo
    if (photo) {
      let parts = photo.split("/");
      let extension = parts[parts.length - 1].split(".").pop();
      formdata.append("photo", {
        uri: photo,
        name: `${makeid(60)}.${extension}`,
        type: "multipart/form-data",
      });
    }

    // Traitement de l'Audio
    if (audio) {
       let aParts = audio.split("/");
       let aExtension = aParts[aParts.length - 1].split(".").pop();
       formdata.append("audio", {
         uri: audio,
         name: `${makeid(60)}.${aExtension}`,
         type: "multipart/form-data",
       });
    }

    // Traitement de la Vidéo8
    if (video) {
       let vParts = video.split("/");
       let vExtension = vParts[vParts.length - 1].split(".").pop();
       formdata.append("video", {
         uri: video,
         name: `${makeid(60)}.${vExtension}`,
         type: "multipart/form-data", 
       });
    }

    
    Object.keys(data).forEach((k) => {
      if (data[k] !== null && data[k] !== undefined) {
        formdata.append(k, data[k]);
      }
    });

    const headers = {
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${apiEndPoint}/incident/`, {
      method: 'POST',
      body: formdata,
      headers,
    });

    const responseText = await response.text();

    if (response.status === 201 || response.status === 200) {
      return { ok: true, data: JSON.parse(responseText) };
    } else {
      return { ok: false, error: responseText, status: response.status };
    }
  } catch (error) {
    return { ok: false, error };
  }
};

// Ajoute ceci à ton fichier api/incidents.js

export const getMesIncidents = async (userId, token) => {
  try {
    const response = await fetch(`${apiEndPoint}/my-incidents/?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // AJOUT DU TOKEN ICI
        'Authorization': `Bearer ${token}`, // Ou `Token ${token}` selon ta config Django
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { ok: true, data };
    } else {
      return { ok: false, error: data };
    }
  } catch (error) {
    return { ok: false, error };
  }
};

// Ajoute ou remplace cette fonction dans api/incidents.js
export const getIncidentByIdOnline = async (incidentId, token) => {
  try {
    console.log(`=== [API DEBUG] Appel de getIncidentByIdOnline pour l'ID: ${incidentId} ===`);
    
    const response = await fetch(`${apiEndPoint}/my-incidents/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseData = await response.json();

    if (response.ok) {
      // 1. On extrait le tableau de manière sécurisée selon la structure de ta réponse API
      const tableauIncidents = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.incidents || responseData?.results || responseData?.data || []);

      console.log(`=== [API DEBUG] Nombre d'incidents récupérés par l'API : ${tableauIncidents.length} ===`);

      // 2. On cherche l'incident spécifique par son ID (en forçant la comparaison en chaînes de caractères)
      const incident = tableauIncidents.find(item => 
        item && (item.id?.toString() === incidentId?.toString() || item.id_local?.toString() === incidentId?.toString())
      );

      if (incident) {
        console.log(`=== [API DEBUG] Incident trouvé avec succès dans le tableau ! ===`);
        return { ok: true, data: incident };
      } else {
        console.warn(`-> [API DEBUG] L'ID ${incidentId} n'existe pas dans le tableau renvoyé par le serveur.`);
        return { ok: false, error: "Incident non trouvé dans la liste serveur" };
      }
    } else {
      console.error("-> [API DEBUG] Erreur retournée par le serveur (statut non OK) :", responseData);
      return { ok: false, error: responseData };
    }
  } catch (error) {
    console.error("❌ [API DEBUG] Crash réseau ou encodage dans getIncidentByIdOnline :", error);
    return { ok: false, error };
  }
};