import { useCallback, useMemo } from 'react';

import { useAppFlow } from '../context/AppFlowContext';
import type { ContentLanguageCode } from '../context/AppFlowContext';
import { dictionaries } from './dictionaries';

/**
 * Replace `{name}`-style placeholders in translated strings.
 */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function useI18n() {
  const { contentLanguage } = useAppFlow();
  const lang: ContentLanguageCode = contentLanguage;

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const dict = dictionaries[lang] ?? dictionaries.en;
      const fallback = dictionaries.en[key];
      const raw = dict[key] ?? fallback ?? key;
      return interpolate(raw, vars);
    },
    [lang],
  );

  return useMemo(() => ({ t, lang }), [t, lang]);
}
