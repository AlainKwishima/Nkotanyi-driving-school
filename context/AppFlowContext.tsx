import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppFlowState = {
  hasChosenLanguage: boolean;
  isSignedIn: boolean;
  hasUsedFreeTrial: boolean;
  hasSubscription: boolean;
};

type AppFlowContextValue = AppFlowState & {
  hydrated: boolean;
  setLanguageChosen: (chosen: boolean) => Promise<void>;
  setSignedIn: (signedIn: boolean) => Promise<void>;
  setHasUsedFreeTrial: (used: boolean) => Promise<void>;
  setHasSubscription: (subscribed: boolean) => Promise<void>;
  resetFlow: () => Promise<void>;
};

const STORAGE_KEY = 'nkotanyi.app.flow.v1';

const defaultState: AppFlowState = {
  hasChosenLanguage: false,
  isSignedIn: false,
  hasUsedFreeTrial: false,
  hasSubscription: false,
};

const AppFlowContext = createContext<AppFlowContextValue | null>(null);

export function AppFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppFlowState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppFlowState>;
          setState({
            hasChosenLanguage: Boolean(parsed.hasChosenLanguage),
            isSignedIn: Boolean(parsed.isSignedIn),
            hasUsedFreeTrial: Boolean(parsed.hasUsedFreeTrial),
            hasSubscription: Boolean(parsed.hasSubscription),
          });
        }
      } finally {
        setHydrated(true);
      }
    };
    void hydrate();
  }, []);

  const persist = async (next: AppFlowState) => {
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const value = useMemo<AppFlowContextValue>(
    () => ({
      ...state,
      hydrated,
      setLanguageChosen: async (chosen) => persist({ ...state, hasChosenLanguage: chosen }),
      setSignedIn: async (signedIn) => persist({ ...state, isSignedIn: signedIn }),
      setHasUsedFreeTrial: async (used) => persist({ ...state, hasUsedFreeTrial: used }),
      setHasSubscription: async (subscribed) => persist({ ...state, hasSubscription: subscribed }),
      resetFlow: async () => {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setState(defaultState);
      },
    }),
    [hydrated, state],
  );

  return <AppFlowContext.Provider value={value}>{children}</AppFlowContext.Provider>;
}

export function useAppFlow() {
  const ctx = useContext(AppFlowContext);
  if (!ctx) {
    throw new Error('useAppFlow must be used within AppFlowProvider');
  }
  return ctx;
}
