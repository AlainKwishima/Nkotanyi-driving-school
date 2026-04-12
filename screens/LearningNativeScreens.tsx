import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAuth } from '../context/AuthContext';
import { getPdfs, type PdfItem } from '../services/contentApi';
import { getMessageFromUnknownError } from '../services/api/client';
import { useI18n } from '../i18n/useI18n';

type ReadProps = NativeStackScreenProps<RootStackParamList, 'ReadingNative'>;
type ListProps = NativeStackScreenProps<RootStackParamList, 'RoadSignsListNative'>;
type DetailProps = NativeStackScreenProps<RootStackParamList, 'RoadSignsDetailNative'>;
type HelpProps = NativeStackScreenProps<RootStackParamList, 'HelpCenterNative'>;
type AnyNav = ReadProps['navigation'] | ListProps['navigation'] | DetailProps['navigation'] | HelpProps['navigation'];

const ROAD_ITEMS = [
  'Railway crossing with a barrier',
  'Single-track railway',
  'Crossing the tram line',
  'Crossing of equivalent roads',
  'Light regulation',
  'Crossing with circular motion',
];

const ROAD_ICONS = [
  require('../assets/ui/road_sign_1.png'),
  require('../assets/ui/road_sign_2.png'),
  require('../assets/ui/road_sign_3.png'),
  require('../assets/ui/road_sign_4.png'),
  require('../assets/ui/road_sign_5.png'),
  require('../assets/ui/road_sign_6.png'),
];
const ROAD_SIGN_DETAILS = [
  {
    title: 'Railway crossing with a barrier',
    description:
      'This sign warns drivers about an upcoming railway crossing protected by barriers. Reduce speed, observe signals, and stop when required.',
  },
  {
    title: 'Single-track railway',
    description:
      'This sign indicates a single-track railway crossing ahead. Approach with caution and ensure the track is clear before crossing.',
  },
  {
    title: 'Crossing the tram line',
    description:
      'This sign warns of a tram crossing point. Always yield where required and keep the crossing clear for rail vehicles.',
  },
  {
    title: 'Crossing of equivalent roads',
    description:
      'This sign marks an intersection where roads have equal priority. Slow down and apply right-of-way rules carefully.',
  },
  {
    title: 'Light regulation',
    description:
      'This sign indicates a traffic-light-controlled area ahead. Be prepared to stop safely and follow light indications strictly.',
  },
  {
    title: 'Crossing with circular motion',
    description:
      'This sign indicates a roundabout ahead. Reduce speed, yield appropriately, and follow the circular direction of travel.',
  },
];
function TopHeader({
  title,
  onBack,
  navigation,
}: {
  title: string;
  onBack: () => void;
  navigation: AnyNav;
}) {
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

function BottomTabs({ navigation }: { navigation: AnyNav }) {
  return <BottomNavBar navigation={navigation} />;
}

function ReadRow({
  color,
  icon,
  title,
  onPress,
}: {
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.readRow} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.readIconBox, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={[styles.readText, { color }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#2A3762" />
    </TouchableOpacity>
  );
}

function SignRow({ text, icon, onPress }: { text: string; icon: any; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.signRow} onPress={onPress} activeOpacity={0.9}>
      <Image source={icon} style={styles.signIcon} resizeMode="contain" />
      <Text style={styles.signText}>{text}</Text>
    </TouchableOpacity>
  );
}

function pdfOpenUrl(item: PdfItem): string | undefined {
  const u = item.pdfURL ?? item.url ?? item.fileUrl;
  return typeof u === 'string' && u.startsWith('http') ? u : undefined;
}

export function ReadingNativeScreen({ navigation }: ReadProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const { accessToken } = useAuth();
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      setPdfLoading(true);
      setPdfError(null);
      try {
        const list = await getPdfs(accessToken);
        if (!cancelled) setPdfs(list);
      } catch (e) {
        if (!cancelled) setPdfError(getMessageFromUnknownError(e));
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <TopHeader title={t('reading.title')} onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={[styles.readListPad, { paddingBottom: tabScrollBottomPad }]} showsVerticalScrollIndicator={false}>
          {accessToken ? (
            <View style={styles.pdfBlock}>
              <Text style={styles.pdfSectionTitle}>{t('reading.pdfSection')}</Text>
              {pdfLoading ? <ActivityIndicator style={styles.pdfSpinner} color="#4A78D0" /> : null}
              {pdfError ? <Text style={styles.pdfError}>{pdfError}</Text> : null}
              {!pdfLoading && !pdfError && pdfs.length === 0 ? (
                <Text style={styles.pdfEmpty}>{t('reading.pdfEmpty')}</Text>
              ) : null}
              {pdfs.map((pdf, idx) => {
                const url = pdfOpenUrl(pdf);
                const label = (pdf.title ?? pdf.name ?? t('reading.materialFallback', { n: idx + 1 })).trim();
                return (
                  <ReadRow
                    key={pdf._id ?? `${label}-${idx}`}
                    color="#6B7C93"
                    icon="document-attach-outline"
                    title={label}
                    onPress={() => {
                      if (url) void Linking.openURL(url);
                      else Alert.alert(t('reading.pdfAlertTitle'), t('reading.pdfNoLink'));
                    }}
                  />
                );
              })}
            </View>
          ) : null}
          <ReadRow color="#4A78D0" icon="language" title={t('reading.roadSigns')} onPress={() => navigation.navigate('RoadSignsListNative')} />
          <ReadRow color="#F3BC2F" icon="create-outline" title={t('reading.policeGestures')} onPress={() => navigation.navigate('HelpCenterNative')} />
          <ReadRow color="#2EA86A" icon="git-network-outline" title={t('reading.carSigns')} onPress={() => navigation.navigate('RoadSignsListNative')} />
          <ReadRow color="#F05555" icon="reader-outline" title={t('reading.study')} onPress={() => navigation.navigate('RoadSignsDetailNative')} />
          <ReadRow color="#F0914B" icon="document-text-outline" title={t('reading.practice')} onPress={() => navigation.navigate('PracticeNoSelectedNative')} />
        </ScrollView>
      </View>
      <BottomTabs navigation={navigation} />
    </ScreenColumn>
  );
}

export function RoadSignsListNativeScreen({ navigation }: ListProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <TopHeader title={t('reading.warningSigns')} onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={[styles.signListPad, { paddingBottom: tabScrollBottomPad }]} showsVerticalScrollIndicator={false}>
          {ROAD_ITEMS.concat(ROAD_ITEMS).map((item, idx) => (
            <SignRow
              key={`${item}-${idx}`}
              text={item}
              icon={ROAD_ICONS[idx % ROAD_ICONS.length]}
              onPress={() => navigation.navigate('RoadSignsDetailNative')}
            />
          ))}
        </ScrollView>
      </View>
      <BottomTabs navigation={navigation} />
    </ScreenColumn>
  );
}

export function RoadSignsDetailNativeScreen({ navigation }: DetailProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const [detailIndex, setDetailIndex] = useState(0);
  const canGoPrev = detailIndex > 0;
  const canGoNext = detailIndex < ROAD_SIGN_DETAILS.length - 1;
  const activeDetail = ROAD_SIGN_DETAILS[detailIndex];

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <TopHeader title={t('reading.warningSigns')} onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={[styles.signListPad, { paddingBottom: tabScrollBottomPad }]} showsVerticalScrollIndicator={false}>
          {ROAD_ITEMS.concat(ROAD_ITEMS).map((item, idx) => (
            <SignRow key={`${item}-${idx}`} text={item} icon={ROAD_ICONS[idx % ROAD_ICONS.length]} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.overlay} />
      <View style={styles.modal}>
        <TouchableOpacity style={styles.modalClose} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#8895B2" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{activeDetail.title}</Text>
        <Image source={ROAD_ICONS[detailIndex]} style={styles.modalSign} resizeMode="contain" />
        <Text style={styles.modalText}>{activeDetail.description}</Text>

        <View style={styles.detailPagerRow}>
          <TouchableOpacity
            style={[styles.detailPagerBtn, !canGoPrev && styles.detailPagerBtnDisabled]}
            onPress={() => canGoPrev && setDetailIndex((prev) => prev - 1)}
            disabled={!canGoPrev}
          >
            <Ionicons name="arrow-back" size={16} color="#364162" />
            <Text style={styles.detailPagerText}>{t('exam.previous')}</Text>
          </TouchableOpacity>

          <Text style={styles.detailPagerIndex}>
            {detailIndex + 1}/{ROAD_SIGN_DETAILS.length}
          </Text>

          <TouchableOpacity
            style={[styles.detailPagerBtnBlue, !canGoNext && styles.detailPagerBtnBlueDisabled]}
            onPress={() => canGoNext && setDetailIndex((prev) => prev + 1)}
            disabled={!canGoNext}
          >
            <Text style={styles.detailPagerTextBlue}>{t('exam.next')}</Text>
            <Ionicons name="arrow-forward" size={16} color="#F5F7FC" />
          </TouchableOpacity>
        </View>
      </View>

      <BottomTabs navigation={navigation} />
    </ScreenColumn>
  );
}

export function HelpCenterNativeScreen({ navigation }: HelpProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const faqs = [t('reading.faq1'), t('reading.faq2'), t('reading.faq3'), t('reading.faq4')];

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <TopHeader title={t('menu.help')} onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={[styles.readListPad, { paddingBottom: tabScrollBottomPad }]} showsVerticalScrollIndicator={false}>
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
            <View style={[styles.contactRow, styles.contactRowBottom]}>
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
            <TouchableOpacity key={q} style={styles.faqCard} activeOpacity={0.9}>
              <Text style={styles.faqText}>{q}</Text>
              <Ionicons name="chevron-down" size={16} color="#7A8091" />
            </TouchableOpacity>
          ))}

          <Image source={require('../assets/visual.png')} style={styles.helpBanner} resizeMode="cover" />
        </ScrollView>
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
  headerIconBtn: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, lineHeight: 24, color: '#F7F9FE' },
  body: {
    flex: 1,
    backgroundColor: '#CBD3E0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  readListPad: { padding: 14 },
  pdfBlock: { marginBottom: 8 },
  pdfSectionTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2A52',
    marginBottom: 10,
  },
  pdfSpinner: { alignSelf: 'flex-start', marginBottom: 8 },
  pdfError: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 18,
    color: '#9A3D3D',
    marginBottom: 8,
  },
  pdfEmpty: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 18,
    color: '#5C6474',
    marginBottom: 8,
  },
  readRow: {
    height: 70,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  readIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readText: {
    marginLeft: 16,
    flex: 1,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 22,
  },
  signListPad: { padding: 14 },
  signRow: {
    height: 58,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  signIcon: { width: 32, height: 32 },
  signText: {
    marginLeft: 14,
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#2D3668',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(73,82,105,0.42)',
  },
  modal: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 90,
    borderRadius: 14,
    backgroundColor: '#F7F7F8',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalClose: { position: 'absolute', right: 10, top: 8, zIndex: 2 },
  modalTitle: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    lineHeight: 24,
    color: '#2A3462',
  },
  modalSign: { width: 150, height: 124, alignSelf: 'center', marginTop: 10 },
  modalText: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: '#3D4370',
  },
  detailPagerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailPagerBtn: {
    width: '34%',
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6E8EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPagerBtnDisabled: { opacity: 0.5 },
  detailPagerText: {
    marginLeft: 5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#364162',
  },
  detailPagerIndex: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#4C5576',
  },
  detailPagerBtnBlue: {
    width: '34%',
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A78D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPagerBtnBlueDisabled: { opacity: 0.7 },
  detailPagerTextBlue: {
    marginRight: 5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#F5F7FC',
  },
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
  helpSectionTitle: {
    marginTop: 10,
    marginBottom: 10,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 34 / 2,
    lineHeight: 44 / 2,
    color: '#25325C',
  },
  contactCard: {
    borderRadius: 10,
    backgroundColor: '#ECECF0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactRowBottom: { marginBottom: 0 },
  contactIconCircle: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    minHeight: 44,
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
  helpBanner: {
    marginTop: 14,
    height: 140,
    borderRadius: 0,
  },
});

