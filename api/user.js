import http, { makeid } from "./apiUrl";

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
export async function read_user(id) {
  return await http.get(`/user/${id}/`);
}

/**
 * Met à jour le profil utilisateur (Supporte le texte et l'image avatar)
 */
export async function update_user(id, { avatar, ...data }, token = null) {
  let formdata = new FormData();

  // 1. Gestion de l'Avatar (si c'est un nouveau fichier local)
  if (avatar && avatar.startsWith("file://")) {
    const parts = avatar.split(".");
    const extension = parts[parts.length - 1].toLowerCase();
    
    formdata.append("avatar", {
      uri: avatar,
      name: `${makeid(20)}.${extension}`,
      // Correction dynamique du type MIME
      type: extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`,
    });
  }

  // 2. Ajout des autres champs (Nom, Prénom, Email, etc.)
  // On filtre les valeurs nulles ou indéfinies
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formdata.append(key, data[key]);
    }
  });

  // 3. Configuration des Headers
  const options = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  // 4. Envoi de la requête
  try {
    const response = await http.put(`/user/${id}/`, formdata, options);
    console.log("Mise à jour réussie :", response);
    return response; 
  } catch (error) {
    console.error("Erreur API update_user :", error);
    throw error;
  }
}

// Exportation de toutes les fonctions
export default {
  list_user,
  read_user,
  update_user,
};