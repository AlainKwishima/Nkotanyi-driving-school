import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { BottomNavBar } from '../components/BottomNavBar';
import { HeaderMenu } from '../components/HeaderMenu';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAuth } from '../context/AuthContext';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { getVideos, type VideoItem } from '../services/contentApi';
import { getMessageFromUnknownError } from '../services/api/client';
import { useI18n } from '../i18n/useI18n';
import { hasLanguageAccess } from '../utils/subscriptionAccess';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCourseList'>;

const FALLBACK_THUMB = require('../assets/ui/video_thumb_1.png');

function videoUrlFromItem(v: VideoItem): string | undefined {
  const raw = v.video ?? v.videoURL ?? v.url ?? v.link;
  return typeof raw === 'string' && raw.startsWith('http') ? raw : undefined;
}

function titleFromItem(
  v: VideoItem,
  index: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  return (v.title ?? v.name ?? t('video.lessonFallback', { n: index + 1 })).trim();
}

function thumbUriFromItem(v: VideoItem): string | undefined {
  const u = v.thumbnail ?? v.thumbnailURL ?? v.imageURL;
  if (typeof u === 'string' && u.startsWith('http')) return u;

  // Real backend does not provide thumbnails but gives youtube embed links. Auto-extract!
  const vid = v.video ?? v.videoURL ?? '';
  const match = vid.match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^"&?/\s]{11})/i);
  if (match && match[1]) {
    return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return undefined;
}

function durationLabel(v: VideoItem): string | undefined {
  if (v.duration) return String(v.duration);
  if (typeof v.durationMinutes === 'number') return `${v.durationMinutes} min`;
  return undefined;
}

export function VideoCourseListScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { insets, tabScrollBottomPad } = useResponsiveLayout();
  const { accessToken } = useAuth();
  const {
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  } = useAppFlow();
  const { openGateModal } = useGateModal();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<VideoItem[]>([]);
  const languageAccessGranted = hasLanguageAccess({
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  });

  useEffect(() => {
    if (!languageAccessGranted) {
      openGateModal('subscription_watch', () => navigation.navigate('SubscriptionNative'));
    }
  }, [hasSubscription, languageAccessGranted, navigation, openGateModal]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!languageAccessGranted) {
        setLoading(false);
        return;
      }
      if (!accessToken) {
        setError(t('video.needSignIn'));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getVideos(accessToken, contentLanguage);
        if (__DEV__ && data.length > 0) {
          console.log('[Videos] first item shape →', JSON.stringify(data[0]));
        }
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) setError(getMessageFromUnknownError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [accessToken, contentLanguage, languageAccessGranted, t]);

  if (!languageAccessGranted) {
    return (
      <ScreenColumn backgroundColor="#4A78D0">
        <View style={styles.bodyWrap}>
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>{t('video.loading')}</Text>
          </View>
        </View>
      </ScreenColumn>
    );
  }

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      {/* Header */}
      <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#F6F8FE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('video.listTitle')}</Text>
          <View style={styles.headerRight}>
            <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={20} />
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={styles.bodyWrap}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>{t('video.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={40} color="#A0AAB8" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setError(null);
                setLoading(true);
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="videocam-outline" size={44} color="#A0AAB8" />
            <Text style={styles.errorText}>{t('video.none')}</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.listPad, { paddingBottom: tabScrollBottomPad }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.countLabel}>
              {items.length} {items.length === 1 ? 'video' : 'videos'}
            </Text>
            {items.map((lesson, idx) => {
              const url = videoUrlFromItem(lesson);
              const title = titleFromItem(lesson, idx, t);
              const thumbUri = thumbUriFromItem(lesson);
              const dur = durationLabel(lesson);
              return (
                <TouchableOpacity
                  key={`${lesson._id ?? idx}-${idx}`}
                  style={styles.card}
                  activeOpacity={0.88}
                  onPress={() =>
                    navigation.navigate('VideoCoursePlayer', {
                      title,
                      videoUrl: url,
                      videoId: lesson._id,
                      allVideos: items.map((v, i) => ({
                        _id: v._id,
                        title: titleFromItem(v, i, t),
                        videoUrl: videoUrlFromItem(v),
                        thumbUri: thumbUriFromItem(v),
                        duration: durationLabel(v),
                      })),
                      currentIndex: idx,
                    })
                  }
                >
                  {/* Thumbnail */}
                  <View style={styles.thumbWrap}>
                    <Image
                      source={thumbUri ? { uri: thumbUri } : FALLBACK_THUMB}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                    <View style={styles.playBadge}>
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                    </View>
                    {dur ? (
                      <View style={styles.durBadge}>
                        <Text style={styles.durText}>{dur}</Text>
                      </View>
                    ) : null}
                  </View>
                  {/* Text */}
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {title}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Ionicons name="play-circle-outline" size={14} color="#4A78D0" />
                      <Text style={styles.cardMetaText}>
                        {dur ?? t('video.tapWatch')}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    color: '#F5F7FC',
    textAlign: 'center',
  },
  bodyWrap: {
    flex: 1,
    backgroundColor: '#F3F5FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    marginTop: -20,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  listPad: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  countLabel: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  thumbWrap: {
    position: 'relative',
    width: 110,
    height: 74,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(37,99,235,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  durText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  cardText: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 22,
    color: '#1E293B',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#64748B',
  },
});
