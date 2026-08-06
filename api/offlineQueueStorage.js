import AsyncStorage from '@react-native-async-storage/async-storage';

export const readJsonArray = async (key) => {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
};

export const writeJsonArray = async (key, array) => {
  await AsyncStorage.setItem(key, JSON.stringify(array));
};
