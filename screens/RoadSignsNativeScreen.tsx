import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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

function RoadSignsHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { insets } = useResponsiveLayout();

  return (
    <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.headerLeft} activeOpacity={0.7} hitSlop={15}>
          <Ionicons name="chevron-back" size={28} color="#F6F8FE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerRight} />
      </View>
    </View>
  );
}

function RoadSignSlide({
  item,
  width,
  imageFailed,
  onImageError,
}: {
  item: RoadSignStudyItem;
  width: number;
  imageFailed: boolean;
  onImageError: () => void;
}) {
  const { t } = useI18n();

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.studyCard}>
        <View style={styles.studyLabelRow}>
          <Text style={styles.studyLabel}>{t('roadsigns.studyLabel')}</Text>
          {item.viewed ? (
            <View style={styles.viewedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#16724C" />
              <Text style={styles.viewedText}>{t('roadsigns.viewed')}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.signTitle}>{item.name}</Text>

        <View style={styles.imageStage}>
          {imageFailed ? (
            <View style={styles.imageError}>
              <Ionicons name="image-outline" size={36} color="#94A3B8" />
              <Text style={styles.imageErrorText}>{t('roadsigns.imageError')}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.signImage}
              resizeMode="contain"
              onError={onImageError}
              accessibilityLabel={item.name}
            />
          )}
        </View>

        <ScrollView
          style={styles.meaningScroll}
          contentContainerStyle={styles.meaningContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <Text style={styles.meaningLabel}>{t('roadsigns.meaning')}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </ScrollView>
      </View>
    </View>
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

  const listRef = useRef<FlatList<RoadSignStudyItem>>(null);
  const markedViewedRef = useRef(new Set<string>());
  const [signs, setSigns] = useState<RoadSignStudyItem[]>([]);
  const [progress, setProgress] = useState<RoadSignsProgress>({ viewed: 0, total: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
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
      const result = await getRoadSigns(accessToken, contentLanguage);
      setSigns(result.items);
      setProgress(result.progress);
      setCurrentIndex(0);
      setFailedImages({});
      markedViewedRef.current.clear();
      requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: false }));
    } catch (err) {
      if (__DEV__) console.warn('[RoadSigns] study content load failed', err);
      setSigns([]);
      setProgress({ viewed: 0, total: 0 });
      setError(getRoadSignsLoadMessage(err, t));
    } finally {
      setLoading(false);
    }
  }, [accessToken, contentLanguage, t]);

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

  useEffect(() => {
    if (signs.length > 0) markViewed(signs[currentIndex]);
  }, [currentIndex, markViewed, signs]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= signs.length || carouselWidth <= 0) return;
      listRef.current?.scrollToOffset({ offset: index * carouselWidth, animated: true });
      setCurrentIndex(index);
    },
    [carouselWidth, signs.length],
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (carouselWidth <= 0) return;
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
      setCurrentIndex(Math.max(0, Math.min(nextIndex, signs.length - 1)));
    },
    [carouselWidth, signs.length],
  );

  const currentPosition = signs.length > 0 ? currentIndex + 1 : 0;
  const progressWidth: `${number}%` =
    signs.length > 0 ? `${(currentPosition / signs.length) * 100}%` : '0%';

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <RoadSignsHeader title={t('reading.roadSigns')} onBack={() => navigation.goBack()} />

      <View style={[styles.body, { paddingBottom: tabScrollBottomPad }]}>
        {!languageAccessGranted || isSigningOut ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#4A78D0" />
            <Text style={styles.statusText}>{t('roadsigns.checkingAccess')}</Text>
          </View>
        ) : loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#4A78D0" />
            <Text style={styles.statusText}>{t('roadsigns.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerWrap}>
            <Ionicons name="cloud-offline-outline" size={42} color="#94A3B8" />
            <Text style={styles.errorTitle}>{t('roadsigns.errorTitle')}</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadSigns()} activeOpacity={0.85}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryText}>{t('roadsigns.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : signs.length === 0 ? (
          <View style={styles.centerWrap}>
            <Ionicons name="albums-outline" size={42} color="#94A3B8" />
            <Text style={styles.errorTitle}>{t('roadsigns.emptyTitle')}</Text>
            <Text style={styles.errorText}>{t('roadsigns.emptyBody')}</Text>
          </View>
        ) : (
          <View
            style={styles.carouselViewport}
            onLayout={(event) => setCarouselWidth(event.nativeEvent.layout.width)}
          >
            <View style={styles.carouselMeta}>
              <View>
                <Text style={styles.positionText}>
                  {t('roadsigns.position', { current: currentPosition, total: signs.length })}
                </Text>
                <Text style={styles.progressText}>
                  {t('roadsigns.progress', { viewed: progress.viewed, total: progress.total || signs.length })}
                </Text>
              </View>
              <Text style={styles.swipeHint}>{t('roadsigns.swipeHint')}</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            {carouselWidth > 0 ? (
              <FlatList
                ref={listRef}
                style={styles.carouselList}
                data={signs}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}
                getItemLayout={(_, index) => ({
                  length: carouselWidth,
                  offset: carouselWidth * index,
                  index,
                })}
                renderItem={({ item }) => (
                  <RoadSignSlide
                    item={item}
                    width={carouselWidth}
                    imageFailed={failedImages[item.id] === true}
                    onImageError={() => setFailedImages((current) => ({ ...current, [item.id]: true }))}
                  />
                )}
              />
            ) : null}

            <View style={styles.carouselControls}>
              <TouchableOpacity
                style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
                onPress={() => goToIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                accessibilityLabel={t('roadsigns.previous')}
              >
                <Ionicons name="arrow-back" size={20} color={currentIndex === 0 ? '#AAB6C8' : '#315FAE'} />
                <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
                  {t('roadsigns.previous')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, currentIndex === signs.length - 1 && styles.navButtonDisabled]}
                onPress={() => goToIndex(currentIndex + 1)}
                disabled={currentIndex === signs.length - 1}
                accessibilityLabel={t('roadsigns.next')}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    currentIndex === signs.length - 1 && styles.navButtonTextDisabled,
                  ]}
                >
                  {t('roadsigns.next')}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={currentIndex === signs.length - 1 ? '#AAB6C8' : '#315FAE'}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  headerBlue: {
    backgroundColor: '#4A78D0',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    width: 44,
    height: 44,
  },
  headerTitle: {
    maxWidth: '72%',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    color: '#F8FAFF',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    marginTop: -20,
    overflow: 'hidden',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#F3F5FA',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  statusText: {
    marginTop: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#64748B',
  },
  errorTitle: {
    marginTop: 16,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    color: '#25334A',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 46,
    marginTop: 22,
    paddingHorizontal: 22,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4A78D0',
  },
  retryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  carouselViewport: {
    flex: 1,
    paddingTop: 24,
  },
  carouselMeta: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  positionText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
    color: '#315FAE',
    letterSpacing: 0.4,
  },
  progressText: {
    marginTop: 3,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    color: '#7A8BA5',
  },
  swipeHint: {
    flexShrink: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    color: '#7A8BA5',
    textAlign: 'right',
  },
  progressTrack: {
    height: 4,
    marginTop: 12,
    marginHorizontal: 22,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: '#DDE5F2',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#4A78D0',
  },
  slide: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  carouselList: {
    flex: 1,
  },
  studyCard: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#E6EBF3',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A2B49',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  studyLabelRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  studyLabel: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 10,
    color: '#B07121',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  viewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F6EF',
  },
  viewedText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    color: '#16724C',
  },
  signTitle: {
    marginTop: 7,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    lineHeight: 27,
    color: '#172238',
  },
  imageStage: {
    flex: 1,
    minHeight: 180,
    maxHeight: 320,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1DFC3',
    backgroundColor: '#FFF9EF',
  },
  signImage: {
    width: '92%',
    height: '92%',
  },
  imageError: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageErrorText: {
    marginTop: 10,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  meaningScroll: {
    flexGrow: 0,
    maxHeight: 150,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#F7F9FC',
  },
  meaningContent: {
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  meaningLabel: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 10,
    color: '#315FAE',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  description: {
    marginTop: 7,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 22,
    color: '#46556D',
  },
  carouselControls: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  navButton: {
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 15,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#C9D8EF',
    backgroundColor: '#FFFFFF',
  },
  navButtonDisabled: {
    borderColor: '#E2E7EF',
    backgroundColor: '#EEF1F5',
  },
  navButtonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    color: '#315FAE',
  },
  navButtonTextDisabled: {
    color: '#AAB6C8',
  },
});
