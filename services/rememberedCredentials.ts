import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBERED_CREDENTIALS_KEY = 'nkotanyi_remembered_creds';

export type RememberedCredentials = {
  phone: string;
  password: string;
  name?: string;
};

export async function saveRememberedCredentials(creds: RememberedCredentials): Promise<void> {
  try {
    await AsyncStorage.setItem(REMEMBERED_CREDENTIALS_KEY, JSON.stringify(creds));
  } catch (error) {
    console.error('Error saving remembered credentials:', error);
  }
}

export async function loadRememberedCredentials(): Promise<RememberedCredentials | null> {
  try {
    const data = await AsyncStorage.getItem(REMEMBERED_CREDENTIALS_KEY);
    if (!data) return null;
    return JSON.parse(data) as RememberedCredentials;
  } catch (error) {
    console.error('Error loading remembered credentials:', error);
    return null;
  }
}

export async function clearRememberedCredentials(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REMEMBERED_CREDENTIALS_KEY);
  } catch (error) {
    console.error('Error clearing remembered credentials:', error);
  }
}
