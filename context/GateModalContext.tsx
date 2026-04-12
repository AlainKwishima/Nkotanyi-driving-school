import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useI18n } from '../i18n/useI18n';

export type GateModalKind = 'exam_ready' | 'subscription_exam' | 'subscription_read' | 'subscription_watch';

type GateModalContextValue = {
  openGateModal: (kind: GateModalKind, onConfirm: () => void, onCancel?: () => void) => void;
  closeGateModal: () => void;
};

const GateModalContext = createContext<GateModalContextValue | null>(null);

export function GateModalProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
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
                {config.isSubscription ? (
                  <Image source={require('../assets/Group.png')} style={styles.illustration} resizeMode="contain" />
                ) : (
                  <View style={styles.readyIconWrap}>
                    <Image source={require('../assets/Group.png')} style={styles.illustrationReady} resizeMode="contain" />
                  </View>
                )}

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
    backgroundColor: 'rgba(68,75,92,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 10,
    backgroundColor: '#F4F4F6',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    alignItems: 'center',
  },
  illustration: { width: 205, height: 140, marginTop: 4 },
  readyIconWrap: { width: 205, height: 140, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  illustrationReady: { width: 180, height: 120, opacity: 0.92 },
  title: {
    marginTop: 12,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 22,
    lineHeight: 29,
    color: '#20222C',
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: '#4E4C63',
  },
  primaryBtn: {
    marginTop: 22,
    width: '100%',
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 6,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 17,
    lineHeight: 24,
    color: '#F7F9FE',
  },
  secondaryText: {
    marginTop: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    lineHeight: 24,
    color: '#4A78D0',
  },
});
