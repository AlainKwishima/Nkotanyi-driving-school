import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { BottomNavBar } from '../components/BottomNavBar';
import { HeaderMenu } from '../components/HeaderMenu';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAuth } from '../context/AuthContext';
import { getVideos, type VideoItem } from '../services/contentApi';
import { getMessageFromUnknownError } from '../services/api/client';
import { useI18n } from '../i18n/useI18n';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCourseList'>;

const FALLBACK_THUMB = require('../assets/ui/video_thumb_1.png');

function videoUrlFromItem(v: VideoItem): string | undefined {
  return v.videoURL ?? v.url ?? v.link;
}

function titleFromItem(v: VideoItem, index: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  return (v.title ?? v.name ?? t('video.lessonFallback', { n: index + 1 })).trim();
}

function thumbUriFromItem(v: VideoItem): string | undefined {
  const u = v.thumbnail ?? v.thumbnailURL ?? v.imageURL;
  return typeof u === 'string' && u.startsWith('http') ? u : undefined;
}

function BottomTabs({ navigation }: { navigation: Props['navigation'] }) {
  return <BottomNavBar navigation={navigation} />;
}

export function VideoCourseListScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { insets, tabScrollBottomPad } = useResponsiveLayout();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<VideoItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!accessToken) {
        setError(t('video.needSignIn'));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getVideos(accessToken);
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) setError(getMessageFromUnknownError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, t]);

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('video.listTitle')}</Text>
        <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={14} />
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#4A78D0" />
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={[styles.listPad, { paddingBottom: tabScrollBottomPad }]} showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <Text style={styles.errorText}>{t('video.none')}</Text>
            ) : (
              items.map((lesson, idx) => {
                const url = videoUrlFromItem(lesson);
                const title = titleFromItem(lesson, idx, t);
                const thumbUri = thumbUriFromItem(lesson);
                return (
                  <TouchableOpacity
                    key={`${lesson._id ?? idx}-${idx}`}
                    style={styles.card}
                    onPress={() =>
                      navigation.navigate('VideoCoursePlayer', {
                        title,
                        videoUrl: url,
                      })
                    }
                  >
                    <Image source={thumbUri ? { uri: thumbUri } : FALLBACK_THUMB} style={styles.thumb} resizeMode="cover" />
                    <View style={styles.cardTextWrap}>
                      <Text style={styles.cardTitle}>{title}</Text>
                      <Text style={styles.duration}>{lesson.duration ? String(lesson.duration) : t('video.tapWatch')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      <BottomTabs navigation={navigation} />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 78,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, lineHeight: 24, color: '#F7F9FE' },
  body: {
    flex: 1,
    backgroundColor: '#CAD2DF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  listPad: { padding: 14 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: {
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#4A4F5C',
  },
  card: {
    height: 82,
    borderRadius: 10,
    backgroundColor: '#F2F3F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  thumb: { width: 84, height: 54, borderRadius: 8 },
  cardTextWrap: { marginLeft: 12, flex: 1 },
  cardTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, lineHeight: 22, color: '#3A3E49' },
  duration: { marginTop: 3, fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, lineHeight: 16, color: '#757985' },
  tabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#EFF0F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: { alignItems: 'center' },
  tabBubble: { width: 46, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabBubbleActive: { backgroundColor: '#4A78D0' },
  tabText: { marginTop: 2, fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, lineHeight: 14, color: '#8A98B2' },
  tabTextActive: { color: '#4A78D0' },
});

