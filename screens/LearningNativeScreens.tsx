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
import { AppHeader } from '../components/AppHeader';
import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenColumn } from '../components/ScreenColumn';
import { SectionHeading } from '../components/SectionHeading';
import { EmptyState, InlineErrorState, LoadingState } from '../components/RequestStates';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAuth } from '../context/AuthContext';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';
import { getPdfsWithFallback, type PdfItem } from '../services/contentApi';
import { ApiError } from '../services/api/types';
import { useI18n } from '../i18n/useI18n';
import { hasLanguageAccess } from '../utils/subscriptionAccess';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';

type ReadProps = NativeStackScreenProps<RootStackParamList, 'ReadingNative'>;
type HelpProps = NativeStackScreenProps<RootStackParamList, 'HelpCenterNative'>;

function pdfOpenUrl(item: PdfItem): string | undefined {
  const value = item.file ?? item.pdfURL ?? item.url ?? item.fileUrl;
  return typeof value === 'string' && value.startsWith('http') ? value : undefined;
}

function pdfLabel(item: PdfItem, index: number, fallback: string): string {
  return (item.title ?? item.name ?? `${fallback} ${index + 1}`).trim();
}

function pdfExtension(item: PdfItem): 'PDF' | 'DOC' | 'PPT' | 'FILE' {
  const url = (item.file ?? item.pdfURL ?? item.url ?? item.fileUrl ?? '').toLowerCase();
  if (url.includes('.pdf')) return 'PDF';
  if (url.includes('.doc')) return 'DOC';
  if (url.includes('.ppt')) return 'PPT';
  return 'FILE';
}

const FILE_TONES = {
  PDF: { color: '#B84E35', background: '#FAEBE6' },
  DOC: { color: colors.brandStrong, background: colors.brandSoft },
  PPT: { color: '#A55F1D', background: colors.amberSoft },
  FILE: { color: colors.inkMuted, background: '#EDF0EC' },
};

function DocumentCard({
  item,
  index,
  fallback,
  onPress,
}: {
  item: PdfItem;
  index: number;
  fallback: string;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const extension = pdfExtension(item);
  const tone = FILE_TONES[extension];
  const hasLink = Boolean(pdfOpenUrl(item));

  return (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={onPress}
      activeOpacity={hasLink ? 0.84 : 1}
      accessibilityState={{ disabled: !hasLink }}
    >
      <View style={[styles.fileIcon, { backgroundColor: tone.background }]}>
        <Ionicons name="document-text-outline" size={24} color={tone.color} />
      </View>
      <View style={styles.documentCopy}>
        <Text style={styles.documentTitle} numberOfLines={2}>
          {pdfLabel(item, index, fallback)}
        </Text>
        <View style={styles.documentMeta}>
          <View style={[styles.extensionPill, { backgroundColor: tone.background }]}>
            <Text style={[styles.extensionText, { color: tone.color }]}>{extension}</Text>
          </View>
          <Text style={[styles.openText, !hasLink && styles.unavailableText]}>
            {hasLink ? t('reading.tapToOpen') : t('reading.noLinkAvailable')}
          </Text>
        </View>
      </View>
      <View style={styles.cardArrow}>
        <Ionicons name={hasLink ? 'arrow-forward' : 'remove'} size={17} color={colors.inkSoft} />
      </View>
    </TouchableOpacity>
  );
}

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
  const [pdfSourceLanguage, setPdfSourceLanguage] = useState<typeof contentLanguage | null>(null);
  const [usedPdfFallback, setUsedPdfFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languageAccessGranted = hasLanguageAccess({
    hasSubscription,
    canChangeLanguage,
    subscriptionLanguage,
    contentLanguage,
  });

  const loadPdfs = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setPdfs([]);
    setPdfSourceLanguage(null);
    setUsedPdfFallback(false);
    try {
      const result = await getPdfsWithFallback(
        accessToken,
        contentLanguage,
        subscriptionLanguage && subscriptionLanguage !== contentLanguage ? [subscriptionLanguage] : [],
      );
      setPdfs(result.items);
      setPdfSourceLanguage(result.resolvedLanguage);
      setUsedPdfFallback(result.usedFallback);
    } catch (loadError) {
      if (__DEV__) console.warn('[Reading] PDF load failed', loadError);
      setError(
        loadError instanceof ApiError && loadError.code === 'PDF_LANGUAGE_MISMATCH'
          ? t('reading.languageMismatch', { lang: t(`profile.lang.${contentLanguage}`) })
          : t('reading.loadError'),
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, contentLanguage, subscriptionLanguage, t]);

  useEffect(() => {
    if (languageAccessGranted && accessToken) void loadPdfs();
  }, [accessToken, languageAccessGranted, loadPdfs]);

  useEffect(() => {
    if (!languageAccessGranted && !isSigningOut) {
      openGateModal('subscription_read', () => navigation.navigate('SubscriptionNative'));
    }
  }, [isSigningOut, languageAccessGranted, navigation, openGateModal]);

  const languageDocuments = useMemo(() => pdfs, [pdfs]);
  const languageLabel = t(`profile.lang.${contentLanguage}`);
  const sourceLanguageLabel = pdfSourceLanguage ? t(`profile.lang.${pdfSourceLanguage}`) : languageLabel;

  return (
    <ScreenColumn backgroundColor={colors.brandStrong}>
      <AppHeader
        title={t('reading.title')}
        eyebrow={languageLabel}
        onBack={() => navigation.goBack()}
        navigation={navigation}
      />

      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottomPad + spacing.xl }]}
        >
          <View style={styles.introRow}>
            <View style={styles.introCopy}>
              <Text style={styles.pageTitle}>{t('reading.libraryTitle')}</Text>
              <Text style={styles.pageSubtitle}>{t('reading.librarySubtitle')}</Text>
            </View>
            <View style={styles.languageBadge}>
              <Ionicons name="language-outline" size={16} color={colors.brandStrong} />
              <Text style={styles.languageText}>{languageLabel}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('RoadSignsNative')}
            activeOpacity={0.86}
          >
            <View style={styles.featureIcon}>
              <Ionicons name="warning-outline" size={28} color={colors.amber} />
            </View>
            <View style={styles.featureCopy}>
              <Text style={styles.featureEyebrow}>{t('reading.study')}</Text>
              <Text style={styles.featureTitle}>{t('reading.roadSigns')}</Text>
              <Text style={styles.featureBody}>{t('reading.roadSignsSubtitle')}</Text>
            </View>
            <View style={styles.featureArrow}>
              <Ionicons name="arrow-forward" size={19} color={colors.ink} />
            </View>
          </TouchableOpacity>

          <View style={styles.section}>
            <SectionHeading title={t('reading.pdfSection')} />
            <Text style={styles.sectionSupport}>
              {t('reading.documentCount', {
                count: error ? 0 : languageDocuments.length,
                label:
                  !error && languageDocuments.length === 1
                    ? t('reading.documentSingular')
                    : t('reading.documentPlural'),
              })}
            </Text>
            {!loading && !error && usedPdfFallback ? (
              <Text style={styles.fallbackNotice}>
                {t('reading.languageFallback', {
                  requested: languageLabel,
                  available: sourceLanguageLabel,
                })}
              </Text>
            ) : null}
          </View>

          {loading ? (
            <LoadingState message={t('reading.loadingDocuments')} />
          ) : error ? (
            <InlineErrorState
              title={t('reading.languageUnavailableTitle')}
              message={error}
              onRetry={() => void loadPdfs()}
            />
          ) : languageDocuments.length === 0 ? (
            <EmptyState
              title={t('reading.pdfEmpty')}
              message={t('reading.libraryEmptyHint')}
            />
          ) : (
            <View style={styles.documentList}>
              {languageDocuments.map((document, index) => (
                <DocumentCard
                  key={document._id ?? `document-${index}`}
                  item={document}
                  index={index}
                  fallback={t('reading.documentFallback')}
                  onPress={() => {
                    const url = pdfOpenUrl(document);
                    if (!url) {
                      Alert.alert(t('reading.pdfAlertTitle'), t('reading.pdfNoLink'));
                      return;
                    }
                    navigation.navigate('PdfViewer', {
                      title: document.title ?? document.name ?? t('reading.documentFallback'),
                      url,
                    });
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <BottomNavBar navigation={navigation} />
    </ScreenColumn>
  );
}

export function HelpCenterNativeScreen({ navigation }: HelpProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const faqs = [t('reading.faq1'), t('reading.faq2'), t('reading.faq3'), t('reading.faq4')];

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/250780211466').catch(() => {
      Alert.alert(t('common.error'), t('reading.whatsappError'));
    });
  };

  return (
    <ScreenColumn backgroundColor={colors.brandStrong}>
      <AppHeader title={t('menu.help')} onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottomPad + spacing.xl }]}
        >
          <Text style={styles.pageTitle}>{t('reading.helpContact')}</Text>
          <Text style={styles.pageSubtitle}>{t('reading.helpIntro')}</Text>

          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={[styles.contactIcon, { backgroundColor: colors.brandSoft }]}>
                <Ionicons name="mail-outline" size={20} color={colors.brand} />
              </View>
              <View style={styles.contactCopy}>
                <Text style={styles.contactLabel}>{t('reading.supportEmailLabel')}</Text>
                <Text style={styles.contactValue}>nkotanyidrivings@gmail.com</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.contactRow}>
              <View style={[styles.contactIcon, { backgroundColor: colors.greenSoft }]}>
                <Ionicons name="call-outline" size={20} color={colors.green} />
              </View>
              <View style={styles.contactCopy}>
                <Text style={styles.contactLabel}>{t('reading.supportPhoneLabel')}</Text>
                <Text style={styles.contactValue}>+250 780 211 466</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp} activeOpacity={0.85}>
              <Ionicons name="logo-whatsapp" size={21} color={colors.white} />
              <Text style={styles.whatsappText}>{t('auth.whatsappUs')}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <SectionHeading title={t('reading.faqTitle')} />
          </View>
          <View style={styles.faqList}>
            {faqs.map((question, index) => (
              <View key={question} style={styles.faqCard}>
                <View style={styles.faqNumber}>
                  <Text style={styles.faqNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.faqText}>{question}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
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
  content: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  introRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  introCopy: {
    flex: 1,
  },
  pageTitle: {
    ...typography.heading,
    color: colors.ink,
  },
  pageSubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.inkMuted,
  },
  languageBadge: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brandSoft,
  },
  languageText: {
    ...typography.caption,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.brandStrong,
  },
  featureCard: {
    minHeight: 150,
    marginTop: spacing.xxl,
    padding: spacing.xl,
    overflow: 'hidden',
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    ...shadows.card,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  featureCopy: {
    flex: 1,
    marginHorizontal: spacing.lg,
  },
  featureEyebrow: {
    ...typography.eyebrow,
    color: colors.amber,
    textTransform: 'uppercase',
  },
  featureTitle: {
    ...typography.title,
    marginTop: spacing.xs,
    color: colors.white,
  },
  featureBody: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: '#C4CEDD',
  },
  featureArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.amber,
  },
  section: {
    marginTop: spacing.xxxl,
  },
  sectionSupport: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.inkSoft,
  },
  fallbackNotice: {
    ...typography.caption,
    marginTop: spacing.sm,
    lineHeight: 18,
    color: colors.brandStrong,
  },
  documentList: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  documentCard: {
    minHeight: 92,
    padding: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  fileIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentCopy: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  documentTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  documentMeta: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  extensionPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  extensionText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 10,
  },
  openText: {
    ...typography.caption,
    color: colors.brand,
  },
  unavailableText: {
    color: colors.inkSoft,
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  stateCard: {
    minHeight: 200,
    marginTop: spacing.lg,
    padding: spacing.xxl,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  errorState: {
    backgroundColor: colors.redSoft,
    borderColor: '#F1CACA',
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF0EC',
  },
  stateTitle: {
    ...typography.title,
    marginTop: spacing.md,
    color: colors.ink,
    textAlign: 'center',
  },
  stateText: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  retryText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  contactCard: {
    marginTop: spacing.xxl,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactLabel: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  contactValue: {
    ...typography.bodyStrong,
    marginTop: 2,
    color: colors.ink,
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
    marginLeft: 58,
    backgroundColor: colors.line,
  },
  whatsappButton: {
    minHeight: 52,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green,
  },
  whatsappText: {
    ...typography.bodyStrong,
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.white,
  },
  faqList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  faqCard: {
    minHeight: 70,
    padding: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  faqNumber: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  faqNumberText: {
    ...typography.bodyStrong,
    color: colors.brandStrong,
  },
  faqText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.md,
    color: colors.ink,
  },
});
