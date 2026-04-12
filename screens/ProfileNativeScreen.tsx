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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={56} rightOffset={14} />
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
  header: {
    minHeight: 78,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 33 / 2,
    lineHeight: 24,
    color: '#F7F9FE',
  },
  body: {
    flex: 1,
    backgroundColor: '#CBD3E0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 42 / 2,
    lineHeight: 52 / 2,
    color: '#1F2431',
  },
  sectionLink: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 20,
    color: '#23305C',
    textDecorationLine: 'underline',
  },
  accountCard: {
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountIconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#DEE0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  accountLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    color: '#A1A7B5',
  },
  accountValue: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    lineHeight: 21,
    color: '#232833',
  },
  paymentHead: {
    marginTop: 12,
  },
  paymentCard: {
    borderRadius: 12,
    backgroundColor: '#24306A',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  paymentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    color: '#8F9DCD',
  },
  paymentPlan: {
    marginTop: 6,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 34 / 2,
    lineHeight: 44 / 2,
    color: '#F6F8FF',
  },
  paymentBottom: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  paymentValue: {
    marginTop: 6,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 20,
    color: '#F6F8FF',
  },
  paidRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidText: {
    marginLeft: 4,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 32 / 2,
    lineHeight: 40 / 2,
    color: '#31D17B',
  },
  signOutBtn: {
    marginTop: 16,
    height: 74,
    borderRadius: 10,
    backgroundColor: '#ECE9F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  signOutText: {
    marginLeft: 8,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 36 / 2,
    lineHeight: 46 / 2,
    color: '#D43737',
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


