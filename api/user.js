import http, { apiEndPoint } from "./apiUrl";

/**
 * Récupère la liste de tous les utilisateurs (avec gestion de la pagination)
 */
export async function list_user() {
  const getData = async (route) => {
    const { results, next } = await http.get(route);
    if (next) {
      const res = await getData(next);
      return [...results, ...res];
    }
    return results;
  };
  return getData("/user/");
}

/**
 * Récupère les détails d'un utilisateur spécifique
 */
export async function read_user(id, token = null) {
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${apiEndPoint}/user/${id}/`, {
      method: 'GET',
      headers: headers,
    });

    const resultData = await response.json();

    if (response.ok) {
      return resultData;
    } else {
      console.error("Erreur serveur read_user :", resultData);
      throw resultData;
    }
  } catch (error) {
    console.error("Erreur réseau / API read_user :", error);
    throw error;
  }
}

/**
 * Met à jour le profil utilisateur (Supporte le texte et l'image avatar)
 */
export async function update_user(id, { avatar, ...data }, token = null) {
  let formdata = new FormData();

  // 1. Gestion de l'Avatar
  if (avatar && (avatar.startsWith("file://") || avatar.startsWith("content://"))) {
    const filename = avatar.split('/').pop();
    const parts = filename.split(".");
    const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
    
    // ICI : Remplacement définitif de generateMakeId par un ID unique basé sur le temps
    const uniqueId = Date.now() + Math.random().toString(36).substring(2, 11);
    
    formdata.append("avatar", {
      uri: avatar,
      name: `${uniqueId}.${extension}`,
      type: extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`,
    });
  } else if (avatar) {
    formdata.append("avatar", avatar);
  }

  // 2. Ajout des autres champs
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formdata.append(key, data[key]);
    }
  });

  // 3. Envoi de la requête
  try {
    const response = await fetch(`${apiEndPoint}/user/${id}/`, {
      method: 'PUT',
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      body: formdata,
    });

    const resultData = await response.json();

    if (response.ok) {
      console.log("Mise à jour réussie :", resultData);
      return resultData;
    } else {
      console.error("Erreur retournée par le serveur :", resultData);
      throw resultData;
    }
  } catch (error) {
    console.error("Erreur réseau / API update_user :", error);
    throw error;
  }
}

// Exportation de toutes les fonctions
export default {
  list_user,
  read_user,
  update_user,
};