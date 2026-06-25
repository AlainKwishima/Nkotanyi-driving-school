import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { BottomNavBar } from '../components/BottomNavBar';
import { ScreenColumn } from '../components/ScreenColumn';
import { AppHeader } from '../components/AppHeader';
import { SectionHeading } from '../components/SectionHeading';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/useI18n';
import { SignOutConfirmationModal } from '../components/SignOutConfirmationModal';
import { colors, radii, spacing, typography } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileNative'>;

function AccountRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.accountRow}>
      <View style={styles.accountIconBox}>
        <Ionicons name={icon} size={21} color={colors.brandStrong} />
      </View>
      <View style={styles.accountTextWrap}>
        <Text style={styles.accountLabel}>{label}</Text>
        <Text style={styles.accountValue}>{value}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={19} color={colors.inkSoft} /> : null}
    </View>
  );

  return onPress ? (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress}>
      {content}
    </TouchableOpacity>
  ) : content;
}

export function ProfileNativeScreen({ navigation }: Props) {
  const { hasSubscription, contentLanguage } = useAppFlow();
  const { tabScrollBottomPad } = useResponsiveLayout();
  const { t } = useI18n();
  const { name, phone, logout } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const langLabel = t(`profile.lang.${contentLanguage}`);
  const initials = (name ?? 'N')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <ScreenColumn>
      <AppHeader title={t('profile.title')} navigation={navigation} onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || 'N'}</Text>
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.identityName}>{name ?? t('profile.myAccount')}</Text>
              <Text style={styles.identityPhone}>{phone ?? t('common.na')}</Text>
            </View>
            <View style={[styles.planPill, hasSubscription ? styles.planPillActive : styles.planPillInactive]}>
              <View style={[styles.planDot, hasSubscription ? styles.planDotActive : styles.planDotInactive]} />
              <Text style={[styles.planPillText, hasSubscription ? styles.planPillTextActive : styles.planPillTextInactive]}>
                {hasSubscription ? t('profile.planActive') : t('profile.noPlan')}
              </Text>
            </View>
          </View>

          <SectionHeading title={t('profile.myAccount')} />
          <View style={styles.accountCard}>
            <AccountRow icon="person-outline" label={t('profile.fullName')} value={name ?? t('common.na')} />
            <View style={styles.divider} />
            <AccountRow
              icon="globe-outline"
              label={t('profile.language')}
              value={langLabel}
              onPress={() => navigation.navigate('LanguageSettings')}
            />
            <View style={styles.divider} />
            <AccountRow icon="call-outline" label={t('profile.phone')} value={phone ?? t('common.na')} />
          </View>

          <SectionHeading
            title={t('profile.paymentInfo')}
            action={t('profile.update')}
            onAction={() => navigation.navigate('SubscriptionNative')}
          />
          <TouchableOpacity
            style={styles.subscriptionCard}
            activeOpacity={0.86}
            onPress={() => navigation.navigate('SubscriptionNative')}
          >
            <View style={styles.subscriptionTop}>
              <View style={styles.subscriptionIcon}>
                <Ionicons name={hasSubscription ? 'shield-checkmark' : 'shield-outline'} size={22} color={colors.brandStrong} />
              </View>
              <Ionicons name="arrow-forward" size={21} color={colors.inkSoft} />
            </View>
            <Text style={styles.subscriptionEyebrow}>{t('profile.subscriptionPlan')}</Text>
            <Text style={styles.subscriptionTitle}>
              {hasSubscription ? t('profile.planActive') : t('profile.noPlan')}
            </Text>
            <View style={styles.subscriptionMeta}>
              <Text style={styles.subscriptionMetaLabel}>{t('profile.paymentStatus')}</Text>
              <View style={styles.statusRow}>
                <Ionicons
                  name={hasSubscription ? 'checkmark-circle' : 'information-circle'}
                  size={17}
                  color={hasSubscription ? colors.success : colors.brand}
                />
                <Text style={styles.statusText}>
                  {hasSubscription ? t('profile.paid') : t('profile.noPlan')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={() => setShowSignOutConfirm(true)} activeOpacity={0.82}>
            <MaterialCommunityIcons name="logout-variant" size={19} color={colors.danger} />
            <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <BottomNavBar navigation={navigation} />
      <SignOutConfirmationModal
        visible={showSignOutConfirm}
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={async () => {
          setShowSignOutConfirm(false);
          await logout();
        }}
      />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  identityCard: {
    minHeight: 108,
    padding: spacing.lg,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  avatarText: {
    ...typography.title,
    color: colors.brandStrong,
  },
  identityCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  identityName: {
    ...typography.title,
    color: colors.ink,
  },
  identityPhone: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.inkMuted,
  },
  planPill: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planPillActive: {
    backgroundColor: colors.successSoft,
  },
  planPillInactive: {
    backgroundColor: colors.brandSoft,
  },
  planDot: {
    width: 6,
    height: 6,
    marginRight: 6,
    borderRadius: 3,
  },
  planDotActive: {
    backgroundColor: colors.success,
  },
  planDotInactive: {
    backgroundColor: colors.brand,
  },
  planPillText: {
    ...typography.caption,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  planPillTextActive: {
    color: colors.success,
  },
  planPillTextInactive: {
    color: colors.brandStrong,
  },
  accountCard: {
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  accountRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  accountTextWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },
  accountLabel: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  accountValue: {
    ...typography.bodyStrong,
    marginTop: 2,
    color: colors.ink,
  },
  divider: {
    height: 1,
    marginLeft: 56,
    backgroundColor: colors.line,
  },
  subscriptionCard: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 170,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  subscriptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  subscriptionEyebrow: {
    ...typography.eyebrow,
    marginTop: spacing.lg,
    color: colors.inkSoft,
    textTransform: 'uppercase',
  },
  subscriptionTitle: {
    ...typography.heading,
    marginTop: spacing.xs,
    color: colors.ink,
  },
  subscriptionMeta: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionMetaLabel: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...typography.bodyStrong,
    marginLeft: spacing.xs,
    color: colors.ink,
  },
  signOutBtn: {
    height: 54,
    marginTop: spacing.xxl,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
  },
  signOutText: {
    ...typography.bodyStrong,
    marginLeft: spacing.sm,
    color: colors.danger,
  },
});
