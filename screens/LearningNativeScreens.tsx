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
    <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.headerLeft} activeOpacity={0.7} hitSlop={15}>
          <Ionicons name="chevron-back" size={28} color="#F6F8FE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerRight}>
          <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={20} />
        </View>
      </View>
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
      {/* File-type icon container */}
      <View style={[styles.extIconWrap, { backgroundColor: extColor + '15' }]}>
        <Ionicons name="document-text" size={24} color={extColor} />
        <View style={[styles.extBadgeSmall, { backgroundColor: extColor }]}>
          <Text style={styles.extBadgeText}>{ext}</Text>
        </View>
      </View>

      {/* Label */}
      <View style={styles.docInfo}>
        <Text style={styles.docTitle} numberOfLines={2}>
          {label}
        </Text>
        {url ? (
          <View style={styles.docMeta}>
            <Ionicons name="eye-outline" size={13} color="#4A78D0" />
            <Text style={styles.docMetaText}>{t('reading.tapToOpen')}</Text>
          </View>
        ) : (
          <Text style={styles.docNoLink}>{t('reading.noLinkAvailable')}</Text>
        )}
      </View>

      <View style={styles.docArrowWrap}>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
}

function RoadSignsEntryCard({ onPress }: { onPress: () => void }) {
  const { t } = useI18n();
  return (
    <TouchableOpacity style={styles.roadSignsCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.roadSignsIconWrap}>
        <Ionicons name="warning-outline" size={24} color="#4A78D0" />
      </View>
      <View style={styles.roadSignsTextWrap}>
        <Text style={styles.roadSignsTitle}>{t('reading.roadSigns')}</Text>
        <Text style={styles.roadSignsSubtitle}>{t('reading.roadSignsSubtitle')}</Text>
      </View>
      <View style={styles.roadSignsArrow}>
        <Ionicons name="chevron-forward" size={18} color="#4A78D0" />
      </View>
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
    isSigningOut,
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
      if (!cancelledRef.current) setPdfs(data);
    } catch (err) {
      if (!cancelledRef.current) {
        if (__DEV__) {
          console.warn('[Reading] PDF load failed', err);
        }
        setError(t('reading.loadError'));
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [contentLanguage, t]);

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
    if (!languageAccessGranted && !isSigningOut) {
      openGateModal('subscription_read', () => navigation.navigate('SubscriptionNative'));
    }
  }, [isSigningOut, languageAccessGranted, navigation, openGateModal]);

  const languageDocs = useMemo(() => {
    return pdfs.filter((pdf) => pdfLanguage(pdf) === contentLanguage);
  }, [contentLanguage, pdfs]);

  const selectedLanguageLabel = t(`profile.lang.${contentLanguage}`);
  const hasDocs = languageDocs.length > 0;
  const hasDocsInOtherLanguages = pdfs.length > 0 && languageDocs.length === 0;
  const emptyLanguageMessage = t('reading.pdfEmptyLanguage', { lang: selectedLanguageLabel });

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <TopHeader
        title={t('reading.title')}
        onBack={() => navigation.goBack()}
        navigation={navigation}
      />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.scrollPad, { paddingBottom: tabScrollBottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Road Signs Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('reading.study').toUpperCase()}</Text>
          </View>

          <RoadSignsEntryCard onPress={() => navigation.navigate('RoadSignsNative')} />

          {/* PDF Documents Section */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>{t('reading.pdfSection').toUpperCase()}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#4A78D0" />
              <Text style={styles.loadingText}>{t('reading.loadingDocuments')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={24} color="#F25559" />
              <View style={styles.errorTextWrap}>
                <Text style={styles.errorText}>{error}</Text>
                {accessToken ? (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => loadPdfs(accessToken, { current: false })}
                  >
                    <Text style={styles.retryText}>{t('common.retry')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : !hasDocs ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyText}>
                {hasDocsInOtherLanguages ? emptyLanguageMessage : t('reading.pdfEmpty')}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.docCount}>
                {t('reading.documentCount', {
                  count: languageDocs.length,
                  label: languageDocs.length === 1 ? t('reading.documentSingular') : t('reading.documentPlural'),
                })}
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
                      navigation.navigate('PdfViewer', { title: pdf.title || t('reading.documentFallback'), url: docUrl });
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

// ── Help center screen ────────────────────────

export function HelpCenterNativeScreen({ navigation }: HelpProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const faqs = [
    t('reading.faq1'),
    t('reading.faq2'),
    t('reading.faq3'),
    t('reading.faq4'),
  ];

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/250780211466').catch(() => {
      Alert.alert(t('common.error'), t('reading.whatsappError'));
    });
  };

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <TopHeader
        title={t('menu.help')}
        onBack={() => navigation.goBack()}
        navigation={navigation}
      />
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.scrollPad, { paddingBottom: tabScrollBottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('reading.helpContact').toUpperCase()}</Text>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={[styles.contactIconCircle, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="mail-outline" size={18} color="#0EA5E9" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t('reading.supportEmailLabel').toUpperCase()}</Text>
                <Text style={styles.contactValue}>nkotanyidrivings@gmail.com</Text>
              </View>
            </View>

            <View style={styles.contactDivider} />

            <View style={styles.contactRow}>
              <View style={[styles.contactIconCircle, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="call-outline" size={18} color="#22C55E" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t('reading.supportPhoneLabel').toUpperCase()}</Text>
                <Text style={styles.contactValue}>+250 780 211 466</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <View style={styles.whatsappIconCircle}>
                <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
              </View>
              <Text style={styles.whatsappBtnText}>{t('auth.whatsappUs')}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>{t('reading.faqTitle').toUpperCase()}</Text>
          </View>

          <View style={styles.faqList}>
            {faqs.map((q, idx) => (
              <TouchableOpacity key={idx} style={styles.faqCard} activeOpacity={0.85}>
                <Text style={styles.faqText}>{q}</Text>
                <View style={styles.faqArrow}>
                  <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    fontSize: 18,
    color: '#F5F7FC',
    textAlign: 'center',
    maxWidth: '70%',
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
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1,
  },

  roadSignsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(74, 120, 208, 0.05)',
  },
  roadSignsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    marginRight: 14,
  },
  roadSignsTextWrap: {
    flex: 1,
  },
  roadSignsTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#1E293B',
  },
  roadSignsSubtitle: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#64748B',
  },
  roadSignsArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#64748B',
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  errorTextWrap: {
    flex: 1,
    gap: 8,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#991B1B',
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  retryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Empty
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '80%',
  },

  // Count
  docCount: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 2,
  },

  // Document card
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(74, 120, 208, 0.05)',
  },
  extIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  extBadgeSmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    minWidth: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  extBadgeText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 7,
    color: '#FFFFFF',
  },
  docInfo: {
    flex: 1,
    gap: 4,
  },
  docTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 21,
    color: '#1E293B',
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docMetaText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    color: '#4A78D0',
  },
  docNoLink: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    color: '#94A3B8',
  },
  docArrowWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Help center
  contactCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(74, 120, 208, 0.05)',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 9,
    letterSpacing: 1,
    color: '#94A3B8',
  },
  contactValue: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: '#1E293B',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
    marginLeft: 54,
  },
  whatsappBtn: {
    marginTop: 12,
    width: '100%',
    backgroundColor: '#10B981',
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  whatsappIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  whatsappBtnText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(74, 120, 208, 0.05)',
  },
  faqText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    marginRight: 12,
  },
  faqArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
