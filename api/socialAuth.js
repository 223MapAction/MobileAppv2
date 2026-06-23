import * as WebBrowser from "expo-web-browser";
import * as jwtDecodeModule from "jwt-decode";
import { apiEndPoint } from "../api/apiUrl";
import { setAuthToken, setAuthUser } from "../storage/authStorage";

WebBrowser.maybeCompleteAuthSession();

export async function handleGoogleAuthWithClerk(startOAuthFlow, clerkInstance) {
  try {
    const { createdSessionId, setActive, signIn, signUp } = await startOAuthFlow();

    if (createdSessionId) {
      let email = "";
      let firstName = "";
      let lastName = "";

      if (signUp) {
        email = signUp.emailAddress;
        firstName = signUp.firstName;
        lastName = signUp.lastName;
      }

      if (!email && signIn) {
        email = signIn.identifier; 
        if (signIn.currentFirstFactorVerification?.externalVerificationRedirectUrl) {
          firstName = signIn.userData?.firstName;
          lastName = signIn.userData?.lastName;
        }
      }

      if (!email) {
        await setActive({ session: createdSessionId });
        await new Promise(resolve => setTimeout(resolve, 80));

        const currentUser = clerkInstance?.user || clerkInstance?.client?.activeSession?.user;
        if (currentUser) {
          email = currentUser.primaryEmailAddress?.emailAddress;
          firstName = currentUser.firstName;
          lastName = currentUser.lastName;
        }
      }

      if (!email) {
        throw new Error("Clerk email synchronization failed.");
      }

      let token = null;
      let user = null;

      try {
        const data = await getTokenByEmail(email);
        token = data.token;
      } catch (e) {
        // L'utilisateur n'existe pas encore sur l'API backend, traitement normal
      }

      if (!token) {
        const userInfoForBackend = {
          email,
          first_name: firstName || "Utilisateur",
          last_name: lastName || "Google",
          address: "",
          phone: "",
          provider: "Google (Clerk)",
        };
        
        await registerOnBackend(userInfoForBackend);
        const data = await getTokenByEmail(email);
        token = data.token;
      }

      const decodeFn = typeof jwtDecodeModule === 'function' 
        ? jwtDecodeModule 
        : (jwtDecodeModule.jwtDecode || jwtDecodeModule.default);

      if (!decodeFn) {
        throw new Error("JWT decoding library unavailable.");
      }

      const { user_id } = decodeFn(token);
      user = await read_user(user_id, token); 

      if (user && !user.id && user.user_id) {
        user.id = user.user_id; 
      }

      await Promise.all([
        setAuthToken({ refresh: null, access: token }),
        setAuthUser(user)
      ]);
      
      if (!clerkInstance?.user) {
        await setActive({ session: createdSessionId });
      }

      return { success: true, token, user };
    } else {
      return { success: false, error: "Additional steps required" };
    }
  } catch (error) {
    if (error.message?.includes("already signed in") || error.errors?.[0]?.code === "already_signed_in") {
      return { success: true, alreadySignedIn: true };
    }
    throw error;
  }
}

// --- Fonctions API Helpers ---
async function getTokenByEmail(email) {
  const response = await fetch(`${apiEndPoint}/gettoken_bymail/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error("Token retrieval failed");
  return await response.json();
}

async function read_user(user_id, token) {
  const response = await fetch(`${apiEndPoint}/user/${user_id}/`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("User profile retrieval failed");
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

  if (!response.ok) {
    throw new Error(`Registration failed with status: ${response.status}`);
  }

  return await response.json();
}