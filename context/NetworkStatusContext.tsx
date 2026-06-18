import React, { createContext, useContext, useMemo } from 'react';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';

type NetworkStatusValue = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  refresh: () => Promise<void>;
};

const NetworkStatusContext = createContext<NetworkStatusValue | null>(null);

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const state = useNetInfo();
  const value = useMemo<NetworkStatusValue>(
    () => ({
      isConnected: state.isConnected !== false,
      isInternetReachable: state.isInternetReachable,
      refresh: async () => {
        await NetInfo.refresh();
      },
    }),
    [state.isConnected, state.isInternetReachable],
  );

  return <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>;
}

export function useNetworkStatus() {
  const value = useContext(NetworkStatusContext);
  if (!value) throw new Error('useNetworkStatus must be used within NetworkStatusProvider');
  return value;
}
