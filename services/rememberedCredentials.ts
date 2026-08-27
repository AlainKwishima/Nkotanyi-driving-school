import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearLegacyAsyncStorageKeys } from './secureStorage';

const REMEMBERED_CREDENTIALS_KEY = 'nkotanyi_remembered_creds';

export type RememberedCredentials = {
  phone: string;
  name?: string;
  /** Deprecated legacy field. Never save or use this value. */
  password?: string;
};

export async function saveRememberedCredentials(creds: RememberedCredentials): Promise<void> {
  try {
    const safeValue = {
      phone: creds.phone.trim(),
      ...(creds.name ? { name: creds.name.trim() } : {}),
    };
    await AsyncStorage.setItem(REMEMBERED_CREDENTIALS_KEY, JSON.stringify(safeValue));
  } catch (error) {
    console.error('Error saving remembered credentials:', error);
  }
}

export async function loadRememberedCredentials(): Promise<RememberedCredentials | null> {
  try {
    const data = await AsyncStorage.getItem(REMEMBERED_CREDENTIALS_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as RememberedCredentials;
    if (parsed.password) {
      // Remove pre-secure-storage records that persisted raw passwords.
      await saveRememberedCredentials({ phone: parsed.phone, name: parsed.name });
    }
    return {
      phone: parsed.phone,
      name: parsed.name,
    };
  } catch (error) {
    console.error('Error loading remembered credentials:', error);
    return null;
  }
}

export async function clearRememberedCredentials(): Promise<void> {
  try {
    await clearLegacyAsyncStorageKeys(REMEMBERED_CREDENTIALS_KEY);
  } catch (error) {
    console.error('Error clearing remembered credentials:', error);
  }
}
