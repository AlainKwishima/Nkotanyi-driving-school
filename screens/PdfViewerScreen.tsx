import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfViewer'>;

export function PdfViewerScreen({ navigation, route }: Props) {
  const { title, url } = route.params;
  const { insets } = useResponsiveLayout();
  const [loading, setLoading] = useState(true);

  // Use Google docs viewer to reliably render PDFs cross-platform inline
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Document'}</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.content}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#4A78D0" />
            <Text style={styles.loaderText}>Loading document...</Text>
          </View>
        )}
        <WebView
          source={{ uri: viewerUrl }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          scalesPageToFit={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
        />
        <View pointerEvents="none" style={styles.watermarkLayer}>
          {Array.from({ length: 12 }).map((_, idx) => (
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#4A78D0',
  },
  header: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#F7F9FE',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
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
    paddingVertical: 24,
    paddingHorizontal: 12,
    opacity: 0.12,
    transform: [{ rotate: '-22deg' }],
  },
  watermarkText: {
    width: '48%',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 16,
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
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  loaderText: {
    marginTop: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#8A8D9F',
  }
});
