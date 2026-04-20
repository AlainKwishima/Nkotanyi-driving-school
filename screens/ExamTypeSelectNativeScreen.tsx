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
import { hasLanguageAccess } from '../utils/subscriptionAccess';

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
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  } = useAppFlow();
  const { openGateModal } = useGateModal();
  const { insets, tabScrollBottomPad } = useResponsiveLayout();
  const languageAccessGranted = hasLanguageAccess({
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  });

  const handleSelectType = (mode: 'traffic' | 'signs') => {
    if (hasSubscription && !languageAccessGranted) {
      openGateModal('subscription_exam', () =>
        navigation.navigate('SubscriptionNative'),
      );
      return;
    }
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
            style={styles.backTap}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hitamo Ikizamini</Text>
          <HeaderMenu
            navigation={navigation}
            iconColor="#F6F8FE"
            topOffset={56}
            rightOffset={14}
          />
        </View>
        {/* Subtitle strip */}
        <View style={styles.headerSubStrip}>
          <Text style={styles.headerSub}>
            Hitamo ubwoko bw'ikizamini ushaka gukora
          </Text>
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
            <Text style={styles.infoBadgeText}>
              Ikizamini gikubiyemo ibyapa, amategeko n'uburyo bwo gutwara
            </Text>
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
                    Tangira ikizamini
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
            <Text style={styles.hintText}>
              Ikizamini gitangwa mu gihe cy'iminota 30. Ugomba gutunga 60% kugirango utsinde.
            </Text>
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
    paddingHorizontal: 14,
  },
  topRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backTap: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: '#F7F9FE',
  },
  headerSubStrip: {
    paddingBottom: 14,
    alignItems: 'center',
  },
  headerSub: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(246,248,254,0.72)',
    textAlign: 'center',
  },

  body: {
    flex: 1,
    backgroundColor: '#CBD2DE',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },

  infoBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E6EDF9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  infoBadgeText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 17,
    color: '#3A5080',
  },

  card: {
    backgroundColor: '#DDE3EF',
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#1A2744',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardBar: {
    width: 5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    lineHeight: 14,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#222843',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B748C',
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#4A5068',
    marginBottom: 14,
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    lineHeight: 18,
  },

  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  hintText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    lineHeight: 16,
    color: '#7A8499',
  },
});
