import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

export type AppTextProps = TextProps & {
  /**
   * Max lines before ellipsis. Defaults to single-line truncation.
   * Pass `null` to allow unlimited wrapping (paragraphs, hints, errors).
   */
  lines?: number | null;
  /** Shrink in flex rows so ellipsis can apply. Enabled by default when truncating. */
  shrink?: boolean;
};

export function AppText({
  lines = 1,
  ellipsizeMode = 'tail',
  shrink,
  style,
  ...rest
}: AppTextProps) {
  const truncates = lines != null && lines > 0;
  const shouldShrink = shrink ?? truncates;

  return (
    <Text
      style={[shouldShrink ? styles.shrink : null, style]}
      {...(truncates ? { numberOfLines: lines, ellipsizeMode } : {})}
      {...rest}
    />
  );
}

/** Use on flex text containers so children can ellipsize horizontally. */
export const shrinkableTextContainer = StyleSheet.create({
  root: {
    flex: 1,
    minWidth: 0,
  },
});

const styles = StyleSheet.create({
  shrink: {
    flexShrink: 1,
    minWidth: 0,
  },
});
