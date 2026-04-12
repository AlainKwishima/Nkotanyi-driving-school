import React, { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth } from '../context/AuthContext';
import { initiateAirtelPayment, initiateCardPayment, initiateMomoPayment } from '../services/paymentApi';
import { extractPaymentReceipt, localeTagForContentLanguage } from '../services/paymentReceipt';
import { getMessageFromUnknownError } from '../services/api/client';
import { toLocalRwandaPhone } from '../utils/phone';
import type { SubscriptionType } from '../services/api/subscriptionTypes';
import { useI18n } from '../i18n/useI18n';
import {
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
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
        <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={14} />
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
};
const PLAN_DEFS: Plan[] = [
  { titleKey: 'payment.plan.month', price: '15,000', amountRwf: 15000, subscriptionType: 'monthly', featured: true },
  { titleKey: 'payment.plan.twoWeeks', price: '10,000', amountRwf: 10000, subscriptionType: 'two-weekly' },
  { titleKey: 'payment.plan.week', price: '6,000', amountRwf: 6000, subscriptionType: 'weekly' },
  { titleKey: 'payment.plan.day', price: '2,000', amountRwf: 2000, subscriptionType: 'daily' },
  { titleKey: 'payment.plan.fiveExams', price: '1,000', amountRwf: 1000, subscriptionType: 'five-exams' },
];

const FEATURE_KEYS = ['payment.feature1', 'payment.feature2', 'payment.feature3'] as const;

function PlanCard({
  plan,
  title,
  featureTexts,
  actionLabel,
  onPress,
}: {
  plan: Plan;
  title: string;
  featureTexts?: string[];
  actionLabel: string;
  onPress: () => void;
}) {
  const { t } = useI18n();
  return (
    <View style={[styles.planCard, plan.featured && styles.planCardFeatured]}>
      {plan.featured ? <Text style={styles.bestValue}>{t('payment.bestValue').toUpperCase()}</Text> : null}
      <Text style={[styles.planTitle, plan.featured && styles.planTitleFeatured]}>{title}</Text>
      <View style={styles.planPriceRow}>
        <Text style={[styles.planPrice, plan.featured && styles.planPriceFeatured]}>{plan.price}</Text>
        <Text style={[styles.planCurrency, plan.featured && styles.planCurrencyFeatured]}>RWF</Text>
      </View>

      {plan.featured && featureTexts ? (
        <View style={styles.planFeatures}>
          {featureTexts.map((text) => (
            <View key={text} style={styles.featureRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#D5E4FF" />
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.startNowBtn} onPress={onPress}>
        <Text style={styles.startNowText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function SubscriptionNativeScreen({ navigation }: SubscriptionProps) {
  const { t } = useI18n();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const { hasSubscription } = useAppFlow();
  const planActionLabel = hasSubscription ? t('payment.renewOrChangePlan') : t('payment.startNow');
  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <Header title={t('subscription.title')} onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={[styles.scrollPad, { paddingBottom: tabScrollBottomPad }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.subHeading}>{t('payment.investTitle')}</Text>
          <Text style={styles.subLead}>{t('payment.investBody')}</Text>

          {hasSubscription ? (
            <View style={styles.renewBanner}>
              <Ionicons name="information-circle-outline" size={20} color="#1F2B54" />
              <Text style={styles.renewBannerText}>{t('payment.activePlanRenewHint')}</Text>
            </View>
          ) : null}

          {PLAN_DEFS.map((plan) => (
            <PlanCard
              key={plan.subscriptionType}
              plan={plan}
              title={t(plan.titleKey)}
              featureTexts={plan.featured ? FEATURE_KEYS.map((k) => t(k)) : undefined}
              actionLabel={planActionLabel}
              onPress={() =>
                navigation.navigate('PaymentNative', {
                  planTitle: t(plan.titleKey),
                  amountRwf: plan.amountRwf,
                  subscriptionType: plan.subscriptionType,
                })
              }
            />
          ))}

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
  const { accessToken, refreshProfile, phone: profilePhone } = useAuth();
  const { setHasSubscription, contentLanguage, hasSubscription } = useAppFlow();
  const [method, setMethod] = useState<'momo' | 'airtel' | 'card'>('momo');
  const [phoneDigits, setPhoneDigits] = useState('');
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

  const planTitle = route.params?.planTitle ?? t('payment.planDefault');
  const amountRwf = route.params?.amountRwf ?? 2000;
  const subscriptionType = (route.params?.subscriptionType as SubscriptionType | undefined) ?? 'daily';

  useEffect(() => {
    if (profilePhone) {
      const local = toLocalRwandaPhone(profilePhone.replace(/^250/, '0'));
      if (local) setPhoneDigits(local.slice(1));
    }
  }, [profilePhone]);

  useEffect(() => {
    setFieldErrors({});
  }, [method]);

  const isCard = method === 'card';
  const isMomo = method === 'momo';

  const submitPayment = async () => {
    if (!accessToken) {
      Alert.alert(t('payment.title'), t('payment.needSignIn'));
      return;
    }
    if (!isCard) {
      const digitsOnly = phoneDigits.replace(/\D/g, '');
      if (!digitsOnly) {
        setFieldErrors({ phone: t('validate.phoneRequired') });
        return;
      }
      const full = `0${digitsOnly}`;
      const local = toLocalRwandaPhone(full);
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
        } as const;
        const paymentPayload =
          method === 'momo'
            ? await initiateMomoPayment(body, accessToken)
            : await initiateAirtelPayment(body, accessToken);
        const receipt = extractPaymentReceipt(paymentPayload, contentLanguage);
        await refreshProfile();
        await setHasSubscription(true);
        navigation.navigate('PaymentConfirmationNative', {
          planTitle,
          amountRwf,
          orderId: receipt.orderId,
          paidAtLabel: receipt.paidAtLabel,
        });
      } catch (e) {
        Alert.alert(t('payment.failed'), getMessageFromUnknownError(e));
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
    setFieldErrors({});

    setPayBusy(true);
    try {
      const paymentPayload = await initiateCardPayment(
        {
          amount: amountRwf,
          payment_method: 'card',
          subscription_type: subscriptionType,
        },
        accessToken,
      );
      const receipt = extractPaymentReceipt(paymentPayload, contentLanguage);
      await refreshProfile();
      await setHasSubscription(true);
      navigation.navigate('PaymentConfirmationNative', {
        planTitle,
        amountRwf,
        orderId: receipt.orderId,
        paidAtLabel: receipt.paidAtLabel,
      });
    } catch (e) {
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
                <View style={styles.phoneInputRow}>
                  <Text style={styles.flag}>🇷🇼</Text>
                  <Text style={styles.countryCode}>+250</Text>
                  <View style={styles.phoneDivider} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder={t('payment.phonePh')}
                    placeholderTextColor="#A6ACB9"
                    keyboardType="phone-pad"
                    value={phoneDigits}
                    onChangeText={(v) => {
                      setPhoneDigits(v);
                      setFieldErrors((e) => ({ ...e, phone: undefined }));
                    }}
                    maxLength={9}
                  />
                </View>
                {fieldErrors.phone ? <Text style={styles.fieldError}>{fieldErrors.phone}</Text> : null}
                <Text style={styles.inputHint}>{isMomo ? t('payment.momoHint') : t('payment.airtelHint')}</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.payNowBtn} onPress={() => void submitPayment()} disabled={payBusy}>
            {payBusy ? (
              <ActivityIndicator color="#F5F8FE" />
            ) : (
              <>
                <MaterialCommunityIcons name="lock-outline" size={16} color="#F5F8FE" />
                <Text style={styles.payNowText}>{hasSubscription ? t('payment.completeUpdate') : t('payment.payNow')}</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.secureInfo}>{t('payment.secure')}</Text>
        </ScrollView>
      </View>
      <BottomTabs navigation={navigation} />
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
    backgroundColor: '#CBD3E0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  scrollPad: { paddingHorizontal: 18, paddingTop: 16 },
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
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#F0F0F4',
    padding: 12,
  },
  planCardFeatured: { backgroundColor: '#4A78D0' },
  bestValue: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 9,
    lineHeight: 12,
    color: '#F6F8FF',
  },
  planTitle: { marginTop: 8, fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, lineHeight: 26, color: '#17224A' },
  planTitleFeatured: { color: '#F6F8FF' },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 },
  planPrice: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 36, lineHeight: 42, color: '#17224A' },
  planPriceFeatured: { color: '#F6F8FF' },
  planCurrency: { marginLeft: 3, marginBottom: 4, fontFamily: 'PlusJakartaSans-Medium', fontSize: 16, lineHeight: 20, color: '#687086' },
  planCurrencyFeatured: { color: '#DCE7FF' },
  planFeatures: { marginTop: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  featureText: { marginLeft: 6, fontFamily: 'PlusJakartaSans-Medium', fontSize: 11, lineHeight: 16, color: '#EAF0FF' },
  startNowBtn: {
    marginTop: 10,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startNowText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, lineHeight: 16, color: '#1B1F2B' },
  customPlanCard: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#C6CEDD',
    paddingVertical: 14,
    alignItems: 'center',
  },
  customPlanTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, lineHeight: 26, color: '#22315A' },
  customPlanText: { marginTop: 4, textAlign: 'center', fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, lineHeight: 17, color: '#5D6678' },

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

  methodsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  methodCard: {
    width: '31.4%',
    borderRadius: 8,
    backgroundColor: '#ECECF0',
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  methodCardActive: { borderColor: '#1F2B54', backgroundColor: '#F7F7FA' },
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

  detailsCard: { borderRadius: 10, backgroundColor: '#F0F0F3', padding: 12 },
  inputLabel: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, lineHeight: 18, color: '#4F5564', marginBottom: 8 },
  inputLabelSpacing: { marginTop: 10 },
  inputField: {
    height: 42,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E1E2E8',
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 10,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#434956',
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
    marginTop: 16,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#4A78D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payNowText: { marginLeft: 6, fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, lineHeight: 22, color: '#F6F8FF' },
  secureInfo: { marginTop: 12, textAlign: 'center', fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, lineHeight: 16, color: '#6E7482' },

  successSquare: {
    marginTop: 16,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A78D0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
  successTitle: { marginTop: 18, textAlign: 'center', fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 20, lineHeight: 28, color: '#4A78D0' },
  successSubtitle: { marginTop: 8, textAlign: 'center', fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, lineHeight: 20, color: '#5E6472' },

  confirmationCard: { marginTop: 18, borderRadius: 10, backgroundColor: '#ECECF0', padding: 14 },
  confirmHeader: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, lineHeight: 20, color: '#4E5464' },
  activePill: { borderRadius: 11, backgroundColor: '#4A78D0', paddingHorizontal: 10, paddingVertical: 3 },
  activePillText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, lineHeight: 14, color: '#F6F8FF' },
  confirmRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmKey: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, lineHeight: 20, color: '#5B6170' },
  confirmValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, lineHeight: 22, color: '#2D3444' },

  startExamOutline: {
    marginTop: 12,
    height: 54,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#B5BDD0',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startExamOutlineText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, lineHeight: 22, color: '#4A78D0' },
  receiptNote: { marginTop: 12, textAlign: 'center', fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, lineHeight: 16, color: '#7B818F' },

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
