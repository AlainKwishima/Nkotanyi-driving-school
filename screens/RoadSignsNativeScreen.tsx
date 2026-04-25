import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { getSignQuestions, type TrafficQuestion } from '../services/trafficApi';
import { hasLanguageAccess } from '../utils/subscriptionAccess';
import {
  buildRoadSignsCatalog,
  type RoadSignCategory,
  type RoadSignCategoryId,
  type RoadSignItem,
} from '../services/roadSignsData';

type Props = NativeStackScreenProps<RootStackParamList, 'RoadSignsNative'>;

function RoadSignsHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const { insets } = useResponsiveLayout();

  return (
    <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.headerLeft} activeOpacity={0.7} hitSlop={15}>
          <Ionicons name="chevron-back" size={28} color="#F6F8FE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerRight} />
      </View>
    </View>
  );
}

function CategoryRow({
  category,
  onPress,
}: {
  category: RoadSignCategory;
  onPress: () => void;
}) {
  const { t } = useI18n();
  return (
    <TouchableOpacity style={styles.categoryCard} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.categoryIconWrap}>
        <Image source={category.icon} style={styles.categoryIcon} resizeMode="contain" />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryLabel}>{category.title}</Text>
        <Text style={styles.categorySubLabel}>{t('roadsigns.categoryHint')}</Text>
      </View>
      <View style={styles.categoryArrowWrap}>
        <Ionicons name="chevron-forward" size={20} color="#4A78D0" />
      </View>
    </TouchableOpacity>
  );
}

function SignRow({
  item,
  onPress,
}: {
  item: RoadSignItem;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const source = item.imageSource ?? (item.imageUri ? { uri: item.imageUri } : undefined);

  return (
    <TouchableOpacity style={styles.signCard} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.signImageWrap}>
        {source ? <Image source={source} style={styles.signImage} resizeMode="contain" /> : null}
      </View>
      <View style={styles.signInfo}>
            <Text style={styles.signTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.viewDetailRow}>
              <Text style={styles.viewDetailText}>{t('roadsigns.viewDetails')}</Text>
              <Ionicons name="arrow-forward" size={12} color="#4A78D0" />
            </View>
      </View>
    </TouchableOpacity>
  );
}

function SignDetailModal({
  item,
  onClose,
}: {
  item: RoadSignItem;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const source = item.imageSource ?? (item.imageUri ? { uri: item.imageUri } : undefined);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose} hitSlop={15} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.modalImageWrap}>
            {source ? <Image source={source} style={styles.modalImage} resizeMode="contain" /> : null}
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{item.title}</Text>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescription}>{item.description}</Text>
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.modalDoneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.modalDoneText}>{t('roadsigns.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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

  const [signQuestions, setSignQuestions] = useState<TrafficQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<RoadSignCategoryId | null>(null);
  const [selectedItem, setSelectedItem] = useState<RoadSignItem | null>(null);

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

  const loadSigns = useCallback(async (token: string, cancelledRef: { current: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSignQuestions(token, contentLanguage);
      if (!cancelledRef.current) {
        setSignQuestions(data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        if (__DEV__) {
          console.warn('[RoadSigns] load failed', err);
        }
        setError(t('roadsigns.loadError'));
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, [contentLanguage, t]);

  useEffect(() => {
    const cancelledRef = { current: false };
    if (!languageAccessGranted || isSigningOut) {
      setLoading(false);
      return () => {
        cancelledRef.current = true;
      };
    }
    if (accessToken) {
      void loadSigns(accessToken, cancelledRef);
    } else {
      setLoading(false);
      setError(t('exam.needSignIn'));
    }
    return () => {
      cancelledRef.current = true;
    };
  }, [accessToken, isSigningOut, languageAccessGranted, loadSigns, t]);

  const catalog = useMemo(() => buildRoadSignsCatalog(t, signQuestions), [signQuestions, t]);
  const currentCategory = useMemo(
    () => catalog.find((c) => c.id === selectedCategoryId) ?? null,
    [catalog, selectedCategoryId],
  );
  const title = selectedCategoryId ? currentCategory?.title ?? t('reading.roadSigns') : t('reading.roadSigns');
  const showingList = selectedCategoryId != null && currentCategory != null;
  const signList = currentCategory?.items ?? [];

  const handleBack = useCallback(() => {
    if (selectedItem) {
      setSelectedItem(null);
      return;
    }
    if (selectedCategoryId) {
      setSelectedCategoryId(null);
      return;
    }
    navigation.goBack();
  }, [navigation, selectedCategoryId, selectedItem]);

  const handleSelectCategory = useCallback((id: RoadSignCategoryId) => {
    setSelectedCategoryId(id);
    setSelectedItem(null);
  }, []);

  const handleSelectItem = useCallback((item: RoadSignItem) => {
    setSelectedItem(item);
  }, []);

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <RoadSignsHeader title={title} onBack={handleBack} />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.scrollPad, { paddingBottom: tabScrollBottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
        >
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
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={32} color="#F25559" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  if (accessToken) {
                    void loadSigns(accessToken, { current: false });
                  }
                }}
                >
                <Text style={styles.retryText}>{t('roadsigns.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : showingList ? (
            <View style={styles.listWrap}>
              <Text style={styles.listCount}>
                {t('roadsigns.signCount', { count: signList.length, label: signList.length === 1 ? t('roadsigns.signSingular') : t('roadsigns.signPlural') })}
              </Text>
              {signList.map((item) => (
                <SignRow
                  key={item.id}
                  item={item}
                  onPress={() => handleSelectItem(item)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.listWrap}>
              <Text style={styles.listCount}>
                {t('roadsigns.categoryCount', { count: catalog.length })}
              </Text>
              {catalog.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  onPress={() => handleSelectCategory(category.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <BottomNavBar navigation={navigation} />

      {selectedItem ? (
        <SignDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
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
    fontSize: 18,
    color: '#F8FAFF',
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
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  listWrap: {
    gap: 16,
  },
  listCount: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  categoryCard: {
    minHeight: 88,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(74, 120, 208, 0.05)',
  },
  categoryIconWrap: {
    width: 72,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  categoryIcon: {
    width: 60,
    height: 48,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#1E293B',
  },
  categorySubLabel: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#64748B',
  },
  categoryArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 120, 208, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signCard: {
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(74, 120, 208, 0.05)',
  },
  signImageWrap: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  signImage: {
    width: 58,
    height: 58,
  },
  signInfo: {
    flex: 1,
    gap: 6,
  },
  signTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 21,
    color: '#1E293B',
  },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    color: '#4A78D0',
  },
  centerWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    marginTop: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#64748B',
  },
  errorWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 22,
    color: '#8E3F4A',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    height: 44,
    minWidth: 120,
    borderRadius: 22,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  retryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageWrap: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8FAFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  modalImage: {
    width: '90%',
    height: '90%',
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 22,
    lineHeight: 28,
    color: '#1E293B',
    textAlign: 'center',
  },
  modalDivider: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(74, 120, 208, 0.1)',
    marginVertical: 16,
  },
  modalScroll: {
    width: '100%',
    maxHeight: 180,
  },
  modalDescription: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
    paddingBottom: 8,
  },
  modalDoneBtn: {
    marginTop: 24,
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A78D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalDoneText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
