import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_USER_KEY = 'auth_user';

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
