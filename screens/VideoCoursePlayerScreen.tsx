import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import YouTubePlayer from '../components/YouTubePlayer';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { useI18n } from '../i18n/useI18n';
import { BottomNavBar } from '../components/BottomNavBar';
import { HeaderMenu } from '../components/HeaderMenu';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { hasLanguageAccess } from '../utils/subscriptionAccess';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCoursePlayer'>;

type VideoEntry = {
  _id?: string;
  title?: string;
  videoUrl?: string;
  thumbUri?: string;
  duration?: string;
};

const FALLBACK_THUMB = require('../assets/ui/video_thumb_1.png');

function getYoutubeId(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^"&?/\s]{11})/i);
  return match?.[1] ?? null;
}

type SmartPlayerProps = {
  url: string | undefined;
  thumbUri: string | undefined;
  title: string;
  active: boolean;
  onError: (msg: string, isEmbedDisabled?: boolean) => void;
};

function SmartVideoPlayer({ url, thumbUri, title, active, onError }: SmartPlayerProps) {
  const [loading, setLoading] = useState(true);
  const ytId = getYoutubeId(url);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nativeVideoRef = useRef<Video | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (url) {
      setLoading(true);
      clearTimer();
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        onError('Timeout: The video took too long to load. Please check your connection or tap Retry.');
      }, 30000); // 30s timeout
    }
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    // Pause/stop any active native video when screen is blurred/unmounted.
    if (!active && nativeVideoRef.current) {
      void nativeVideoRef.current.pauseAsync().catch(() => { });
      void nativeVideoRef.current.setPositionAsync(0).catch(() => { });
    }
  }, [active]);

  const handleReady = () => {
    clearTimer();
    setLoading(false);
  };

  const handleError = useCallback((msg: string) => {
    clearTimer();
    setLoading(false);
    // YouTube error 150, 152, 153 = embedding disabled by video owner
    const isEmbedDisabled = /15[023]/.test(msg);
    onError(isEmbedDisabled
      ? 'This video cannot be played here because the owner has disabled embedding. Tap below to watch it on YouTube.'
      : msg,
      isEmbedDisabled
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleYouTubeStateChange = (state: string) => {
    if (state === 'buffering') {
      setLoading(true);
    } else if (state === 'playing') {
      // Only clear when ACTUALLY playing, not on 'unstarted'
      handleReady();
    }
  };

  if (!url) {
    return (
      <View style={styles.heroWrap}>
        <Image source={thumbUri ? { uri: thumbUri } : FALLBACK_THUMB} style={styles.hero} resizeMode="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.playCircle}>
          <Ionicons name="videocam-off-outline" size={28} color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.heroWrap}>
      {loading && (
        <View style={styles.playerLoader}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      {ytId ? (
        <YouTubePlayer
          height={210}
          videoId={ytId}
          play={active}
          onReady={handleReady}
          onChangeState={handleYouTubeStateChange}
          onError={(msg: string) => handleError(msg)}
        />
      ) : (
        <Video
          ref={nativeVideoRef}
          source={{ uri: url }}
          style={styles.hero}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={active}
          onLoadStart={() => setLoading(true)}
          onLoad={handleReady}
          onError={(e) => handleError(`Playback Error: ${e}`)}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              if (status.isBuffering) {
                setLoading(true);
              } else {
                setLoading(false);
              }
            } else if (status.error) {
              handleError(`Playback Error: ${status.error}`);
            }
          }}
        />
      )}
    </View>
  );
}

export function VideoCoursePlayerScreen({ navigation, route }: Props) {
  const { t } = useI18n();
  const { insets, tabScrollBottomPad } = useResponsiveLayout();
  const isFocused = useIsFocused();
  const {
    hasSubscription,
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

  const allVideos: VideoEntry[] = route.params?.allVideos ?? [];
  const initialIndex = route.params?.currentIndex ?? 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [embedDisabled, setEmbedDisabled] = useState(false);

  // Current video — prefer allVideos entry (updated as user switches), fall back to route params
  const current: VideoEntry =
    allVideos.length > 0
      ? allVideos[currentIndex] ?? allVideos[0]
      : {
        title: route.params?.title,
        videoUrl: route.params?.videoUrl,
      };

  const title = current.title ?? t('video.playerTitle');
  const videoUrl = current.videoUrl;
  const thumbUri = current.thumbUri;

  const switchTo = (idx: number) => {
    const target = allVideos[idx];
    if (!target) return;
    setPlayerError(null);
    setEmbedDisabled(false);
    setCurrentIndex(idx);
  };

  // Up-next: all other videos (excluding current)
  const playlist = allVideos.filter((_, i) => i !== currentIndex);

  useEffect(() => {
    if (!languageAccessGranted) {
      openGateModal('subscription_watch', () => navigation.navigate('SubscriptionNative'));
    }
  }, [languageAccessGranted, navigation, openGateModal]);

  if (!languageAccessGranted) {
    return (
      <ScreenColumn backgroundColor="#4A78D0">
        <View style={[styles.centeredGate, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#F6F8FE" />
          <Text style={styles.gateText}>{t('video.loading')}</Text>
        </View>
      </ScreenColumn>
    );
  }

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('video.playerTitle')}
        </Text>
        <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={14} />
      </View>

      <View style={styles.body}>
        {/* ── Smart Player area ──────────────────────────────────────── */}
        {playerError ? (
          <View style={styles.errorOverlay}>
            <Ionicons name={embedDisabled ? 'logo-youtube' : 'alert-circle-outline'} size={48} color={embedDisabled ? '#FF0000' : '#FF6B6B'} />
            <Text style={styles.errorTitle}>{embedDisabled ? 'Not Available Here' : 'Playback Error'}</Text>
            <Text style={styles.errorSub}>{playerError}</Text>
            {embedDisabled && videoUrl ? (
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: '#FF0000' }]}
                onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${getYoutubeId(videoUrl)}`)}
              >
                <Text style={styles.retryText}>Watch on YouTube</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.retryButton} onPress={() => { setPlayerError(null); setEmbedDisabled(false); }}>
                <Text style={styles.retryText}>{t('common.retry') ?? 'Retry'}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <SmartVideoPlayer
            url={videoUrl}
            thumbUri={thumbUri}
            title={title}
            active={isFocused}
            onError={(msg, isEmbed) => { setPlayerError(msg); setEmbedDisabled(!!isEmbed); }}
          />
        )}

        {/* ── Title ────────────────────────────────────────────── */}
        <View style={styles.titleBlock}>
          <Text style={styles.videoTitle} numberOfLines={3}>
            {title}
          </Text>
          {!videoUrl && (
            <Text style={styles.noUrl}>{t('video.noUrl')}</Text>
          )}
        </View>

        {/* ── Up next list ────────────────────────────────────────────── */}
        {playlist.length > 0 ? (
          <ScrollView
            contentContainerStyle={[styles.listPad, { paddingBottom: tabScrollBottomPad }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.upNextLabel}>Up next</Text>
            {playlist.map((v, relIdx) => {
              // Real index in allVideos
              const realIdx = allVideos.indexOf(v);
              const isActive = realIdx === currentIndex;
              return (
                <TouchableOpacity
                  key={`${v._id ?? relIdx}-${relIdx}`}
                  style={[styles.card, isActive && styles.cardActive]}
                  activeOpacity={0.88}
                  onPress={() => switchTo(realIdx)}
                >
                  <View style={styles.thumbWrap}>
                    <Image
                      source={v.thumbUri ? { uri: v.thumbUri } : FALLBACK_THUMB}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                    {isActive ? (
                      <View style={styles.nowPlayingDot}>
                        <Ionicons name="volume-medium" size={12} color="#FFF" />
                      </View>
                    ) : (
                      <View style={styles.thumbPlay}>
                        <Ionicons name="play" size={10} color="#FFF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {v.title ?? t('video.lessonFallback', { n: realIdx + 1 })}
                    </Text>
                    <Text style={[styles.cardSub, isActive && styles.cardSubActive]}>
                      {isActive ? '▶ Playing now' : (v.duration ?? t('video.tapWatch'))}
                    </Text>
                  </View>
                  <Ionicons
                    name={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={22}
                    color={isActive ? '#4A78D0' : '#A8B2C2'}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyPlaylist}>
            <Text style={styles.emptyPlaylistText}>No other videos in this course.</Text>
          </View>
        )}
      </View>

      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 100,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  body: {
    flex: 1,
    backgroundColor: '#1A1E2A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  centeredGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateText: {
    marginTop: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#E8ECFA',
  },

  // Player
  heroWrap: {
    width: '100%',
    height: 210,
    backgroundColor: '#0D0F18',
    position: 'relative',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,12,22,0.42)',
  },
  playCircle: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74,120,208,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A78D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  // Title block
  titleBlock: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#1A1E2A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  videoTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 22,
    color: '#E8ECFA',
  },
  noUrl: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#E07070',
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  openText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#7CA3E8',
  },

  // Playlist
  listPad: {
    padding: 14,
  },
  upNextLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#7A8299',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#252A3A',
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  cardActive: {
    backgroundColor: '#1F2F52',
    borderWidth: 1,
    borderColor: '#4A78D0',
  },
  thumbWrap: {
    width: 90,
    height: 58,
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0D0F18',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(74,120,208,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,107,77,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#D0D6E8',
  },
  cardSub: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    lineHeight: 15,
    color: '#6B748C',
  },
  cardSubActive: {
    color: '#FF6B4D',
  },

  emptyPlaylist: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyPlaylistText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#5A6170',
    textAlign: 'center',
  },

  // Loading & Error states
  playerLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0F18',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorOverlay: {
    height: 210,
    backgroundColor: '#161A24',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#FF6B6B',
    marginTop: 12,
  },
  errorSub: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#A0A8BC',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4A78D0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
