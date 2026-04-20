import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAuth } from '../context/AuthContext';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { getPdfs, type PdfItem } from '../services/contentApi';
import { getMessageFromUnknownError } from '../services/api/client';
import { useI18n } from '../i18n/useI18n';
import { hasLanguageAccess } from '../utils/subscriptionAccess';

type ReadProps = NativeStackScreenProps<RootStackParamList, 'ReadingNative'>;
type HelpProps = NativeStackScreenProps<RootStackParamList, 'HelpCenterNative'>;
type AnyNav = ReadProps['navigation'] | HelpProps['navigation'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function pdfOpenUrl(item: PdfItem): string | undefined {
  const u = item.file ?? item.pdfURL ?? item.url ?? item.fileUrl;
  return typeof u === 'string' && u.startsWith('http') ? u : undefined;
}

function pdfLabel(item: PdfItem, idx: number, fallback: string): string {
  return (item.title ?? item.name ?? `${fallback} ${idx + 1}`).trim();
}

function pdfExt(item: PdfItem): string {
  const url = item.file ?? item.pdfURL ?? item.url ?? item.fileUrl ?? '';
  const lower = url.toLowerCase();
  if (lower.includes('.pdf')) return 'PDF';
  if (lower.includes('.docx') || lower.includes('.doc')) return 'DOC';
  if (lower.includes('.pptx') || lower.includes('.ppt')) return 'PPT';
  return 'FILE';
}

function normalizePdfLanguage(value?: string | null): 'en' | 'rw' | 'fr' | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'en' ||
    normalized.startsWith('en-') ||
    normalized.startsWith('eng') ||
    normalized.includes('english') ||
    normalized.includes('anglais')
  ) {
    return 'en';
  }
  if (
    normalized === 'rw' ||
    normalized.startsWith('rw-') ||
    normalized.includes('kinyarwanda')
  ) {
    return 'rw';
  }
  if (
    normalized === 'fr' ||
    normalized.startsWith('fr-') ||
    normalized.includes('francais') ||
    normalized.includes('français')
  ) {
    return 'fr';
  }
  return null;
}

function pdfLanguage(item: PdfItem): 'en' | 'rw' | 'fr' | null {
  return normalizePdfLanguage(item.language ?? null);
}

const EXT_COLORS: Record<string, string> = {
  PDF: '#E4552A',
  DOC: '#2B5EAE',
  PPT: '#C0392B',
  FILE: '#5C6474',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function TopHeader({ title, onBack, navigation }: { title: string; onBack: () => void; navigation: AnyNav }) {
  const { insets } = useResponsiveLayout();
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={onBack} style={styles.headerIconBtn}>
        <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={14} />
    </View>
  );
}

function DocCard({
  item,
  idx,
  fallback,
  onPress,
}: {
  item: PdfItem;
  idx: number;
  fallback: string;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const label = pdfLabel(item, idx, fallback);
  const url = pdfOpenUrl(item);
  const ext = pdfExt(item);
  const extColor = EXT_COLORS[ext] ?? EXT_COLORS.FILE;

  return (
    <TouchableOpacity style={styles.docCard} onPress={onPress} activeOpacity={0.88}>
      {/* File-type badge */}
      <View style={[styles.extBadge, { backgroundColor: extColor }]}>
        <Text style={styles.extText}>{ext}</Text>
      </View>

      {/* Label */}
      <View style={styles.docInfo}>
        <Text style={styles.docTitle} numberOfLines={2}>
          {label}
        </Text>
        {url ? (
          <View style={styles.docMeta}>
            <Ionicons name="download-outline" size={12} color="#4A78D0" />
            <Text style={styles.docMetaText}>{t('reading.tapToOpen')}</Text>
          </View>
        ) : (
          <Text style={styles.docNoLink}>{t('reading.noLinkAvailable')}</Text>
        )}
      </View>

      <Ionicons name="open-outline" size={18} color={url ? '#4A78D0' : '#C0C7D2'} />
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export function ReadingNativeScreen({ navigation }: ReadProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const { accessToken } = useAuth();
  const {
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  } = useAppFlow();
  const { openGateModal } = useGateModal();
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const languageAccessGranted = hasLanguageAccess({
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  });

  const loadPdfs = useCallback(async (token: string, cancelledRef: { current: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPdfs(token, contentLanguage);
      if (__DEV__ && data.length > 0) {
        console.log('[Pdfs] first item shape →', JSON.stringify(data[0]));
      }
      if (!cancelledRef.current) setPdfs(data);
    } catch (err) {
      if (!cancelledRef.current) setError(getMessageFromUnknownError(err));
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [contentLanguage]);

  useEffect(() => {
    const cancelledRef = { current: false };
    if (!languageAccessGranted) {
      setLoading(false);
      return () => { cancelledRef.current = true; };
    }
    if (accessToken) {
      void loadPdfs(accessToken, cancelledRef);
    }
    return () => { cancelledRef.current = true; };
  }, [accessToken, languageAccessGranted, loadPdfs]);

  useEffect(() => {
    if (!languageAccessGranted) {
      openGateModal('subscription_read', () => navigation.navigate('SubscriptionNative'));
    }
  }, [languageAccessGranted, navigation, openGateModal]);

  const languageDocs = useMemo(() => {
    return pdfs.filter((pdf) => {
      const lang = pdfLanguage(pdf);
      return !lang || lang === contentLanguage;
    });
  }, [contentLanguage, pdfs]);

  const selectedLanguageLabel = t(`profile.lang.${contentLanguage}`);
  const hasDocs = languageDocs.length > 0;
  const hasDocsInOtherLanguages = pdfs.length > 0 && languageDocs.length === 0;
  const emptyLanguageMessage = t('reading.pdfEmptyLanguage', { lang: selectedLanguageLabel });

  if (!languageAccessGranted) {
    return (
      <ScreenColumn backgroundColor="#4A78D0">
        <TopHeader
          title={t('reading.title')}
          onBack={() => navigation.goBack()}
          navigation={navigation}
        />
        <View style={styles.centeredGate}>
          <ActivityIndicator size="large" color="#4A78D0" />
          <Text style={styles.gateText}>{t('reading.loadingDocuments')}</Text>
        </View>
      </ScreenColumn>
    );
  }

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <TopHeader
        title={t('reading.title')}
        onBack={() => navigation.goBack()}
        navigation={navigation}
      />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.scrollPad, { paddingBottom: tabScrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Documents section ──────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color="#4A78D0" />
            <Text style={styles.sectionTitle}>{t('reading.pdfSection')}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#4A78D0" />
              <Text style={styles.loadingText}>{t('reading.loadingDocuments')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#A05050" />
              <Text style={styles.errorText}>{error}</Text>
              {accessToken ? (
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => loadPdfs(accessToken, { current: false })}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : !hasDocs ? (
            <View style={styles.emptyCard}>
              <Ionicons name="folder-open-outline" size={32} color="#A0A8BC" />
              <Text style={styles.emptyText}>
                {hasDocsInOtherLanguages ? emptyLanguageMessage : t('reading.pdfEmpty')}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.docCount}>
                {languageDocs.length} {languageDocs.length === 1 ? t('reading.documentSingular') : t('reading.documentPlural')}
              </Text>
              {languageDocs.map((pdf, idx) => (
                <DocCard
                  key={pdf._id ?? `pdf-${idx}`}
                  item={pdf}
                  idx={idx}
                  fallback={t('reading.materialFallback', { n: '' }).replace('{n}', '').trim()}
                  onPress={() => {
                    const docUrl = pdfOpenUrl(pdf);
                    if (docUrl) {
                      navigation.navigate('PdfViewer', { title: pdf.title || 'Document', url: docUrl });
                    } else {
                      Alert.alert(t('reading.pdfAlertTitle'), t('reading.pdfNoLink'));
                    }
                  }}
                />
              ))}
            </>
          )}
        </ScrollView>
      </View>

      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

// ── Help center screen (unchanged structure, kept here) ────────────────────────

export function HelpCenterNativeScreen({ navigation }: HelpProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const faqs = [
    t('reading.faq1'),
    t('reading.faq2'),
    t('reading.faq3'),
    t('reading.faq4'),
  ];

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <TopHeader
        title={t('menu.help')}
        onBack={() => navigation.goBack()}
        navigation={navigation}
      />
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.scrollPad, { paddingBottom: tabScrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.helpSectionTitle}>{t('reading.helpContact')}</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={styles.contactIconCircle}>
                <Text style={styles.atSymbol}>@</Text>
              </View>
              <View>
                <Text style={styles.contactLabel}>{t('reading.supportEmailLabel').toUpperCase()}</Text>
                <Text style={styles.contactValue}>nkotanyidrivings@gmail.com</Text>
              </View>
            </View>
            <View style={[styles.contactRow, { marginBottom: 0 }]}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="phone-portrait-outline" size={16} color="#2D3666" />
              </View>
              <View>
                <Text style={styles.contactLabel}>SUPPORT PHONE</Text>
                <Text style={styles.contactValue}>0780211466</Text>
              </View>
            </View>
          </View>

          <Text style={styles.helpSectionTitle}>{t('reading.faqTitle')}</Text>
          {faqs.map((q) => (
            <TouchableOpacity key={q} style={styles.faqCard} activeOpacity={0.85}>
              <Text style={styles.faqText}>{q}</Text>
              <Ionicons name="chevron-down" size={16} color="#7A8091" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    minHeight: 100,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconBtn: {
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
  body: {
    flex: 1,
    backgroundColor: '#CBD3E0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  centeredGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  gateText: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#4A4F5C',
  },
  scrollPad: {
    padding: 14,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 20,
    color: '#1F2A52',
  },

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#5C6474',
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5E8E8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  errorText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#8A3030',
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#4A78D0',
  },
  retryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Empty
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#5C6474',
    textAlign: 'center',
  },

  // Count
  docCount: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    lineHeight: 16,
    color: '#5C6474',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },

  // Document card
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  extBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  extText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 11,
    lineHeight: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  docInfo: {
    flex: 1,
    gap: 4,
  },
  docTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2952',
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docMetaText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    lineHeight: 15,
    color: '#4A78D0',
  },
  docNoLink: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    color: '#A0A8BC',
  },

  // Help center
  helpSectionTitle: {
    marginTop: 10,
    marginBottom: 10,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 22,
    color: '#25325C',
  },
  contactCard: {
    borderRadius: 12,
    backgroundColor: '#ECECF0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactIconCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#D8DCEC',
  },
  atSymbol: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 18,
    color: '#2D3666',
  },
  contactLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: '#9CA2B2',
  },
  contactValue: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 18,
    color: '#2C355D',
  },
  faqCard: {
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#F2F3F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 19,
    color: '#333844',
  },
});

