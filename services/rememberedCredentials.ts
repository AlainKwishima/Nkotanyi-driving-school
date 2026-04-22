import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nkotanyi.remembered-credentials.v1';

export type RememberedCredentials = {
  phone: string;
  password: string;
  name?: string;
};

export async function loadRememberedCredentials(): Promise<RememberedCredentials | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RememberedCredentials>;
    if (!parsed.phone || !parsed.password) return null;
    return {
      phone: String(parsed.phone),
      password: String(parsed.password),
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
    };
  } catch {
    return null;
  }
}

export async function saveRememberedCredentials(value: RememberedCredentials): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(value));
}

export async function clearRememberedCredentials(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
