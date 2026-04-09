import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';
import { useAppFlow } from '../context/AppFlowContext';

type SubscriptionProps = NativeStackScreenProps<RootStackParamList, 'SubscriptionNative'>;
type PaymentProps = NativeStackScreenProps<RootStackParamList, 'PaymentNative'>;
type ConfirmationProps = NativeStackScreenProps<RootStackParamList, 'PaymentConfirmationNative'>;
type Nav = SubscriptionProps['navigation'] | PaymentProps['navigation'] | ConfirmationProps['navigation'];

function Header({ title, onBack, navigation }: { title: string; onBack: () => void; navigation: Nav }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
        <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={72} rightOffset={14} />
    </View>
  );
}

function BottomTabs({ navigation }: { navigation: Nav }) {
  return <BottomNavBar navigation={navigation} />;
}

type Plan = { title: string; price: string; featured?: boolean };
const PLANS: Plan[] = [
  { title: 'One Month', price: '15,000', featured: true },
  { title: 'Two Weeks', price: '10,000' },
  { title: 'One Week', price: '6,000' },
  { title: 'One Day', price: '2,000' },
  { title: 'Five Exams Only', price: '1,000' },
];

function PlanCard({ plan, onPress }: { plan: Plan; onPress: () => void }) {
  return (
    <View style={[styles.planCard, plan.featured && styles.planCardFeatured]}>
      {plan.featured ? <Text style={styles.bestValue}>BEST VALUE</Text> : null}
      <Text style={[styles.planTitle, plan.featured && styles.planTitleFeatured]}>{plan.title}</Text>
      <View style={styles.planPriceRow}>
        <Text style={[styles.planPrice, plan.featured && styles.planPriceFeatured]}>{plan.price}</Text>
        <Text style={[styles.planCurrency, plan.featured && styles.planCurrencyFeatured]}>RWF</Text>
      </View>

      {plan.featured ? (
        <View style={styles.planFeatures}>
          {['Full access to all simulations', 'Personalized progress analytics', 'Priority support assistance'].map((text) => (
            <View key={text} style={styles.featureRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#D5E4FF" />
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.startNowBtn} onPress={onPress}>
        <Text style={styles.startNowText}>Start Now</Text>
      </TouchableOpacity>
    </View>
  );
}

export function SubscriptionNativeScreen({ navigation }: SubscriptionProps) {
  return (
    <View style={styles.safe}>
      <Header title="Subscription" onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.subHeading}>Invest in Your Future{`\n`}Success</Text>
          <Text style={styles.subLead}>Choose the perfect plan tailored to your{`\n`}learning goals. Gain unlimited access to{`\n`}premium resources and expert simulations.</Text>

          {PLANS.map((plan) => (
            <PlanCard key={plan.title} plan={plan} onPress={() => navigation.navigate('PaymentNative')} />
          ))}

          <View style={styles.customPlanCard}>
            <Text style={styles.customPlanTitle}>Need a custom plan?</Text>
            <Text style={styles.customPlanText}>We offer special packages for{`\n`}schools, institutions, and large{`\n`}groups.</Text>
          </View>
        </ScrollView>
      </View>
      <BottomTabs navigation={navigation} />
    </View>
  );
}

export function PaymentNativeScreen({ navigation }: PaymentProps) {
  const [method, setMethod] = useState<'momo' | 'airtel' | 'card'>('momo');
  const isCard = method === 'card';
  const isMomo = method === 'momo';

  return (
    <View style={styles.safe}>
      <Header title="Payment" onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Subscription Plan</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SubscriptionNative')}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.subscriptionPlanCard}>
            <View style={styles.planIconSquare}>
              <MaterialCommunityIcons name="cog-outline" size={20} color="#F5F8FE" />
            </View>
            <Text style={styles.standardDaily}>Standard{`\n`}Daily</Text>
            <Text style={styles.amountBlue}>2,000 Rwf</Text>
          </View>

          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.methodsRow}>
            {[
              { key: 'momo' as const, label: 'MOMO', brand: 'MTN', icon: 'phone-portrait-outline' as const, iconBg: '#FFCC00', iconColor: '#1F2B54' },
              { key: 'airtel' as const, label: 'AIRTEL', brand: 'A', icon: 'radio-outline' as const, iconBg: '#E3242B', iconColor: '#FFFFFF' },
              { key: 'card' as const, label: 'CARD', brand: 'CARD', icon: 'card-outline' as const, iconBg: '#E4E5E8', iconColor: '#4F5564' },
            ].map((m) => {
              const active = method === m.key;
              return (
                <TouchableOpacity key={m.key} style={[styles.methodCard, active && styles.methodCardActive]} onPress={() => setMethod(m.key)}>
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

          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.detailsCard}>
            {isCard ? (
              <>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput style={styles.inputField} placeholder="1234 5678 9012 3456" placeholderTextColor="#A6ACB9" keyboardType="number-pad" />

                <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>Card Holder Name</Text>
                <TextInput style={styles.inputField} placeholder="ALAIN KWISHIMA" placeholderTextColor="#A6ACB9" />

                <View style={styles.cardRow}>
                  <View style={styles.cardCol}>
                    <Text style={styles.inputLabel}>Expiry</Text>
                    <TextInput style={styles.inputField} placeholder="MM/YY" placeholderTextColor="#A6ACB9" />
                  </View>
                  <View style={styles.cardCol}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput style={styles.inputField} placeholder="123" placeholderTextColor="#A6ACB9" keyboardType="number-pad" secureTextEntry />
                  </View>
                </View>
                <Text style={styles.inputHint}>Use a valid bank card with enough balance.</Text>
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.phoneInputRow}>
                  <Text style={styles.flag}>🇷🇼</Text>
                  <Text style={styles.countryCode}>+250</Text>
                  <View style={styles.phoneDivider} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="7XX XXX XXX"
                    placeholderTextColor="#A6ACB9"
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={styles.inputHint}>
                  {isMomo
                    ? 'Ensure your MoMo account is active and has sufficient balance.'
                    : 'Ensure your Airtel Money account is active and has sufficient balance.'}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.payNowBtn} onPress={() => navigation.navigate('PaymentConfirmationNative')}>
            <MaterialCommunityIcons name="lock-outline" size={16} color="#F5F8FE" />
            <Text style={styles.payNowText}>Pay Now</Text>
          </TouchableOpacity>
          <Text style={styles.secureInfo}>Transaction is secured by 256-bit encryption</Text>
        </ScrollView>
      </View>
      <BottomTabs navigation={navigation} />
    </View>
  );
}

export function PaymentConfirmationNativeScreen({ navigation }: ConfirmationProps) {
  const { setHasSubscription } = useAppFlow();

  useEffect(() => {
    void setHasSubscription(true);
  }, [setHasSubscription]);

  return (
    <View style={styles.safe}>
      <Header title="Payment" onBack={() => navigation.goBack()} navigation={navigation} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={styles.successSquare}>
            <Ionicons name="checkmark-circle" size={28} color="#F5F8FE" />
          </View>

          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>Your Five Exams plan is now active</Text>

          <View style={styles.confirmationCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.confirmHeader}>FIVE EXAMS PLAN</Text>
              <View style={styles.activePill}><Text style={styles.activePillText}>ACTIVE</Text></View>
            </View>

            <View style={styles.confirmRow}><Text style={styles.confirmKey}>Order ID</Text><Text style={styles.confirmValue}>#NK-8829-4402</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmKey}>Amount</Text><Text style={styles.confirmValue}>1000 RWF</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmKey}>Date</Text><Text style={styles.confirmValue}>Oct 24, 2023</Text></View>
          </View>

          <TouchableOpacity style={styles.payNowBtn} onPress={() => navigation.navigate('HomeNative')}>
            <Text style={styles.payNowText}>Go to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startExamOutline} onPress={() => navigation.navigate('StartExamNative')}>
            <Text style={styles.startExamOutlineText}>Start Exam</Text>
          </TouchableOpacity>

          <Text style={styles.receiptNote}>A confirmation receipt has been sent to your registered email{`\n`}address.</Text>
        </ScrollView>
      </View>
      <BottomTabs navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: '#4A78D0' },
  header: {
    height: 78,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, lineHeight: 24, color: '#F7F9FE' },
  body: {
    flex: 1,
    backgroundColor: '#CBD3E0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  scrollPad: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 96 },
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
