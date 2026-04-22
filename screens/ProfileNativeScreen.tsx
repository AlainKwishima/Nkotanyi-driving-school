import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenColumn } from '../components/ScreenColumn';
import { MIN_TOUCH_TARGET } from '../constants/accessibility';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/useI18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileNative'>;

function BottomTabs({ navigation }: { navigation: Props['navigation'] }) {
  return <BottomNavBar navigation={navigation} />;
}

function AccountRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.accountRow}>
      <View style={styles.accountIconBox}>
        <Ionicons name={icon} size={24} color="#1F2B5A" />
      </View>
      <View style={styles.accountTextWrap}>
        <Text style={styles.accountLabel}>{label}</Text>
        <Text style={styles.accountValue}>{value}</Text>
      </View>
    </View>
  );
}

export function ProfileNativeScreen({ navigation }: Props) {
  const { hasSubscription, contentLanguage } = useAppFlow();
  const { insets, tabScrollBottomPad } = useResponsiveLayout();
  const { t } = useI18n();
  const langLabel = t(`profile.lang.${contentLanguage}`);
  const { name, phone, logout } = useAuth();

  return (
    <ScreenColumn backgroundColor="#4A78D0">
      <View style={[styles.headerBlue, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#F6F8FE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          <View style={styles.headerRight}>
            <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={20} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottomPad }]} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('profile.myAccount')}</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>{t('profile.edit')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.accountCard}>
            <AccountRow icon="person-outline" label={t('profile.fullName').toUpperCase()} value={name ?? '—'} />
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('LanguageSelection', { changeOnly: true })}>
              <AccountRow icon="globe-outline" label={t('profile.language').toUpperCase()} value={langLabel} />
            </TouchableOpacity>
            <AccountRow icon="call-outline" label={t('profile.phone').toUpperCase()} value={phone ?? '—'} />
          </View>

          <View style={[styles.sectionHead, styles.paymentHead]}>
            <Text style={styles.sectionTitle}>{t('profile.paymentInfo')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SubscriptionNative')}>
              <Text style={styles.sectionLink}>{t('profile.update')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.paymentCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SubscriptionNative')}
          >
            <View style={styles.paymentTop}>
              <View>
                <Text style={styles.paymentLabel}>{t('profile.subscriptionPlan').toUpperCase()}</Text>
                <Text style={styles.paymentPlan}>{hasSubscription ? t('profile.planActive') : t('profile.noPlan')}</Text>
              </View>
              <Ionicons name="calendar-outline" size={24} color="#93A2D5" />
            </View>

            <View style={styles.paymentBottom}>
              <View>
                <Text style={styles.paymentLabel}>{t('profile.endDate').toUpperCase()}</Text>
                <Text style={styles.paymentValue}>N/A</Text>
              </View>
              <View>
                <Text style={styles.paymentLabel}>{t('profile.paymentStatus').toUpperCase()}</Text>
                <View style={styles.paidRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#31D17B" />
                  <Text style={styles.paidText}>{hasSubscription ? t('profile.paid') : t('profile.noPlan')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={async () => {
              await logout();
              navigation.replace('Login');
            }}
          >
            <MaterialCommunityIcons name="logout-variant" size={18} color="#D43737" />
            <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
          </TouchableOpacity>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    color: '#1E293B',
  },
  sectionLink: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  accountCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTextWrap: {
    marginLeft: 16,
    flex: 1,
  },
  accountLabel: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#64748B',
  },
  accountValue: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#1E293B',
  },
  paymentHead: {
    marginTop: 20,
  },
  paymentCard: {
    borderRadius: 24,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  paymentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentLabel: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#BFDBFE',
  },
  paymentPlan: {
    marginTop: 6,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  paymentBottom: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  paymentValue: {
    marginTop: 6,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  paidRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidText: {
    marginLeft: 6,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 16,
    color: '#10B981',
  },
  signOutBtn: {
    marginTop: 24,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  signOutText: {
    marginLeft: 8,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 16,
    color: '#EF4444',
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
  tabText: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 14,
    color: '#8A98B2',
  },
  tabTextActive: { color: '#4A78D0' },
});


