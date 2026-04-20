import type { ContentLanguageCode } from '../context/AppFlowContext';

export type SubscriptionAccessState = {
  hasSubscription: boolean;
  canChangeLanguage: boolean;
  subscriptionLanguage: ContentLanguageCode | null;
  contentLanguage: ContentLanguageCode;
};

export function hasLanguageAccess(state: SubscriptionAccessState): boolean {
  if (!state.hasSubscription) return false;
  if (state.canChangeLanguage) return true;
  return state.subscriptionLanguage != null && state.subscriptionLanguage === state.contentLanguage;
}

