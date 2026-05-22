/**
 * Récupère le nom de la zone à partir des coordonnées géographiques via Mapbox
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} Nom de la zone ou "Zone inconnue"
 */
export const getZoneFromCoordinates = async (latitude, longitude) => {
  // Récupération dynamique du token depuis le fichier .env
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_SECRET_TOKEN;
  
  // Log de diagnostic rapide (Utile en développement, à retirer en production)
  console.log("-> [MAPBOX CALL] Token chargé :", mapboxToken ? "OUI (Masqué)" : "NON TROUVÉ (Vérifie le .env)");

  if (!mapboxToken) {
    console.error("-> [ERROR] Le token Mapbox est manquant dans les variables d'environnement !");
    return "Zone inconnue";
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("-> [SUCCESS] Réponse de localisation Mapbox reçue");
    return data.features?.[0]?.text || "Zone inconnue";
  } catch (error) {
    console.error("-> [ERROR] Erreur lors de la récupération de la zone :", error);
    return "Zone inconnue";
  }
};