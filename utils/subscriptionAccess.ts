import type { ContentLanguageCode } from '../context/AppFlowContext';

export type SubscriptionAccessState = {
  hasSubscription: boolean;
  canChangeLanguage?: boolean;
  subscriptionLanguage: ContentLanguageCode | null;
  contentLanguage: ContentLanguageCode;
};

export function hasLanguageAccess(state: SubscriptionAccessState): boolean {
  return state.hasSubscription && resolvePaidContentLanguage(state) != null;
}

/**
 * Premium learning resources are licensed by the subscription language, not by
 * the currently selected interface language.
 */
export function resolvePaidContentLanguage(state: SubscriptionAccessState): ContentLanguageCode | null {
  if (!state.hasSubscription) return null;
  return state.subscriptionLanguage;
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
