import { ApiError } from './api/types';

export type ErrorKind = 'offline' | 'timeout' | 'authentication' | 'permission' | 'server' | 'invalid' | 'unknown';

export type ErrorPresentation = {
  kind: ErrorKind;
  titleKey: string;
  messageKey: string;
  retryable: boolean;
};

export function classifyError(error: unknown, isConnected = true): ErrorPresentation {
  if (!isConnected) {
    return { kind: 'offline', titleKey: 'error.offlineTitle', messageKey: 'error.offlineBody', retryable: true };
  }
  if (error instanceof ApiError) {
    if (error.status === 0) return { kind: 'offline', titleKey: 'error.networkTitle', messageKey: 'error.networkBody', retryable: true };
    if (error.status === 408) return { kind: 'timeout', titleKey: 'error.timeoutTitle', messageKey: 'error.timeoutBody', retryable: true };
    if (error.status === 401) return { kind: 'authentication', titleKey: 'error.authTitle', messageKey: 'error.authBody', retryable: false };
    if (error.status === 403) return { kind: 'permission', titleKey: 'error.permissionTitle', messageKey: 'error.permissionBody', retryable: false };
    if (error.status >= 500) return { kind: 'server', titleKey: 'error.serverTitle', messageKey: 'error.serverBody', retryable: true };
    if (error.status === 422 || error.status === 502) return { kind: 'invalid', titleKey: 'error.invalidTitle', messageKey: 'error.invalidBody', retryable: true };
  }
  return { kind: 'unknown', titleKey: 'error.genericTitle', messageKey: 'error.genericBody', retryable: true };
}
