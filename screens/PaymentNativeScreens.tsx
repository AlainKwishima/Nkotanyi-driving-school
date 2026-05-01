import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth } from '../context/AuthContext';
import {
  checkPaymentStatus,
  initiateAirtelPayment,
  initiateCardPayment,
  initiateMomoPayment,
} from '../services/paymentApi';
import { extractPaymentReceipt, localeTagForContentLanguage } from '../services/paymentReceipt';
import { getMessageFromUnknownError } from '../services/api/client';
import { ApiError } from '../services/api/types';
import { toIntlRwandaPhone, toLocalRwandaPhone } from '../utils/phone';
import type { SubscriptionType } from '../services/api/subscriptionTypes';
import { fetchLiveSubscriptionPlans, type LiveSubscriptionPlan } from '../services/backendPricing';
import { clearPendingPayment, readPendingPayment, savePendingPayment, type PendingPaymentRecord } from '../services/pendingPaymentStore';
import { useI18n } from '../i18n/useI18n';
import {
  digitsOnly,
  validateCardNumber,
  validateCardExpiry,
  validateCvv,
  validateCardHolder,
} from '../utils/validation';

type SubscriptionProps = NativeStackScreenProps<RootStackParamList, 'SubscriptionNative'>;
type PaymentProps = NativeStackScreenProps<RootStackParamList, 'PaymentNative'>;
type ConfirmationProps = NativeStackScreenProps<RootStackParamList, 'PaymentConfirmationNative'>;
type Nav = SubscriptionProps['navigation'] | PaymentProps['navigation'] | ConfirmationProps['navigation'];

function Header({ title, onBack, navigation }: { title: string; onBack: () => void; navigation: Nav }) {
  const { insets } = useResponsiveLayout();
  return (
    <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.headerLeft} onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color="#F6F8FE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRight}>
          <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={20} />
        </View>
      </View>
    </View>
  );
}

function BottomTabs({ navigation }: { navigation: Nav }) {
  return <BottomNavBar navigation={navigation} />;
}

type Plan = {
  titleKey: string;
  price: string;
  amountRwf: number;
  /** Must match backend enum for `subscription_type` on payment APIs */
  subscriptionType: SubscriptionType;
  featured?: boolean;
  isActive?: boolean;
};
const PLAN_TITLE_KEYS: Record<SubscriptionType, string> = {
  monthly: 'payment.plan.month',
  'two-weekly': 'payment.plan.twoWeeks',
  weekly: 'payment.plan.week',
  daily: 'payment.plan.day',
  'five-exams': 'payment.plan.fiveExams',
  'two-exams': 'payment.plan.twoExams',
};

const PLAN_FEATURES: Record<SubscriptionType, string[]> = {
  'monthly': ['payment.feature.unlimited', 'payment.feature.duration30d', 'payment.feature2', 'payment.feature3'],
  'two-weekly': ['payment.feature.unlimited', 'payment.feature.duration14d', 'payment.feature2'],
  'weekly': ['payment.feature.unlimited', 'payment.feature.duration7d', 'payment.feature2'],
  'daily': ['payment.feature.unlimited', 'payment.feature.duration24h', 'payment.feature2'],
  'five-exams': ['payment.feature.exams5', 'payment.feature.duration24h'],
  'two-exams': ['payment.feature.exams2', 'payment.feature.duration24h'],
};

const PRICE_BY_LANGUAGE: Record<'rw' | 'en_fr', Partial<Record<SubscriptionType, number>>> = {
  rw: {
    'two-exams': 300,
    'five-exams': 500,
    daily: 2000,
    weekly: 5000,
    'two-weekly': 8000,
    monthly: 10000,
  },
  en_fr: {
    'five-exams': 1000,
    daily: 2000,
    weekly: 6000,
    'two-weekly': 10000,
    monthly: 15000,
  },
};

function resolvePaymentLanguageForPlan(
  subscriptionType: SubscriptionType,
  amountRwf: number,
  preferredLanguage: 'en' | 'rw' | 'fr',
): 'en' | 'rw' | 'fr' {
  if (PRICE_BY_LANGUAGE.rw[subscriptionType] === amountRwf) {
    return 'rw';
  }
  if (PRICE_BY_LANGUAGE.en_fr[subscriptionType] === amountRwf) {
    return preferredLanguage === 'fr' ? 'fr' : 'en';
  }
  return preferredLanguage;
}

function toPlanCard(plan: LiveSubscriptionPlan, locale: string): Plan {
  return {
    subscriptionType: plan.subscriptionType,
    amountRwf: plan.amountRwf,
    price: plan.amountRwf.toLocaleString(locale),
    titleKey: PLAN_TITLE_KEYS[plan.subscriptionType],
    featured: false, // Will be determined by scroll position
  };
}

function extractPaymentReference(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const objs: Record<string, unknown>[] = [];
  const root = payload as Record<string, unknown>;
  objs.push(root);
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) objs.push(root.data as Record<string, unknown>);
  if (root.payment && typeof root.payment === 'object' && !Array.isArray(root.payment)) objs.push(root.payment as Record<string, unknown>);
  if (root.result && typeof root.result === 'object' && !Array.isArray(root.result)) objs.push(root.result as Record<string, unknown>);
  const keys = [
    'transaction_id',
    'transactionId',
    'orderId',
    'order_id',
    'reference',
    'ref',
    'paymentId',
    'payment_id',
    'trx_id',
    'trxId',
    'uniqueTransactionId',
    'id',
    '_id',
  ];
  for (const obj of objs) {
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
}

function extractReqRef(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const root = payload as Record<string, unknown>;
  const objs: Record<string, unknown>[] = [root];
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) objs.push(root.data as Record<string, unknown>);
  if (root.payment && typeof root.payment === 'object' && !Array.isArray(root.payment)) objs.push(root.payment as Record<string, unknown>);
  if (root.result && typeof root.result === 'object' && !Array.isArray(root.result)) objs.push(root.result as Record<string, unknown>);

  for (const obj of objs) {
    const value = obj.reqRef ?? obj.req_ref ?? obj.requestRef ?? obj.request_ref;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function extractCheckoutLink(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const root = payload as Record<string, unknown>;
  const objs: Record<string, unknown>[] = [root];
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) objs.push(root.data as Record<string, unknown>);
  if (root.payment && typeof root.payment === 'object' && !Array.isArray(root.payment)) objs.push(root.payment as Record<string, unknown>);
  if (root.result && typeof root.result === 'object' && !Array.isArray(root.result)) objs.push(root.result as Record<string, unknown>);

  for (const obj of objs) {
    const value = obj.link ?? obj.url ?? obj.checkoutUrl ?? obj.checkout_url ?? obj.redirectUrl ?? obj.redirect_url;
    if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) return value.trim();
  }
  return null;
}

function looksLikeSuccessfulPayment(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const root = payload as Record<string, unknown>;
  const objs: Record<string, unknown>[] = [root];
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) objs.push(root.data as Record<string, unknown>);
  if (root.payment && typeof root.payment === 'object' && !Array.isArray(root.payment)) objs.push(root.payment as Record<string, unknown>);
  if (root.result && typeof root.result === 'object' && !Array.isArray(root.result)) objs.push(root.result as Record<string, unknown>);
  const truthyKeys = ['paymentStatus', 'paid', 'success', 'successful', 'confirmed', 'active', 'status'];
  for (const obj of objs) {
    if (obj.paymentStatus === true || obj.paid === true || obj.success === true || obj.successful === true || obj.confirmed === true || obj.active === true) {
      return true;
    }
    const status = String(obj.status ?? obj.state ?? obj.paymentStatus ?? '').toLowerCase().trim();
    if (['approved', 'active', 'completed', 'success', 'paid', 'successful', 'confirmed', 'valid', 'activated', 'successful'].includes(status)) {
      return true;
    }
    const message = String(obj.message ?? obj.msg ?? '').toLowerCase();
    if (message.includes('success')) return true;
    if (truthyKeys.some((k) => obj[k] === true)) return true;
  }
  return false;
}

function looksLikePendingPayment(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const root = payload as Record<string, unknown>;
  const objs: Record<string, unknown>[] = [root];
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) objs.push(root.data as Record<string, unknown>);
  if (root.payment && typeof root.payment === 'object' && !Array.isArray(root.payment)) objs.push(root.payment as Record<string, unknown>);
  if (root.result && typeof root.result === 'object' && !Array.isArray(root.result)) objs.push(root.result as Record<string, unknown>);
  for (const obj of objs) {
    const status = String(obj.status ?? obj.state ?? obj.paymentStatus ?? '').toLowerCase().trim();
    if (['pending', 'processing', 'initiated', 'waiting', 'queued', 'in progress', 'in-progress'].includes(status)) {
      return true;
    }
  }
  return false;
}

function looksLikeFailedPayment(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const root = payload as Record<string, unknown>;
  const objs: Record<string, unknown>[] = [root];
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) objs.push(root.data as Record<string, unknown>);
  if (root.payment && typeof root.payment === 'object' && !Array.isArray(root.payment)) objs.push(root.payment as Record<string, unknown>);
  if (root.result && typeof root.result === 'object' && !Array.isArray(root.result)) objs.push(root.result as Record<string, unknown>);
  for (const obj of objs) {
    const status = String(obj.status ?? obj.state ?? obj.paymentStatus ?? '').toLowerCase().trim();
    if (['failed', 'cancelled', 'canceled', 'rejected', 'expired', 'declined', 'unsuccessful'].includes(status)) {
      return true;
    }
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPaymentConfirmation(
  accessToken: string,
  probe: Record<string, unknown>,
  attempts = 8,
): Promise<unknown> {
  let last: unknown = null;
  for (let i = 0; i < attempts; i += 1) {
    last = await checkPaymentStatus(probe, accessToken);
    if (looksLikeSuccessfulPayment(last)) {
      return last;
    }
    if (!looksLikePendingPayment(last) && i > 0) {
      return last;
    }
    if (i < attempts - 1) {
      await sleep(3500);
    }
  }
  return last;
}

function buildPaymentProbe(
  body: {
    amount: number;
    payment_method: 'momo' | 'airtel' | 'card';
    phone: string;
    subscription_type: SubscriptionType;
    language?: 'en' | 'rw' | 'fr';
  },
  reference: string | null,
): Record<string, unknown> {
  const localPhone = toLocalRwandaPhone(body.phone) ?? body.phone;
  const intlPhone = toIntlRwandaPhone(body.phone) ?? (localPhone ? `250${localPhone.slice(1)}` : body.phone);
  return {
    amount: body.amount,
    amountRwf: body.amount,
    amount_rwf: body.amount,
    phone: localPhone,
    phoneIntl: intlPhone,
    msisdn: localPhone,
    msisdnIntl: intlPhone,
    customer_phone: localPhone,
    customer_phone_intl: intlPhone,
    phone_number: localPhone,
    phone_number_intl: intlPhone,
    phoneNumber: localPhone,
    payment_method: body.payment_method,
    paymentMethod: body.payment_method.toUpperCase(),
    subscription_type: body.subscription_type,
    subscriptionType: body.subscription_type,
    reference,
    ref: reference,
    orderId: reference,
    order_id: reference,
    transactionId: reference,
    transaction_id: reference,
    paymentId: reference,
    payment_id: reference,
    uniqueTransactionId: reference,
    reqRef: reference,
    req_ref: reference,
    requestRef: reference,
    language: body.language,
    lang: body.language,
  };
}

function PlanCard({
  plan,
  title,
  featureTexts,
  actionLabel,
  isActive,
  onPress,
}: {
  plan: Plan;
  title: string;
  featureTexts?: string[];
  actionLabel: string;
  isActive?: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();

  return (
    <View style={[styles.planCard, isActive && styles.planCardActive]}>
      <View style={styles.planCardHeader}>
        <View style={{ flex: 1 }}>
          {isActive ? <Text style={styles.bestValue}>{t('payment.bestValue').toUpperCase()}</Text> : null}
          <Text style={[styles.planTitle, isActive && styles.planTitleActive]}>{title}</Text>
        </View>
        <View style={styles.planPriceCol}>
          <Text style={[styles.planPrice, isActive && styles.planPriceActive]}>{plan.price}</Text>
          <Text style={[styles.planCurrency, isActive && styles.planCurrencyActive]}>RWF</Text>
        </View>
      </View>

      {isActive && featureTexts ? (
        <View style={styles.planFeatures}>
          {featureTexts.map((text) => (
            <View key={text} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={14} color="#D5E4FF" />
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.startNowBtn, isActive && styles.startNowBtnActive]}
        onPress={onPress}
      >
        <Text style={[styles.startNowText, isActive && styles.startNowTextActive]}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function SubscriptionNativeScreen({ navigation }: SubscriptionProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const { accessToken } = useAuth();
  const { hasSubscription, contentLanguage } = useAppFlow();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [activePlanIndex, setActivePlanIndex] = useState(0);

  const planActionLabel = hasSubscription ? t('payment.renewOrChangePlan') : t('payment.startNow');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setPricingLoading(true);
      setPricingError(null);
      try {
        const livePlans = await fetchLiveSubscriptionPlans(contentLanguage);
        if (!cancelled) {
          const locale = localeTagForContentLanguage(contentLanguage);
          // Sort plans by price (ascending) as requested
          const sorted = [...livePlans]
            .sort((a, b) => a.amountRwf - b.amountRwf)
            .map((plan) => toPlanCard(plan, locale));
          setPlans(sorted);
        }
      } catch (e) {
        if (!cancelled) {
          setPricingError(getMessageFromUnknownError(e));
          setPlans([]);
        }
      } finally {
        if (!cancelled) setPricingLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, contentLanguage]);

  const onScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    // Estimate card height: card height (approx 100-200) + margin (12)
    // We'll use a rough estimation to determine which card is in focus.
    // In a production app, we'd use onLayout to get exact heights.
    const cardHeight = 130;
    const index = Math.round(y / cardHeight);
    if (index !== activePlanIndex && index >= 0 && index < plans.length) {
      setActivePlanIndex(index);
    }
  };

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <Header title={t('subscription.title')} onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.scrollPad, { paddingBottom: tabScrollBottomPad + 40 }]}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <Text style={styles.subHeading}>{t('payment.investTitle')}</Text>
          <Text style={styles.subLead}>{t('payment.investBody')}</Text>

          {hasSubscription ? (
            <View style={styles.renewBanner}>
              <Ionicons name="information-circle-outline" size={20} color="#1F2B54" />
              <Text style={styles.renewBannerText}>{t('payment.activePlanRenewHint')}</Text>
            </View>
          ) : null}

          {pricingLoading ? (
            <View style={styles.pricingStatusCard}>
              <ActivityIndicator color="#4A78D0" />
              <Text style={styles.pricingStatusText}>{t('payment.loadingPlans')}</Text>
            </View>
          ) : pricingError ? (
            <View style={styles.pricingStatusCard}>
              <Text style={styles.pricingStatusError}>{pricingError}</Text>
            </View>
          ) : (
            plans.map((plan, index) => (
              <PlanCard
                key={plan.subscriptionType}
                plan={plan}
                isActive={index === activePlanIndex}
                title={t(PLAN_TITLE_KEYS[plan.subscriptionType])}
                featureTexts={PLAN_FEATURES[plan.subscriptionType].map((k) => t(k))}
                actionLabel={planActionLabel}
                onPress={() =>
                  navigation.navigate('PaymentNative', {
                    planTitle: t(PLAN_TITLE_KEYS[plan.subscriptionType]),
                    amountRwf: plan.amountRwf,
                    subscriptionType: plan.subscriptionType,
                    paymentLanguage: contentLanguage,
                  })
                }
              />
            ))
          )}

          <View style={styles.customPlanCard}>
            <Text style={styles.customPlanTitle}>{t('payment.customTitle')}</Text>
            <Text style={styles.customPlanText}>{t('payment.customBody')}</Text>
          </View>
        </ScrollView>
      </View>
      <BottomTabs navigation={navigation} />
    </ScreenColumn>
  );
}

export function PaymentNativeScreen({ navigation, route }: PaymentProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const { accessToken, refreshProfile, phone: profilePhone, userId } = useAuth();
  const {
    setHasSubscription,
    setCanChangeLanguage,
    setSubscriptionLanguage,
    contentLanguage,
    hasSubscription,
  } = useAppFlow();
  const [method, setMethod] = useState<'momo' | 'airtel' | 'card'>('momo');
  const [phoneInput, setPhoneInput] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    phone?: string;
    cardNumber?: string;
    cardHolder?: string;
    cardExpiry?: string;
    cardCvv?: string;
  }>({});
  const [payBusy, setPayBusy] = useState(false);
  const [livePlans, setLivePlans] = useState<Plan[]>([]);
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentRecord | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkingPending, setCheckingPending] = useState(false);
  const autoResumeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const live = await fetchLiveSubscriptionPlans(contentLanguage);
        if (!cancelled) {
          setLivePlans(live.map((plan) => toPlanCard(plan, localeTagForContentLanguage(contentLanguage))));
        }
      } catch {
        if (!cancelled) setLivePlans([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, contentLanguage]);

  const fallbackPlan =
    livePlans.find((plan) => plan.subscriptionType === route.params?.subscriptionType) ??
    livePlans[0] ??
    null;
  const subscriptionType =
    (route.params?.subscriptionType as SubscriptionType | undefined) ??
    fallbackPlan?.subscriptionType ??
    'daily';
  const amountRwf = route.params?.amountRwf ?? fallbackPlan?.amountRwf ?? 0;
  const planTitle = route.params?.planTitle ?? t(PLAN_TITLE_KEYS[subscriptionType]);
  const paymentLanguage = resolvePaymentLanguageForPlan(
    subscriptionType,
    amountRwf,
    route.params?.paymentLanguage ?? contentLanguage,
  );
  const fallbackCardPhone = profilePhone ? toLocalRwandaPhone(profilePhone.replace(/^250/, '0')) : null;

  useEffect(() => {
    if (profilePhone) {
      const local = toLocalRwandaPhone(profilePhone.replace(/^250/, '0'));
      if (local) setPhoneInput(local);
      else setPhoneInput(profilePhone);
    }
  }, [profilePhone]);

  useEffect(() => {
    setFieldErrors({});
  }, [method]);

  useEffect(() => {
    let cancelled = false;
    const loadPending = async () => {
      const stored = await readPendingPayment();
      if (cancelled) return;
      if (!stored) {
        setPendingPayment(null);
        return;
      }
      if (stored.userId && userId && stored.userId !== userId) {
        await clearPendingPayment();
        setPendingPayment(null);
        return;
      }
      setPendingPayment(stored);
      if (stored.checkoutUrl) {
        setCheckoutUrl(stored.checkoutUrl);
      }
    };
    void loadPending();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isCard = method === 'card';
  const isMomo = method === 'momo';

  const clearPendingState = async () => {
    setPendingPayment(null);
    setCheckoutUrl(null);
    setCheckoutVisible(false);
    autoResumeKeyRef.current = null;
    await clearPendingPayment();
  };

  const finalizeSuccessfulPayment = async (
    receipt: ReturnType<typeof extractPaymentReceipt>,
  ) => {
    let confirmedByProfile = false;
    for (let i = 0; i < 3; i += 1) {
      confirmedByProfile = await refreshProfile();
      if (confirmedByProfile) break;
      await sleep(1500);
    }

    await setHasSubscription(true);
    await setCanChangeLanguage(subscriptionType === 'monthly');
    await setSubscriptionLanguage(paymentLanguage);
    await clearPendingState();
    navigation.navigate('PaymentConfirmationNative', {
      planTitle,
      amountRwf,
      orderId: receipt.orderId,
      paidAtLabel: receipt.paidAtLabel,
    });
  };

  const persistPending = async (
    reqRef: string,
    receipt: ReturnType<typeof extractPaymentReceipt>,
    nextCheckoutUrl?: string | null,
    phone?: string | null,
  ) => {
    const record: PendingPaymentRecord = {
      reqRef,
      method,
      subscriptionType,
      amountRwf,
      language: paymentLanguage,
      planTitle,
      createdAt: new Date().toISOString(),
      orderId: receipt.orderId,
      checkoutUrl: nextCheckoutUrl ?? null,
      phone: phone ?? null,
      userId,
    };
    await savePendingPayment(record);
    setPendingPayment(record);
    setCheckoutUrl(nextCheckoutUrl ?? null);
  };

  const resumePendingPayment = async (record: PendingPaymentRecord, receiptOverride?: ReturnType<typeof extractPaymentReceipt>) => {
    if (!accessToken) {
      Alert.alert(t('payment.title'), t('payment.needSignIn'));
      return;
    }
    setCheckingPending(true);
    try {
      const statusPayload = await waitForPaymentConfirmation(accessToken, {
        reqRef: record.reqRef,
        req_ref: record.reqRef,
        requestRef: record.reqRef,
        language: record.language,
        lang: record.language,
      }, 10);

      if (looksLikeSuccessfulPayment(statusPayload)) {
        const receipt = receiptOverride ?? extractPaymentReceipt(statusPayload, record.language);
        await finalizeSuccessfulPayment(receipt);
        return;
      }

      if (looksLikeFailedPayment(statusPayload)) {
        await clearPendingState();
        Alert.alert(t('payment.failed'), t('payment.failed'));
        return;
      }

      if (record.checkoutUrl) {
        setCheckoutUrl(record.checkoutUrl);
        setCheckoutVisible(true);
        return;
      }

      Alert.alert(t('payment.title'), t('payment.pendingNotice'));
    } catch (e) {
      Alert.alert(t('payment.failed'), getMessageFromUnknownError(e));
    } finally {
      setCheckingPending(false);
    }
  };

  const recoverAmbiguousPayment = async (
    probe: Record<string, unknown>,
    receipt: ReturnType<typeof extractPaymentReceipt>,
    nextMethod: 'momo' | 'airtel' | 'card',
    phone?: string | null,
  ): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      const statusPayload = await checkPaymentStatus(probe, accessToken);
      const reqRef = extractReqRef(statusPayload) ?? (typeof probe.reqRef === 'string' ? probe.reqRef : null);
      const nextCheckoutUrl = extractCheckoutLink(statusPayload) ?? checkoutUrl;

      if (looksLikeSuccessfulPayment(statusPayload)) {
        await finalizeSuccessfulPayment(receipt);
        return true;
      }

      if ((looksLikePendingPayment(statusPayload) || nextCheckoutUrl) && reqRef) {
        const record: PendingPaymentRecord = {
          reqRef,
          method: nextMethod,
          subscriptionType,
          amountRwf,
          language: paymentLanguage,
          planTitle,
          createdAt: new Date().toISOString(),
          orderId: receipt.orderId,
          checkoutUrl: nextCheckoutUrl,
          phone: phone ?? null,
          userId,
        };
        await savePendingPayment(record);
        setPendingPayment(record);
        setCheckoutUrl(nextCheckoutUrl ?? null);
        if (nextCheckoutUrl) {
          setCheckoutVisible(true);
          return true;
        }
        Alert.alert(t('payment.title'), t('payment.pendingNotice'));
        return true;
      }
    } catch {
      // Fall through to the original network error so the user can retry deliberately.
    }
    return false;
  };

  useEffect(() => {
    if (!pendingPayment || !accessToken || payBusy || checkingPending || pendingPayment.checkoutUrl) return;
    if (autoResumeKeyRef.current === pendingPayment.reqRef) return;
    autoResumeKeyRef.current = pendingPayment.reqRef;
    void resumePendingPayment(pendingPayment);
  }, [accessToken, checkingPending, payBusy, pendingPayment]);

  const submitPayment = async () => {
    if (!accessToken) {
      Alert.alert(t('payment.title'), t('payment.needSignIn'));
      return;
    }
    if (amountRwf <= 0) {
      Alert.alert(t('payment.title'), t('payment.loadingPlans'));
      return;
    }
    if (pendingPayment) {
      await resumePendingPayment(pendingPayment);
      return;
    }
    if (!isCard) {
      const rawPhone = phoneInput.trim();
      if (!rawPhone) {
        setFieldErrors({ phone: t('validate.phoneRequired') });
        return;
      }
      const local = toLocalRwandaPhone(rawPhone);
      if (!local) {
        setFieldErrors({ phone: t('validate.phoneInvalid') });
        return;
      }
      setFieldErrors({});
      setPayBusy(true);
      try {
        const body = {
          amount: amountRwf,
          payment_method: method,
          phone: local,
          subscription_type: subscriptionType,
          language: paymentLanguage,
          lang: paymentLanguage,
        } as const;
        const paymentPayload =
          method === 'momo'
            ? await initiateMomoPayment(body, accessToken)
            : await initiateAirtelPayment(body, accessToken);
        const receipt = extractPaymentReceipt(paymentPayload, paymentLanguage);
        const reqRef = extractReqRef(paymentPayload);
        const reference = reqRef ?? extractPaymentReference(paymentPayload) ?? receipt.orderId.replace(/^#/, '');
        const probe = reqRef
          ? { reqRef, req_ref: reqRef, requestRef: reqRef, language: paymentLanguage, lang: paymentLanguage }
          : buildPaymentProbe(body, reference);

        if (reqRef) {
          await persistPending(reqRef, receipt, null, local);
        }

        const confirmedPayload = looksLikeSuccessfulPayment(paymentPayload)
          ? paymentPayload
          : reference
            ? await waitForPaymentConfirmation(accessToken, probe)
            : paymentPayload;

        const confirmed = looksLikeSuccessfulPayment(confirmedPayload);
        if (!confirmed) {
          const pending = looksLikePendingPayment(confirmedPayload);
          if (pending) {
            Alert.alert(t('payment.title'), t('payment.pendingNotice'));
            return;
          }
          if (looksLikeFailedPayment(confirmedPayload)) {
            await clearPendingState();
          }
          throw new Error(getMessageFromUnknownError(confirmedPayload));
        }
        const finalReceipt = extractPaymentReceipt(confirmedPayload, paymentLanguage);
        await finalizeSuccessfulPayment(finalReceipt.orderId ? finalReceipt : receipt);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 0 || e.status === 408)) {
          const recovered = await recoverAmbiguousPayment(
            buildPaymentProbe(
              {
                amount: amountRwf,
                payment_method: method,
                phone: local,
                subscription_type: subscriptionType,
                language: paymentLanguage,
              },
              null,
            ),
            extractPaymentReceipt({}, paymentLanguage),
            method,
            local,
          );
          if (recovered) return;
        }
        const msg = getMessageFromUnknownError(e);
        Alert.alert(t('payment.failed'), msg);
      } finally {
        setPayBusy(false);
      }
      return;
    }

    const err: typeof fieldErrors = {};
    const cn = validateCardNumber(cardNumber);
    if (!cn.ok) err.cardNumber = t(cn.key);
    const ch = validateCardHolder(cardHolder);
    if (!ch.ok) err.cardHolder = t(ch.key);
    const ce = validateCardExpiry(cardExpiry);
    if (!ce.ok) err.cardExpiry = t(ce.key);
    const cv = validateCvv(cardCvv);
    if (!cv.ok) err.cardCvv = t(cv.key);
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }
    if (!fallbackCardPhone) {
      Alert.alert(t('payment.failed'), t('payment.phoneInvalid'));
      return;
    }
    setFieldErrors({});

    setPayBusy(true);
    try {
      const paymentPayload = await initiateCardPayment(
        {
          amount: amountRwf,
          payment_method: 'card',
          subscription_type: subscriptionType,
          phone: fallbackCardPhone,
          language: paymentLanguage,
          lang: paymentLanguage,
          card_number: digitsOnly(cardNumber),
          card_name: cardHolder.trim(),
          card_cvc: digitsOnly(cardCvv),
          card_expdate: cardExpiry.trim(),
        },
        accessToken,
      );
      const receipt = extractPaymentReceipt(paymentPayload, paymentLanguage);
      const reqRef = extractReqRef(paymentPayload);
      const nextCheckoutUrl = extractCheckoutLink(paymentPayload);
      const reference = reqRef ?? extractPaymentReference(paymentPayload) ?? receipt.orderId.replace(/^#/, '');

      if (reqRef) {
        await persistPending(reqRef, receipt, nextCheckoutUrl, fallbackCardPhone);
      }

      if (nextCheckoutUrl) {
        setCheckoutVisible(true);
      }

      if (looksLikeSuccessfulPayment(paymentPayload)) {
        await finalizeSuccessfulPayment(receipt);
        return;
      }

      if (looksLikePendingPayment(paymentPayload) || reqRef || nextCheckoutUrl) {
        if (!nextCheckoutUrl && reqRef) {
          await resumePendingPayment(
            {
              reqRef,
              method: 'card',
              subscriptionType,
              amountRwf,
              language: paymentLanguage,
              planTitle,
              createdAt: new Date().toISOString(),
              orderId: receipt.orderId,
              checkoutUrl: nextCheckoutUrl,
              phone: fallbackCardPhone,
              userId,
            },
            receipt,
          );
        }
        return;
      }

      if (looksLikeFailedPayment(paymentPayload)) {
        await clearPendingState();
      }
      throw new Error(reference ? `${t('payment.failed')} (${reference})` : t('payment.failed'));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 0 || e.status === 408)) {
        const recovered = await recoverAmbiguousPayment(
          buildPaymentProbe(
            {
              amount: amountRwf,
              payment_method: 'card',
              phone: fallbackCardPhone,
              subscription_type: subscriptionType,
              language: paymentLanguage,
            },
            null,
          ),
          extractPaymentReceipt({}, paymentLanguage),
          'card',
          fallbackCardPhone,
        );
        if (recovered) return;
      }
      Alert.alert(t('payment.failed'), getMessageFromUnknownError(e));
    } finally {
      setPayBusy(false);
    }
  };

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <Header title={t('payment.title')} onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={[styles.scrollPad, { paddingBottom: tabScrollBottomPad }]} showsVerticalScrollIndicator={false}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{t('profile.subscriptionPlan')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SubscriptionNative')}>
              <Text style={styles.changeLink}>{t('payment.change')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.subscriptionPlanCard}>
            <View style={styles.planIconSquare}>
              <MaterialCommunityIcons name="cog-outline" size={20} color="#F5F8FE" />
            </View>
            <Text style={styles.standardDaily}>{planTitle}</Text>
            <Text style={styles.amountBlue}>
              {amountRwf.toLocaleString(localeTagForContentLanguage(contentLanguage))} Rwf
            </Text>
          </View>

          {pendingPayment ? (
            <View style={styles.pendingCard}>
              <View style={styles.pendingHeaderRow}>
                <Ionicons name="time-outline" size={18} color="#1D4ED8" />
                <Text style={styles.pendingTitle}>{t('payment.pendingTitle')}</Text>
              </View>
              <Text style={styles.pendingBody}>{t('payment.pendingBody')}</Text>
              <TouchableOpacity
                style={styles.pendingActionBtn}
                disabled={checkingPending}
                onPress={() => void resumePendingPayment(pendingPayment)}
              >
                {checkingPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.pendingActionText}>{t('payment.resumePending')}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>{t('payment.selectMethod')}</Text>
          <View style={styles.methodsRow}>
            {[
              { key: 'momo' as const, label: t('payment.methodMomo'), brand: 'MTN', icon: 'phone-portrait-outline' as const, iconBg: '#FFCC00', iconColor: '#1F2B54' },
              { key: 'airtel' as const, label: t('payment.methodAirtel'), brand: 'A', icon: 'radio-outline' as const, iconBg: '#E3242B', iconColor: '#FFFFFF' },
              { key: 'card' as const, label: t('payment.methodCard'), brand: 'CARD', icon: 'card-outline' as const, iconBg: '#E4E5E8', iconColor: '#4F5564' },
            ].map((m) => {
              const active = method === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.methodCard, active && styles.methodCardActive]}
                  onPress={() => {
                    setMethod(m.key);
                    setFieldErrors({});
                  }}
                >
                  <View style={[styles.methodIconWrap, { backgroundColor: m.iconBg }]}>
                    {m.brand.length === 1 ? (
                      <Text style={[styles.methodBrandSingle, { color: m.iconColor }]}>{m.brand}</Text>
                    ) : m.brand === 'MTN' ? (
                      <Text style={[styles.methodBrand, { color: m.iconColor }]}>{m.brand}</Text>
                    ) : (
                      <Ionicons name={m.icon} size={18} color={m.iconColor} />
                    )}
                  </View>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  {active ? (
                    <View style={styles.checkDot}><Ionicons name="checkmark" size={10} color="#FFFFFF" /></View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>{t('payment.details')}</Text>
          <View style={styles.detailsCard}>
            {isCard ? (
              <>
                <Text style={styles.inputLabel}>{t('payment.cardNumber')}</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#A6ACB9"
                  keyboardType="number-pad"
                  value={cardNumber}
                  onChangeText={(v) => {
                    setCardNumber(v);
                    setFieldErrors((e) => ({ ...e, cardNumber: undefined }));
                  }}
                />
                {fieldErrors.cardNumber ? <Text style={styles.fieldError}>{fieldErrors.cardNumber}</Text> : null}

                <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>{t('payment.cardHolder')}</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder={t('payment.placeholderName')}
                  placeholderTextColor="#A6ACB9"
                  value={cardHolder}
                  onChangeText={(v) => {
                    setCardHolder(v);
                    setFieldErrors((e) => ({ ...e, cardHolder: undefined }));
                  }}
                />
                {fieldErrors.cardHolder ? <Text style={styles.fieldError}>{fieldErrors.cardHolder}</Text> : null}

                <View style={styles.cardRow}>
                  <View style={styles.cardCol}>
                    <Text style={styles.inputLabel}>{t('payment.expiry')}</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="MM/YY"
                      placeholderTextColor="#A6ACB9"
                      value={cardExpiry}
                      onChangeText={(v) => {
                        setCardExpiry(v);
                        setFieldErrors((e) => ({ ...e, cardExpiry: undefined }));
                      }}
                    />
                    {fieldErrors.cardExpiry ? <Text style={styles.fieldError}>{fieldErrors.cardExpiry}</Text> : null}
                  </View>
                  <View style={styles.cardCol}>
                    <Text style={styles.inputLabel}>{t('payment.cvv')}</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="123"
                      placeholderTextColor="#A6ACB9"
                      keyboardType="number-pad"
                      secureTextEntry
                      value={cardCvv}
                      onChangeText={(v) => {
                        setCardCvv(v);
                        setFieldErrors((e) => ({ ...e, cardCvv: undefined }));
                      }}
                    />
                    {fieldErrors.cardCvv ? <Text style={styles.fieldError}>{fieldErrors.cardCvv}</Text> : null}
                  </View>
                </View>
                <Text style={styles.inputHint}>{t('payment.cardHint')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>{t('auth.phone')}</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder={t('payment.phonePh')}
                  placeholderTextColor="#A6ACB9"
                  keyboardType="phone-pad"
                  value={phoneInput}
                  onChangeText={(v) => {
                    setPhoneInput(v);
                    setFieldErrors((e) => ({ ...e, phone: undefined }));
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {fieldErrors.phone ? <Text style={styles.fieldError}>{fieldErrors.phone}</Text> : null}
                <Text style={styles.inputHint}>{t('payment.phoneFormatsHint')}</Text>
                <Text style={styles.inputHint}>{isMomo ? t('payment.momoHint') : t('payment.airtelHint')}</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.payNowBtn} onPress={() => void submitPayment()} disabled={payBusy || checkingPending}>
            {payBusy || checkingPending ? (
              <ActivityIndicator color="#F5F8FE" />
            ) : (
              <>
                <MaterialCommunityIcons name="lock-outline" size={16} color="#F5F8FE" />
                <Text style={styles.payNowText}>
                  {pendingPayment
                    ? t('payment.resumePending')
                    : hasSubscription
                      ? t('payment.completeUpdate')
                      : t('payment.payNow')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.secureInfo}>{t('payment.secure')}</Text>
        </ScrollView>
      </View>
      <BottomTabs navigation={navigation} />
      <Modal visible={checkoutVisible && !!checkoutUrl} transparent animationType="slide" onRequestClose={() => setCheckoutVisible(false)}>
        <View style={styles.checkoutBackdrop}>
          <View style={styles.checkoutSheet}>
            <View style={styles.checkoutHeader}>
              <Text style={styles.checkoutTitle}>{t('payment.checkoutTitle')}</Text>
              <TouchableOpacity onPress={() => setCheckoutVisible(false)} style={styles.checkoutCloseBtn}>
                <Ionicons name="close" size={22} color="#1E293B" />
              </TouchableOpacity>
            </View>
            {checkoutUrl ? (
              <WebView
                source={{ uri: checkoutUrl }}
                startInLoadingState
                setSupportMultipleWindows={false}
                javaScriptEnabled
                domStorageEnabled
                onShouldStartLoadWithRequest={(request) => request.url === 'about:blank' || /^https?:\/\//i.test(request.url)}
                onLoadEnd={() => {
                  if (pendingPayment) {
                    void resumePendingPayment(pendingPayment);
                  }
                }}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </ScreenColumn>
  );
}

export function PaymentConfirmationNativeScreen({ navigation, route }: ConfirmationProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const { contentLanguage } = useAppFlow();
  const planTitle = route.params?.planTitle ?? t('payment.confirmPlanFallback');
  const amountRwf = route.params?.amountRwf ?? 0;
  const locale = localeTagForContentLanguage(contentLanguage);
  const fallbackReceipt = useMemo(() => extractPaymentReceipt({}, contentLanguage), [contentLanguage]);
  const orderIdDisplay = route.params?.orderId ?? fallbackReceipt.orderId;
  const paidAtDisplay = route.params?.paidAtLabel ?? fallbackReceipt.paidAtLabel;
  const amountFormatted = amountRwf.toLocaleString(locale, { maximumFractionDigits: 0 });

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <Header title={t('payment.title')} onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={[styles.scrollPad, { paddingBottom: tabScrollBottomPad }]} showsVerticalScrollIndicator={false}>
          <View style={styles.successSquare}>
            <Ionicons name="checkmark-circle" size={28} color="#F5F8FE" />
          </View>

          <Text style={styles.successTitle}>{t('payment.confirmTitle')}</Text>
          <Text style={styles.successSubtitle}>{t('payment.confirmSubtitle', { plan: planTitle })}</Text>

          <View style={styles.confirmationCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.confirmHeader}>{planTitle.toUpperCase()}</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{t('payment.active').toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmKey}>{t('payment.orderId')}</Text>
              <Text style={styles.confirmValue}>{orderIdDisplay}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmKey}>{t('payment.amount')}</Text>
              <Text style={styles.confirmValue}>{amountFormatted} RWF</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmKey}>{t('payment.date')}</Text>
              <Text style={styles.confirmValue}>{paidAtDisplay}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.payNowBtn} onPress={() => navigation.navigate('HomeNative')}>
            <Text style={styles.payNowText}>{t('payment.goHome')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startExamOutline} onPress={() => navigation.navigate('ExamInstructionsNative')}>
            <Text style={styles.startExamOutlineText}>{t('payment.startExam')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startExamOutline} onPress={() => navigation.navigate('SubscriptionNative')}>
            <Text style={styles.startExamOutlineText}>{t('payment.managePlans')}</Text>
          </TouchableOpacity>

          <Text style={styles.receiptNote}>{t('payment.receiptNote')}</Text>
        </ScrollView>
      </View>
      <BottomTabs navigation={navigation} />
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
    color: '#F7F9FE',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: '#F3F5FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    marginTop: -20,
  },
  scrollPad: { paddingHorizontal: 20, paddingTop: 24 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  subHeading: {
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    lineHeight: 28,
    color: '#14265A',
  },
  subLead: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#646C7D',
  },
  renewBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#D8E4FA',
  },
  renewBannerText: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 18,
    color: '#1F2B54',
  },
  planCard: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  planCardActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bestValue: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 9,
    lineHeight: 12,
    color: '#F6F8FF',
  },
  planTitle: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 20, color: '#1E293B' },
  planTitleActive: { color: '#FFFFFF' },
  planPriceCol: { alignItems: 'flex-end' },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 },
  planPrice: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 32, color: '#1E293B' },
  planPriceActive: { color: '#FFFFFF' },
  planCurrency: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: '#64748B' },
  planCurrencyActive: { color: '#BFDBFE' },
  planFeatures: { marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureText: { marginLeft: 10, fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: '#E0E7FF' },
  startNowBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startNowBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  startNowText: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 15, color: '#2563EB' },
  startNowTextActive: { color: '#2563EB' },
  customPlanCard: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#C6CEDD',
    paddingVertical: 14,
    alignItems: 'center',
  },
  customPlanTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, lineHeight: 26, color: '#22315A' },
  customPlanText: { marginTop: 4, textAlign: 'center', fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, lineHeight: 17, color: '#5D6678' },
  pricingStatusCard: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#DDE3EF',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 84,
  },
  pricingStatusText: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 17,
    color: '#41506E',
  },
  pricingStatusError: {
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 17,
    color: '#B03030',
  },

  sectionTitle: { marginTop: 10, marginBottom: 10, fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, lineHeight: 24, color: '#252A35' },
  changeLink: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12, lineHeight: 18, color: '#4A78D0' },
  subscriptionPlanCard: {
    borderRadius: 10,
    backgroundColor: '#ECECF0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIconSquare: { width: 42, height: 42, borderRadius: 6, backgroundColor: '#4A78D0', alignItems: 'center', justifyContent: 'center' },
  standardDaily: { marginLeft: 12, flex: 1, fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, lineHeight: 22, color: '#252A35' },
  amountBlue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, lineHeight: 22, color: '#4A78D0' },
  pendingCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    padding: 14,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  pendingHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  pendingTitle: {
    marginLeft: 8,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14,
    color: '#1E3A8A',
  },
  pendingBody: {
    marginTop: 8,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 18,
    color: '#1E3A8A',
  },
  pendingActionBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingActionText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14,
    color: '#FFFFFF',
  },

  methodsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  methodCard: {
    width: '31.4%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  methodCardActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  methodIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBrand: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 11, lineHeight: 14 },
  methodBrandSingle: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 18, lineHeight: 20 },
  methodLabel: { marginTop: 6, fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, lineHeight: 14, color: '#4F5564' },
  checkDot: { position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: '#1F2B54', alignItems: 'center', justifyContent: 'center' },

  detailsCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  inputLabel: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 12, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputLabelSpacing: { marginTop: 14 },
  inputField: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#1E293B',
  },
  cardRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  cardCol: { width: '48%' },
  phoneInputRow: {
    height: 42,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E1E2E8',
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: { fontSize: 12 },
  countryCode: { marginLeft: 6, fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, lineHeight: 16, color: '#434956' },
  phoneDivider: { width: 1, height: 18, backgroundColor: '#DADDE4', marginHorizontal: 8 },
  phoneInput: { flex: 1, fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, lineHeight: 16, color: '#434956', paddingVertical: 0 },
  inputHint: { marginTop: 8, fontFamily: 'PlusJakartaSans-Regular', fontStyle: 'italic', fontSize: 11, lineHeight: 16, color: '#737A89' },
  fieldError: {
    marginTop: 6,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    lineHeight: 15,
    color: '#B03030',
  },

  payNowBtn: {
    marginTop: 24,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  payNowText: { marginLeft: 8, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 16, color: '#FFFFFF' },
  secureInfo: { marginTop: 16, textAlign: 'center', fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, color: '#94A3B8' },
  checkoutBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  checkoutSheet: {
    height: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  checkoutHeader: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  checkoutTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 16,
    color: '#1E293B',
  },
  checkoutCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },

  successSquare: {
    marginTop: 24,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  successTitle: { marginTop: 24, textAlign: 'center', fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 24, color: '#1E293B' },
  successSubtitle: { marginTop: 8, textAlign: 'center', fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: '#64748B' },

  confirmationCard: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  confirmHeader: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 15, color: '#475569' },
  activePill: { borderRadius: 12, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 4 },
  activePillText: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 10, color: '#FFFFFF' },
  confirmRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmKey: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: '#64748B' },
  confirmValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: '#1E293B' },

  startExamOutline: {
    marginTop: 12,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startExamOutlineText: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 16, color: '#475569' },
  receiptNote: { marginTop: 20, textAlign: 'center', fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, color: '#94A3B8' },

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
