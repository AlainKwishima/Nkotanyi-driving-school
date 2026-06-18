import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { ScreenColumn } from '../components/ScreenColumn';
import { BottomNavBar } from '../components/BottomNavBar';
import { AppHeader } from '../components/AppHeader';
import { EmptyState, InlineErrorState, LoadingState } from '../components/RequestStates';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth } from '../context/AuthContext';
import { useGateModal } from '../context/GateModalContext';
import { useI18n } from '../i18n/useI18n';
import { ApiError } from '../services/api/types';
import {
  getRoadSigns,
  markRoadSignViewed,
  type RoadSignStudyItem,
  type RoadSignsProgress,
} from '../services/roadSignsApi';
import { hasLanguageAccess } from '../utils/subscriptionAccess';
import { colors, radii, spacing, typography } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RoadSignsNative'>;

function getRoadSignsLoadMessage(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return t('roadsigns.loadAuthError');
    if (err.status === 404) return t('roadsigns.loadMissingError');
    if (err.status === 408 || err.status === 0) return t('roadsigns.loadTimeoutError');
    if (err.status === 502) return t('roadsigns.loadInvalidError');
  }
  return t('roadsigns.loadError');
}

function RoadSignCard({
  item,
  imageFailed,
  onImageError,
  onPress,
}: {
  item: RoadSignStudyItem;
  imageFailed: boolean;
  onImageError: () => void;
  onPress: () => void;
}) {
  const { t } = useI18n();

  return (
    <TouchableOpacity style={styles.signCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.signThumb}>
        {imageFailed ? (
          <View style={styles.gridImageError}>
            <Ionicons name="image-outline" size={24} color={colors.inkSoft} />
          </View>
        ) : (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.gridImage}
            resizeMode="contain"
            onError={onImageError}
            accessibilityLabel={item.name}
          />
        )}
      </View>
      <View style={styles.signCardCopy}>
        <Text style={styles.signCardTitle} numberOfLines={2}>{item.name}</Text>
        <View style={styles.signMetaRow}>
          <View style={[styles.viewedBadge, item.viewed ? styles.viewedBadgeDone : styles.viewedBadgeTodo]}>
            <Ionicons
              name={item.viewed ? 'checkmark-circle' : 'ellipse-outline'}
              size={12}
              color={item.viewed ? colors.success : colors.brand}
            />
            <Text style={[styles.viewedText, item.viewed ? styles.viewedTextDone : styles.viewedTextTodo]}>
              {item.viewed ? t('roadsigns.viewed') : t('roadsigns.studyLabel')}
            </Text>
          </View>
          <Text style={styles.viewDetailsText}>{t('roadsigns.viewDetails')}</Text>
        </View>
      </View>
      <View style={styles.cardArrow}>
        <Ionicons name="arrow-forward" size={18} color={colors.inkMuted} />
      </View>
    </TouchableOpacity>
  );
}

function RoadSignDetailModal({
  visible,
  item,
  current,
  total,
  imageFailed,
  onClose,
  onImageError,
  onPrevious,
  onNext,
}: {
  visible: boolean;
  item: RoadSignStudyItem | null;
  current: number;
  total: number;
  imageFailed: boolean;
  onClose: () => void;
  onImageError: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { t } = useI18n();
  if (!item) return null;
  const canGoPrevious = current > 1;
  const canGoNext = current < total;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.detailSheet}>
          <View style={styles.detailHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel={t('common.cancel')}>
              <Ionicons name="close" size={22} color={colors.inkMuted} />
            </TouchableOpacity>
            <Text style={styles.detailCounter}>{t('roadsigns.positionShort', { current, total })}</Text>
            <View style={styles.closeButtonSpacer} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
            <View style={styles.detailBadgeRow}>
              <Text style={styles.detailEyebrow}>{t('roadsigns.studyLabel')}</Text>
              {item.viewed ? (
                <View style={styles.detailViewedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.detailViewedText}>{t('roadsigns.viewed')}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.detailTitle}>{item.name}</Text>

            <View style={styles.detailImageFrame}>
              {imageFailed ? (
                <View style={styles.detailImageError}>
                  <Ionicons name="image-outline" size={34} color={colors.inkSoft} />
                  <Text style={styles.imageErrorText}>{t('roadsigns.imageError')}</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.detailImage}
                  resizeMode="contain"
                  onError={onImageError}
                  accessibilityLabel={item.name}
                />
              )}
            </View>

            <View style={styles.descriptionCard}>
              <Text style={styles.meaningLabel}>{t('roadsigns.meaning')}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.floatingNavButton, styles.floatingNavLeft, !canGoPrevious && styles.floatingNavDisabled]}
            onPress={onPrevious}
            disabled={!canGoPrevious}
            accessibilityLabel={t('roadsigns.previous')}
          >
            <Ionicons name="chevron-back" size={24} color={canGoPrevious ? colors.brand : colors.inkSoft} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingNavButton, styles.floatingNavRight, !canGoNext && styles.floatingNavDisabled]}
            onPress={onNext}
            disabled={!canGoNext}
            accessibilityLabel={t('roadsigns.next')}
          >
            <Ionicons name="chevron-forward" size={24} color={canGoNext ? colors.brand : colors.inkSoft} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function RoadSignsNativeScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { accessToken } = useAuth();
  const { openGateModal } = useGateModal();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const {
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
    isSigningOut,
  } = useAppFlow();

  const markedViewedRef = useRef(new Set<string>());
  const [signs, setSigns] = useState<RoadSignStudyItem[]>([]);
  const [progress, setProgress] = useState<RoadSignsProgress>({ viewed: 0, total: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [usedFallback, setUsedFallback] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState<typeof contentLanguage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const languageAccessGranted = hasLanguageAccess({
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  });

  useEffect(() => {
    if (!languageAccessGranted && !isSigningOut) {
      openGateModal('subscription_read', () => navigation.navigate('SubscriptionNative'));
    }
  }, [isSigningOut, languageAccessGranted, navigation, openGateModal]);

  const loadSigns = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      setError(t('exam.needSignIn'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getRoadSigns(
        accessToken,
        contentLanguage,
        subscriptionLanguage && subscriptionLanguage !== contentLanguage ? [subscriptionLanguage] : [],
      );
      setSigns(result.items);
      setProgress(result.progress);
      setUsedFallback(result.usedFallback);
      setSourceLanguage(result.language);
      setSelectedIndex(null);
      setFailedImages({});
      markedViewedRef.current.clear();
    } catch (err) {
      if (__DEV__) console.warn('[RoadSigns] study content load failed', err);
      setSigns([]);
      setProgress({ viewed: 0, total: 0 });
      setUsedFallback(false);
      setSourceLanguage(null);
      setError(getRoadSignsLoadMessage(err, t));
    } finally {
      setLoading(false);
    }
  }, [accessToken, contentLanguage, subscriptionLanguage, t]);

  useEffect(() => {
    if (!languageAccessGranted || isSigningOut) {
      setLoading(false);
      return;
    }
    void loadSigns();
  }, [isSigningOut, languageAccessGranted, loadSigns]);

  const markViewed = useCallback(
    (item: RoadSignStudyItem | undefined) => {
      if (!accessToken || !item || item.viewed || markedViewedRef.current.has(item.id)) return;
      markedViewedRef.current.add(item.id);
      setSigns((current) => current.map((sign) => (sign.id === item.id ? { ...sign, viewed: true } : sign)));
      setProgress((current) => ({
        viewed: Math.min(current.viewed + 1, current.total || signs.length),
        total: current.total || signs.length,
      }));
      void markRoadSignViewed(accessToken, item.id).catch(() => {
        markedViewedRef.current.delete(item.id);
      });
    },
    [accessToken, signs.length],
  );

  const openSign = useCallback(
    (index: number) => {
      if (index < 0 || index >= signs.length) return;
      setSelectedIndex(index);
      markViewed(signs[index]);
    },
    [markViewed, signs],
  );

  const goToDetailIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= signs.length) return;
      setSelectedIndex(index);
      markViewed(signs[index]);
    },
    [markViewed, signs],
  );

  const languageLabel = t(`profile.lang.${contentLanguage}`);
  const sourceLanguageLabel = sourceLanguage ? t(`profile.lang.${sourceLanguage}`) : languageLabel;
  const selectedSign = selectedIndex === null ? null : signs[selectedIndex] ?? null;

  return (
    <ScreenColumn>
      <AppHeader title={t('reading.roadSigns')} navigation={navigation} onBack={() => navigation.goBack()} />

      <View style={[styles.body, { paddingBottom: tabScrollBottomPad }]}>
        {!languageAccessGranted || isSigningOut ? (
          <LoadingState message={t('roadsigns.checkingAccess')} />
        ) : loading ? (
          <LoadingState message={t('roadsigns.loading')} />
        ) : error ? (
          <InlineErrorState title={t('roadsigns.errorTitle')} message={error} onRetry={() => void loadSigns()} />
        ) : signs.length === 0 ? (
          <EmptyState title={t('roadsigns.emptyTitle')} message={t('roadsigns.emptyBody')} />
        ) : (
          <>
            <FlatList
              data={signs}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.gridContent, { paddingBottom: tabScrollBottomPad + spacing.xl }]}
              ListHeaderComponent={
                <View style={styles.gridHeader}>
                  <View style={styles.gridHeaderRow}>
                    <View>
                      <Text style={styles.positionText}>
                        {t('roadsigns.signCount', {
                          count: signs.length,
                          label: signs.length === 1 ? t('roadsigns.signSingular') : t('roadsigns.signPlural'),
                        })}
                      </Text>
                      <Text style={styles.progressText}>
                        {t('roadsigns.progress', { viewed: progress.viewed, total: progress.total || signs.length })}
                      </Text>
                    </View>
                    <View style={styles.languagePill}>
                      <Ionicons name="language-outline" size={14} color={colors.brandStrong} />
                      <Text style={styles.languagePillText}>{sourceLanguageLabel}</Text>
                    </View>
                  </View>

                  {usedFallback ? (
                    <Text style={styles.fallbackNotice}>
                      {t('roadsigns.languageFallback', {
                        requested: languageLabel,
                        available: sourceLanguageLabel,
                      })}
                    </Text>
                  ) : null}
                </View>
              }
              renderItem={({ item, index }) => (
                <RoadSignCard
                  item={item}
                  imageFailed={failedImages[item.id] === true}
                  onImageError={() => setFailedImages((current) => ({ ...current, [item.id]: true }))}
                  onPress={() => openSign(index)}
                />
              )}
            />

            <RoadSignDetailModal
              visible={selectedSign !== null}
              item={selectedSign}
              current={(selectedIndex ?? 0) + 1}
              total={signs.length}
              imageFailed={selectedSign ? failedImages[selectedSign.id] === true : false}
              onClose={() => setSelectedIndex(null)}
              onImageError={() => {
                if (!selectedSign) return;
                setFailedImages((current) => ({ ...current, [selectedSign.id]: true }));
              }}
              onPrevious={() => goToDetailIndex((selectedIndex ?? 0) - 1)}
              onNext={() => goToDetailIndex((selectedIndex ?? 0) + 1)}
            />
          </>
        )}
      </View>

      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  gridContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  gridHeader: {
    marginBottom: spacing.lg,
  },
  gridHeaderRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  positionText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
    color: colors.brand,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  progressText: {
    marginTop: 3,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: colors.inkMuted,
  },
  languagePill: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brandSoft,
  },
  languagePillText: {
    ...typography.caption,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.brandStrong,
  },
  fallbackNotice: {
    marginTop: spacing.sm,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 18,
    color: colors.brandStrong,
  },
  gridRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  signCard: {
    flex: 1,
    minHeight: 206,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  signThumb: {
    height: 104,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#F1DFC3',
  },
  gridImage: {
    width: '92%',
    height: '92%',
  },
  gridImageError: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  signCardCopy: {
    flex: 1,
    marginTop: spacing.md,
  },
  signCardTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  signMetaRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  viewedBadge: {
    alignSelf: 'flex-start',
    minHeight: 24,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewedBadgeDone: {
    backgroundColor: colors.successSoft,
  },
  viewedBadgeTodo: {
    backgroundColor: colors.brandSoft,
  },
  viewedText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
  },
  viewedTextDone: {
    color: colors.success,
  },
  viewedTextTodo: {
    color: colors.brand,
  },
  viewDetailsText: {
    ...typography.caption,
    color: colors.brand,
  },
  cardArrow: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  modalBackdrop: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    backgroundColor: 'rgba(23, 34, 56, 0.46)',
  },
  detailSheet: {
    maxHeight: '86%',
    borderRadius: 18,
    backgroundColor: colors.surface,
    overflow: 'visible',
  },
  detailHeader: {
    height: 52,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonSpacer: {
    width: 40,
    height: 40,
  },
  detailCounter: {
    ...typography.bodyStrong,
    color: colors.inkMuted,
  },
  detailContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailEyebrow: {
    ...typography.eyebrow,
    color: colors.brand,
    textTransform: 'uppercase',
  },
  detailViewedBadge: {
    minHeight: 24,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
  },
  detailViewedText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    color: colors.success,
  },
  detailTitle: {
    marginTop: spacing.sm,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    lineHeight: 27,
    color: colors.ink,
  },
  detailImageFrame: {
    height: 260,
    marginTop: spacing.md,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1DFC3',
    backgroundColor: '#FFF9EF',
  },
  detailImage: {
    width: '92%',
    height: '92%',
  },
  detailImageError: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  imageErrorText: {
    marginTop: spacing.sm,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  descriptionCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  meaningLabel: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 10,
    color: colors.brand,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  description: {
    marginTop: spacing.sm,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  floatingNavButton: {
    position: 'absolute',
    top: '45%',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  floatingNavLeft: {
    left: -16,
  },
  floatingNavRight: {
    right: -16,
  },
  floatingNavDisabled: {
    opacity: 0.45,
  },
});
