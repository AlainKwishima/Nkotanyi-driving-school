import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfViewer'>;
type ViewerMode = 'direct' | 'google';

const VIEWER_MODE_CACHE = new Map<string, ViewerMode>();
const LOAD_TIMEOUT_MS = 30000;
const FALLBACK_TIMEOUT_MS = 12000;

function googleViewerUrl(url: string): string {
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
}

export function PdfViewerScreen({ navigation, route }: Props) {
  const { title, url } = route.params;
  const { insets } = useResponsiveLayout();
  const isWeb = Platform.OS === 'web';
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerMode, setViewerMode] = useState<ViewerMode>(() => VIEWER_MODE_CACHE.get(url) ?? 'direct');
  const [loadVersion, setLoadVersion] = useState(0);
  const [progress, setProgress] = useState(0);

  const viewerUrl = useMemo(() => {
    return viewerMode === 'direct' ? url : googleViewerUrl(url);
  }, [url, viewerMode]);

  const clearTimeoutHandle = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startLoadTimer = () => {
    clearTimeoutHandle();
    if (isWeb) {
      setLoading(false);
      setError(null);
      setProgress(0);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      if (viewerMode === 'direct') {
        VIEWER_MODE_CACHE.set(url, 'google');
        setViewerMode('google');
        setLoadVersion((v) => v + 1);
        setLoading(true);
        setError(null);
        setProgress(0);
        return;
      }
      setLoading(false);
      setError('The document is taking too long to load. Please retry.');
    }, viewerMode === 'direct' ? FALLBACK_TIMEOUT_MS : LOAD_TIMEOUT_MS);
  };

  useEffect(() => {
    if (isWeb) {
      setLoading(false);
      setError(null);
      setProgress(0);
      clearTimeoutHandle();
      return () => clearTimeoutHandle();
    }
    setLoading(true);
    setError(null);
    setProgress(0);
    startLoadTimer();
    return clearTimeoutHandle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerMode, loadVersion, url]);

  const handleRetry = () => {
    clearTimeoutHandle();
    VIEWER_MODE_CACHE.delete(url);
    setViewerMode('direct');
    setLoadVersion((v) => v + 1);
    setLoading(true);
    setError(null);
    setProgress(0);
  };

  const openExternally = async () => {
    try {
      await Linking.openURL(viewerMode === 'direct' ? url : viewerUrl);
    } catch {
      await Linking.openURL(url);
    }
  };

  const handleLoadProgress = (event: any) => {
    const value = event?.nativeEvent?.progress ?? 0;
    setProgress(value);
    if (value >= 0.18) {
      setLoading(false);
    }
  };

  const handleLoadEnd = () => {
    clearTimeoutHandle();
    VIEWER_MODE_CACHE.set(url, viewerMode);
    setLoading(false);
    setProgress(1);
  };

  const handleError = (event: any) => {
    clearTimeoutHandle();
    if (viewerMode === 'direct') {
      VIEWER_MODE_CACHE.set(url, 'google');
      setViewerMode('google');
      setLoadVersion((v) => v + 1);
      setLoading(true);
      setError(null);
      setProgress(0);
      return;
    }

    const message = event?.nativeEvent?.description || 'Failed to load document. Please retry.';
    setLoading(false);
    setError(message);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBlue}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#F6F8FE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Document'}
          </Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      <View style={styles.bodyWrap}>
        {isWeb ? (
          <View style={styles.webFallback}>
            <Ionicons name="document-text-outline" size={38} color="#4A78D0" />
            <Text style={styles.errorTitle}>Document preview unavailable in web mode</Text>
            <Text style={styles.errorBody}>
              The in-app PDF viewer runs natively on mobile. Open the document externally to view it in your browser.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={openExternally}>
              <Text style={styles.retryText}>Open externally</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#4A78D0" />
                <Text style={styles.loaderText}>
                  {viewerMode === 'direct' ? 'Opening document...' : 'Loading document...'}
                </Text>
                <Text style={styles.loaderSubText}>
                  {progress > 0 ? `${Math.round(progress * 100)}%` : 'Please wait'}
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorLayer}>
                <Ionicons name="alert-circle-outline" size={36} color="#C05A5A" />
                <Text style={styles.errorTitle}>Unable to open document</Text>
                <Text style={styles.errorBody}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.retryBtn, styles.secondaryBtn]} onPress={openExternally}>
                  <Text style={styles.secondaryText}>Open externally</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <WebView
              key={`${url}:${viewerMode}:${loadVersion}`}
              source={{ uri: viewerUrl }}
              style={styles.webview}
              originWhitelist={['*']}
              cacheEnabled
              domStorageEnabled
              javaScriptEnabled
              startInLoadingState={false}
              mixedContentMode="always"
              setSupportMultipleWindows={false}
              allowsFullscreenVideo={false}
              onLoadStart={() => {
                setLoading(true);
                setError(null);
              }}
              onLoadProgress={handleLoadProgress}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
            />

            <View pointerEvents="none" style={styles.watermarkLayer}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <Text
                  key={`wm-${idx}`}
                  style={[
                    styles.watermarkText,
                    idx % 2 === 0 ? styles.watermarkTextAlt : styles.watermarkTextMuted,
                  ]}
                >
                  NKOTANYI DRIVING SCHOOL
                </Text>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#4A78D0',
  },
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
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    color: '#F5F7FC',
    textAlign: 'center',
    maxWidth: '70%',
  },
  bodyWrap: {
    flex: 1,
    backgroundColor: '#F3F5FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    marginTop: -20,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  watermarkLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 12,
    opacity: 0.1,
    transform: [{ rotate: '-22deg' }],
  },
  watermarkText: {
    width: '48%',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14,
    letterSpacing: 2,
    color: '#4A78D0',
  },
  watermarkTextAlt: {
    opacity: 0.28,
  },
  watermarkTextMuted: {
    opacity: 0.18,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F5FA',
    zIndex: 10,
    paddingHorizontal: 24,
  },
  loaderText: {
    marginTop: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#4A4F5C',
  },
  loaderSubText: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#8A8D9F',
  },
  errorLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F5FA',
    paddingHorizontal: 24,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F3F5FA',
  },
  errorTitle: {
    marginTop: 10,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    color: '#1E293B',
    textAlign: 'center',
  },
  errorBody: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 19,
    color: '#5C6474',
  },
  retryBtn: {
    marginTop: 16,
    minHeight: 52,
    minWidth: 140,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
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
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#EEF3FF',
  },
  secondaryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#4A78D0',
  },
});
