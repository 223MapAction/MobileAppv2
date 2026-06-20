import * as WebBrowser from "expo-web-browser";
import * as jwtDecodeModule from "jwt-decode"; // 🔄 Importation du module complet en sécurité
import { apiEndPoint } from "../api/apiUrl";

// 🔑 IMPORTATION DES FONCTIONS D'ÉCRITURE DE TON AUTHSTORAGE
import { setAuthToken, setAuthUser } from "../storage/authStorage";

WebBrowser.maybeCompleteAuthSession();

/**
 * Gère le flux complet Clerk + Synchronisation MapApi
 * @param {Function} startOAuthFlow - Le trigger de Clerk passé depuis l'écran de Login
 * @param {Object} clerkInstance - Passe l'instance 'clerk' ou utilise l'extraction globale de session
 */
export async function handleGoogleAuthWithClerk(startOAuthFlow, clerkInstance) {
  try {
    const { createdSessionId, setActive, signIn, signUp } = await startOAuthFlow();

    if (createdSessionId) {
      // 1. On active d'abord la session Clerk pour figer l'authentification
      await setActive({ session: createdSessionId });

      let email = "";
      let firstName = "";
      let lastName = "";
      let avatar = "/uploads/avatars/default.png";

      // 🎯 EXTRACTION SÉCURISÉE DE L'EMAIL DEPUIS LES DICTIONNAIRES EXTERNES DE CLERK
      if (signIn?.userData) {
        email = signIn.userData.emailAddress;
        firstName = signIn.userData.firstName;
        lastName = signIn.userData.lastName;
      }
      
      if (!email && signUp) {
        email = signUp.emailAddress || signUp.unverifiedFields?.emailAddress;
        firstName = signUp.firstName;
        lastName = signUp.lastName;
      }

      if (!email && signIn?.identifier) {
        email = signIn.identifier;
      }

      if (!email && clerkInstance?.user) {
        email = clerkInstance.user.primaryEmailAddress?.emailAddress;
        firstName = clerkInstance.user.firstName;
        lastName = clerkInstance.user.lastName;
      }

      console.log("🔍 Extraction finale des infos Clerk :", { email, firstName, lastName });

      if (!email) {
        throw new Error("Clerk n'a pas encore synchronisé l'adresse email de votre compte Google. Veuillez réessayer.");
      }

      let token = null;
      let user = null;

      // Vérification de l'existence de l'utilisateur sur ton backend
      try {
        const data = await getTokenByEmail(email);
        token = data.token;
      } catch (e) {
        console.log("Utilisateur introuvable sur MapApi, tentative d'inscription... :", email);
      }

      // Si le token n'existe pas, on crée le compte sur ton backend
      if (!token) {
        const userInfoForBackend = {
          email,
          first_name: firstName || "Utilisateur",
          last_name: lastName || "Google",
          avatar: avatar,
          address: "",
          phone: "",
          provider: "Google (Clerk)",
        };
        
        await registerOnBackend(userInfoForBackend);
        
        const data = await getTokenByEmail(email);
        token = data.token;
      }

      // 🛠️ CORRECTIF ROBUSTE DU DÉCODAGE DU TOKEN :
      // On extrait la fonction de décodage peu importe la structure d'export du package
      const decodeFn = typeof jwtDecodeModule === 'function' 
        ? jwtDecodeModule 
        : (jwtDecodeModule.jwtDecode || jwtDecodeModule.default);

      if (!decodeFn) {
        throw new Error("Impossible de charger la fonction de décodage JWT.");
      }

      const { user_id } = decodeFn(token);
      user = await read_user(user_id, token); 

      // 🔥 ALIGNEMENT COMPORTEMENTAL AVEC LE FLUX OTP :
      
      // 1. Double sécurité pour l'identifiant utilisateur (attendu par index.js et profil.js)
      if (user && !user.id && user.user_id) {
        user.id = user.user_id; 
      }

      // 2. Enregistrement des tokens au même format structurel que l'OTP { refresh, access }
      await setAuthToken({ refresh: null, access: token });

      // 3. Enregistrement de l'utilisateur finalisé
      await setAuthUser(user); 
      
      console.log("✅ [SUCCESS] Alignement OTP réussi ! User et Token stockés de manière unifiée.");

      return { success: true, token, user };
    } else {
      return { success: false, error: "Étapes supplémentaires Clerk requises" };
    }
  } catch (error) {
    if (error.message?.includes("already signed in") || error.errors?.[0]?.code === "already_signed_in") {
      console.log("Utilisateur déjà connecté sur Clerk. Restauration de session en cours...");
      return { success: true, alreadySignedIn: true };
    }

    console.error("Échec de l'authentification Clerk / Google", error);
    throw error;
  }
}

// --- Fonctions d'aide (Fetch API) ---

async function getTokenByEmail(email) {
  const response = await fetch(`${apiEndPoint}/gettoken_bymail/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error("Erreur token");
  return await response.json();
}

async function read_user(user_id, token) {
  const response = await fetch(`${apiEndPoint}/user/${user_id}/`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}` ,
      // "Content-Type": "application/json"
    }
  });
  if (!response.ok) throw new Error("Erreur lecture user");
  return await response.json();
}

async function registerOnBackend(userInfo) {
  let formdata = new FormData();
  const generatedPassword = Math.random().toString(36).slice(-10);
  formdata.append("password", generatedPassword);
  Object.keys(userInfo).forEach((key) => formdata.append(key, userInfo[key]));

  const response = await fetch(`${apiEndPoint}/register/`, {
    method: "POST",
    body: formdata,
  });
  if (!response.ok) throw new Error("Erreur inscription");
  return await response.json();
}