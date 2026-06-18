import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';

export type GateModalKind = 'exam_ready' | 'subscription_exam' | 'subscription_read' | 'subscription_watch';

type GateModalContextValue = {
  openGateModal: (kind: GateModalKind, onConfirm: () => void, onCancel?: () => void) => void;
  closeGateModal: () => void;
};

const GateModalContext = createContext<GateModalContextValue | null>(null);

export function GateModalProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [kind, setKind] = useState<GateModalKind>('exam_ready');
  const confirmRef = useRef<(() => void) | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  const animateIn = useCallback(() => {
    fade.setValue(0);
    scale.setValue(0.95);
    translateY.setValue(18);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 8, tension: 90, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [fade, scale, translateY]);

  const animateOut = useCallback((done?: () => void) => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.96, duration: 140, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 10, duration: 140, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setVisible(false);
        done?.();
      }
    });
  }, [fade, scale, translateY]);

  const closeGateModal = useCallback(() => {
    const cancel = cancelRef.current;
    confirmRef.current = null;
    cancelRef.current = null;
    animateOut(() => cancel?.());
  }, [animateOut]);

  const openGateModal = useCallback(
    (nextKind: GateModalKind, onConfirm: () => void, onCancel?: () => void) => {
      confirmRef.current = onConfirm;
      cancelRef.current = onCancel ?? null;
      setKind(nextKind);
      setVisible(true);
      setTimeout(animateIn, 0);
    },
    [animateIn],
  );

  const onConfirm = () => {
    const cb = confirmRef.current;
    confirmRef.current = null;
    cancelRef.current = null;
    animateOut(() => cb?.());
  };

  const config = useMemo(() => {
    if (kind === 'exam_ready') {
      return {
        title: t('gate.examReady.title'),
        message: t('gate.examReady.message'),
        confirmLabel: t('gate.examReady.confirm'),
        isSubscription: false,
      };
    }
    if (kind === 'subscription_read') {
      return {
        title: t('gate.subscription.title'),
        message: t('gate.subscription.read'),
        confirmLabel: t('gate.payNow'),
        isSubscription: true,
      };
    }
    if (kind === 'subscription_watch') {
      return {
        title: t('gate.subscription.title'),
        message: t('gate.subscription.watch'),
        confirmLabel: t('gate.payNow'),
        isSubscription: true,
      };
    }
    return {
      title: t('gate.subscription.title'),
      message: t('gate.subscription.exam'),
      confirmLabel: t('gate.payNow'),
      isSubscription: true,
    };
  }, [kind, t]);

  const value = useMemo(() => ({ openGateModal, closeGateModal }), [closeGateModal, openGateModal]);

  return (
    <GateModalContext.Provider value={value}>
      {children}

      <Modal visible={visible} transparent animationType="none" onRequestClose={closeGateModal}>
        <TouchableWithoutFeedback onPress={closeGateModal}>
          <Animated.View style={[styles.overlay, { opacity: fade }]}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.card, { transform: [{ scale }, { translateY }] }]}>
                <View style={[styles.iconWrap, config.isSubscription ? styles.iconWrapSubscription : styles.iconWrapReady]}>
                  <Ionicons
                    name={config.isSubscription ? 'shield-checkmark-outline' : 'flag-outline'}
                    size={34}
                    color={config.isSubscription ? colors.amber : colors.brand}
                  />
                </View>
                <Text style={styles.eyebrow}>
                  {config.isSubscription ? t('subscription.title') : t('exam.title')}
                </Text>

                <Text style={styles.title}>{config.title}</Text>
                <Text style={styles.message}>{config.message}</Text>

                <TouchableOpacity style={styles.primaryBtn} onPress={onConfirm}>
                  <Text style={styles.primaryText}>{config.confirmLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={closeGateModal}>
                  <Text style={styles.secondaryText}>{t('gate.notNow')}</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </GateModalContext.Provider>
  );
}

export function useGateModal() {
  const ctx = useContext(GateModalContext);
  if (!ctx) {
    throw new Error('useGateModal must be used within GateModalProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,33,58,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.floating,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSubscription: {
    backgroundColor: colors.amberSoft,
  },
  iconWrapReady: {
    backgroundColor: colors.brandSoft,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginTop: spacing.lg,
    color: colors.inkSoft,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.heading,
    marginTop: spacing.xs,
    color: colors.ink,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.sm,
    textAlign: 'center',
    ...typography.body,
    color: colors.inkMuted,
  },
  primaryBtn: {
    marginTop: 22,
    width: '100%',
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.white,
  },
  secondaryText: {
    marginTop: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 24,
    color: colors.brand,
  },
});
