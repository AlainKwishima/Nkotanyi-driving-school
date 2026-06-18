import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';
import { useI18n } from '../i18n/useI18n';

type State = { failed: boolean };
type Labels = { title: string; message: string; retry: string };

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; labels: Labels },
  State
> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={styles.root}>
        <Text style={styles.title}>{this.props.labels.title}</Text>
        <Text style={styles.message}>{this.props.labels.message}</Text>
        <TouchableOpacity style={styles.button} onPress={() => this.setState({ failed: false })}>
          <Text style={styles.buttonText}>{this.props.labels.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export function FullScreenErrorBoundary({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <ErrorBoundary
      labels={{
        title: t('error.genericTitle'),
        message: t('error.genericBody'),
        retry: t('common.retry'),
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  title: {
    ...typography.heading,
    color: colors.ink,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  button: {
    minHeight: 48,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  buttonText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});
