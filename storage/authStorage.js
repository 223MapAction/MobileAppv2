import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_USER_KEY = 'auth_user';
const AUTH_TOKEN_KEY = 'auth_token';
const TERMS_ACCEPTED_KEY = 'terms_accepted';

export async function getAuthUser() {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setAuthUser(user) {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export async function clearAuthUser() {
  await AsyncStorage.removeItem(AUTH_USER_KEY);
}

export async function getAuthToken() {
  const raw = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setAuthToken(tokens) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokens));
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getTermsAccepted() {
  const raw = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
  return raw === 'true';
}

export async function setTermsAccepted(accepted) {
  await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, String(accepted));
}
