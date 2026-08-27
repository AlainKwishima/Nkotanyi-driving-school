import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const memoryFallback = new Map<string, string>();

async function secureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function setSecureValue(key: string, value: string): Promise<void> {
  if (await secureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    memoryFallback.delete(key);
    return;
  }
  // Web/dev fallback is intentionally memory-only so sensitive data is never
  // persisted in AsyncStorage or localStorage when native secure storage is unavailable.
  memoryFallback.set(key, value);
}

export async function getSecureValue(key: string): Promise<string | null> {
  if (await secureStoreAvailable()) {
    return SecureStore.getItemAsync(key);
  }
  return memoryFallback.get(key) ?? null;
}

export async function deleteSecureValue(key: string): Promise<void> {
  memoryFallback.delete(key);
  if (await secureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function setSecureJson<T>(key: string, value: T): Promise<void> {
  await setSecureValue(key, JSON.stringify(value));
}

export async function getSecureJson<T>(key: string): Promise<T | null> {
  const raw = await getSecureValue(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function clearLegacyAsyncStorageKeys(...keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => AsyncStorage.removeItem(key).catch(() => undefined)));
}
