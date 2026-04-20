import React, { useEffect, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { RootStackParamList } from '../navigation/types';
import { hasLanguageAccess } from '../utils/subscriptionAccess';

type Props = NativeStackScreenProps<RootStackParamList, 'StartExamNative'>;

export function StartExamNativeScreen({ navigation, route }: Props) {
  const openedRef = useRef(false);
  const {
    hasSubscription,
    hasUsedFreeTrial,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  } = useAppFlow();
  const { openGateModal } = useGateModal();
  const languageAccessGranted = hasLanguageAccess({
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  });

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;

    const gateFor = route.params?.gateFor ?? 'exam';
    const requiresSubscription =
      gateFor === 'exam'
        ? (!hasSubscription && hasUsedFreeTrial) || (hasSubscription && !languageAccessGranted)
        : !languageAccessGranted;

    const kind =
      gateFor === 'read'
        ? 'subscription_read'
        : gateFor === 'watch'
          ? 'subscription_watch'
          : requiresSubscription
            ? 'subscription_exam'
            : 'exam_ready';

    openGateModal(
      kind,
      () => {
        if (kind === 'subscription_exam' || kind === 'subscription_read' || kind === 'subscription_watch') {
          navigation.replace('SubscriptionNative');
          return;
        }
        if (gateFor === 'read') {
          navigation.replace('ReadingNative');
          return;
        }
        if (gateFor === 'watch') {
          navigation.replace('VideoCourseList');
          return;
        }
        navigation.replace('ExamInstructionsNative');
      },
      () => navigation.goBack(),
    );
  }, [hasSubscription, hasUsedFreeTrial, languageAccessGranted, navigation, openGateModal, route.params?.gateFor]);

  return <View style={styles.blank} />;
}

const styles = StyleSheet.create({
  blank: {
    flex: 1,
    backgroundColor: '#00000000',
  },
});
