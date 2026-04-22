import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { ScreenColumn } from '../components/ScreenColumn';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { useI18n } from '../i18n/useI18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamTypeSelectNative'>;

type ExamType = {
  mode: 'traffic' | 'signs';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor: string;
  badgeText: string;
};

const EXAM_TYPES: ExamType[] = [
  {
    mode: 'traffic',
    title: 'Ibibazo bivanzwe',
    subtitle: 'Mixed Questions',
    description:
      'Ibibazo bigendera ku mategeko y\'umuhanda hamwe n\'ibyapa — ugambiriye amasomo yose.',
    icon: 'file-question-outline',
    accentColor: '#4A78D0',
    badgeText: '40 ibibazo',
  },
  {
    mode: 'signs',
    title: 'Ibyapa gusa',
    subtitle: 'Road Signs Only',
    description:
      'Ibibazo bigendera ku byapa by\'umuhanda gusa — ikizamini giteganijwe n\'ibyapa.',
    icon: 'sign-caution',
    accentColor: '#E07B2D',
    badgeText: '20 ibibazo',
  },
];

export function ExamTypeSelectNativeScreen({ navigation }: Props) {
  const {
    hasSubscription,
    hasUsedFreeTrial,
  } = useAppFlow();
  const { openGateModal } = useGateModal();
  const { insets, tabScrollBottomPad } = useResponsiveLayout();
  const { t } = useI18n();

  const EXAM_TYPES: ExamType[] = [
    {
      mode: 'traffic',
      title: t('examType.mixed.title'),
      subtitle: t('examType.mixed.subtitle'),
      description: t('examType.mixed.desc'),
      icon: 'file-question-outline',
      accentColor: '#4A78D0',
      badgeText: t('examType.mixed.badge'),
    },
    {
      mode: 'signs',
      title: t('examType.signs.title'),
      subtitle: t('examType.signs.subtitle'),
      description: t('examType.signs.desc'),
      icon: 'sign-caution',
      accentColor: '#E07B2D',
      badgeText: t('examType.signs.badge'),
    },
  ];

  const handleSelectType = (mode: 'traffic' | 'signs') => {
    const requiresSubscription = !hasSubscription && hasUsedFreeTrial;
    if (requiresSubscription) {
      openGateModal('subscription_exam', () =>
        navigation.navigate('SubscriptionNative'),
      );
      return;
    }
    navigation.navigate('ExamNative', { mode });
  };

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      {/* Header */}
      <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#F6F8FE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('examType.title')}</Text>
          <View style={styles.headerRight}>
            <HeaderMenu
              navigation={navigation}
              iconColor="#F6F8FE"
              topOffset={56}
              rightOffset={20}
            />
          </View>
        </View>
        {/* Subtitle strip */}
        <View style={styles.headerSubStrip}>
          <Text style={styles.headerSub}>{t('examType.subtitle')}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollPad,
            { paddingBottom: tabScrollBottomPad },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Info badge */}
          <View style={styles.infoBadge}>
            <Ionicons
              name="information-circle-outline"
              size={15}
              color="#4A78D0"
            />
            <Text style={styles.infoBadgeText}>{t('examType.info')}</Text>
          </View>

          {/* Exam type cards */}
          {EXAM_TYPES.map((type) => (
            <TouchableOpacity
              key={type.mode}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => handleSelectType(type.mode)}
            >
              {/* Left accent bar */}
              <View
                style={[styles.cardBar, { backgroundColor: type.accentColor }]}
              />

              <View style={styles.cardContent}>
                {/* Icon + badge row */}
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: type.accentColor + '22' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={type.icon}
                      size={28}
                      color={type.accentColor}
                    />
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: type.accentColor + '22' },
                    ]}
                  >
                    <Text
                      style={[styles.badgeText, { color: type.accentColor }]}
                    >
                      {type.badgeText}
                    </Text>
                  </View>
                </View>

                {/* Titles */}
                <Text style={styles.cardTitle}>{type.title}</Text>
                <Text style={styles.cardSubtitle}>{type.subtitle}</Text>
                <Text style={styles.cardDesc}>{type.description}</Text>

                {/* Start row */}
                <View style={styles.startRow}>
                  <Text
                    style={[styles.startLabel, { color: type.accentColor }]}
                  >
                    {t('examType.start')}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={type.accentColor}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Bottom hint */}
          <View style={styles.hintRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#7A8499" />
            <Text style={styles.hintText}>{t('examType.hint')}</Text>
          </View>
        </ScrollView>
      </View>

      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  headerBlue: {
    backgroundColor: '#4A78D0',
    paddingHorizontal: 20,
  },
  topRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerRight: {
    position: 'absolute',
    right: 0,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    color: '#F7F9FE',
    textAlign: 'center',
  },
  headerSubStrip: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerSub: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: 'rgba(246,248,254,0.8)',
    textAlign: 'center',
  },

  body: {
    flex: 1,
    backgroundColor: '#F3F5FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    marginTop: -20,
  },
  scrollPad: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },

  infoBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 12,
  },
  infoBadgeText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#1E40AF',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  cardBar: {
    width: 6,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 12,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  cardDesc: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 18,
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startLabel: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14,
  },

  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  hintText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#94A3B8',
  },
});
