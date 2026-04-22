import type { ContentLanguageCode } from '../context/AppFlowContext';

export type SubscriptionAccessState = {
  hasSubscription: boolean;
  canChangeLanguage?: boolean;
  subscriptionLanguage: ContentLanguageCode | null;
  contentLanguage: ContentLanguageCode;
};

export function hasLanguageAccess(state: SubscriptionAccessState): boolean {
  if (!state.hasSubscription) return false;
  if (state.canChangeLanguage) return true;
  return state.subscriptionLanguage != null && state.subscriptionLanguage === state.contentLanguage;
}

/**
 * Exams should always follow the language attached to the active subscription.
 * When we cannot resolve a subscription language, fall back to the app language
 * rather than defaulting to Kinyarwanda.
 */
export function resolveExamLanguage(state: SubscriptionAccessState): ContentLanguageCode {
  if (state.hasSubscription && state.subscriptionLanguage) {
    return state.subscriptionLanguage;
  }
  return state.contentLanguage;
}
