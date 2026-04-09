import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { RootStackParamList } from '../navigation/types';
import { AuthButton } from '../components/AuthButton';
import { AuthInputField } from '../components/AuthInputField';
import { GlowOrb } from '../components/GlowOrb';
import { useMobile } from '../hooks/useMobile';
import { useAppFlow } from '../context/AppFlowContext';

type LoginProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
type CreateAccountProps = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;
type ForgotPasswordProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
type ResetPasswordProps = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

function LogoHeader({ showTitle }: { showTitle: boolean }) {
  const m = useMobile();

  return (
    <View style={styles.logoHeader}>
      <Image source={FIGMA_ASSETS.brandingLogo} style={[styles.logo, { width: m.scale(94), height: m.scale(94) }]} resizeMode="contain" />
      {showTitle ? <Text style={[styles.brandTitle, { marginTop: m.verticalScale(8), fontSize: m.fontScale(14), lineHeight: m.fontScale(22) }]}>Nkotanyi Driving School</Text> : null}
    </View>
  );
}

export function LoginScreen({ navigation }: LoginProps) {
  const m = useMobile();
  const { setSignedIn } = useAppFlow();

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <GlowOrb size={m.scale(220)} top={m.verticalScale(150)} right={-m.scale(118)} />
      <GlowOrb size={m.scale(300)} bottom={-m.verticalScale(116)} left={-m.scale(132)} />

      <ScrollView contentContainerStyle={[styles.authScroll, { width: m.contentWidth, paddingTop: m.verticalScale(18), paddingBottom: m.verticalScale(20), paddingHorizontal: m.scale(22) }]} showsVerticalScrollIndicator={false}>
        <LogoHeader showTitle={false} />

        <Text style={[styles.authTitle, { marginTop: m.verticalScale(10), fontSize: m.fontScale(24), lineHeight: m.fontScale(32) }]}>Welcome Back</Text>
        <Text style={[styles.authSubtitle, { marginTop: m.verticalScale(6), fontSize: m.fontScale(13), lineHeight: m.fontScale(22) }]}>Please sign in to your driving school{`\n`}account to continue your journey.</Text>

        <View style={styles.formGroup}>
          <AuthInputField label="Phone" placeholder="Enter your phone number" leftIcon="phone" />
          <AuthInputField label="Password" placeholder="Enter your Password" leftIcon="lock" rightIcon="eye" secureTextEntry />
        </View>

        <Pressable style={styles.rememberRow}>
          <View style={styles.checkbox} />
          <Text style={styles.rememberText}>Remember Me</Text>
        </Pressable>

        <AuthButton
          label="Sign In"
          withArrow
          onPress={async () => {
            await setSignedIn(true);
            navigation.replace('HomeNative');
          }}
        />

        <Pressable style={styles.forgotLinkWrap} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotLink}>Forgot Password? Reset</Text>
        </Pressable>

        <View style={styles.separatorRow}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.separatorLine} />
        </View>

        <Pressable style={styles.bottomLinkRow} onPress={() => navigation.navigate('CreateAccount')}>
          <Text style={styles.bottomLinkHint}>New User? </Text>
          <Text style={styles.bottomLinkAction}>Create Account</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export function CreateAccountScreen({ navigation }: CreateAccountProps) {
  const m = useMobile();
  const { setSignedIn, setHasUsedFreeTrial, setHasSubscription } = useAppFlow();

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <GlowOrb size={m.scale(260)} top={m.verticalScale(260)} right={-m.scale(145)} />

      <ScrollView contentContainerStyle={[styles.authScroll, { width: m.contentWidth, paddingTop: m.verticalScale(18), paddingBottom: m.verticalScale(20), paddingHorizontal: m.scale(22) }]} showsVerticalScrollIndicator={false}>
        <LogoHeader showTitle />

        <Text style={[styles.authTitle, { marginTop: m.verticalScale(10), fontSize: m.fontScale(24), lineHeight: m.fontScale(32) }]}>Create Account</Text>
        <Text style={[styles.authSubtitle, { marginTop: m.verticalScale(6), fontSize: m.fontScale(13), lineHeight: m.fontScale(22) }]}>Start your journey to becoming a pro driver{`\n`}today.</Text>

        <View style={styles.formGroup}>
          <AuthInputField label="Name" placeholder="Enter your name" leftIcon="user" />
          <AuthInputField label="Phone" placeholder="Enter your phone number" leftIcon="phone" />
          <AuthInputField label="Password" placeholder="Enter your password" leftIcon="lock" rightIcon="eye" secureTextEntry />
        </View>

        <AuthButton
          label="Create Account"
          onPress={async () => {
            await setSignedIn(true);
            await setHasUsedFreeTrial(false);
            await setHasSubscription(false);
            navigation.replace('HomeNative');
          }}
        />

        <Pressable style={styles.bottomLinkRowCreate} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.bottomLinkHint}>Already have an account? </Text>
          <Text style={styles.bottomLinkAction}>Sign In</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export function ForgotPasswordScreen({ navigation }: ForgotPasswordProps) {
  const m = useMobile();

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <ScrollView contentContainerStyle={[styles.secondaryScroll, { width: m.contentWidth, paddingTop: m.verticalScale(14), paddingBottom: m.verticalScale(20), paddingHorizontal: m.scale(20) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#23335F" />
          </Pressable>
          <Text style={styles.topBarTitle}>Reset Password</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.resetIconOuter}>
          <View style={styles.resetIconInner}>
            <MaterialCommunityIcons name="lock-reset" size={28} color="#F5F9FF" />
          </View>
        </View>

        <Text style={styles.secondaryTitle}>Forgot Your Password?</Text>
        <Text style={styles.secondarySubtitle}>No worries! Enter your email or phone{`\n`}number below and we'll send you{`\n`}instructions to reset it.</Text>

        <View style={styles.secondaryFormGroup}>
          <AuthInputField label="Phone Number" placeholder="e.g. name@example.com" leftIcon="mail" />
        </View>

        <AuthButton label="Send Reset Link" withArrow onPress={() => navigation.navigate('ResetPassword')} />

        <Pressable style={styles.backSignInWrap} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backSignInText}>Back to Sign In</Text>
        </Pressable>

        <View style={styles.helpCard}>
          <View>
            <Text style={styles.helpTitle}>Need help?</Text>
            <Text style={styles.helpSubtitle}>Contact our support if you're having trouble{`\n`}accessing your account.</Text>
          </View>
          <MaterialCommunityIcons name="face-agent" size={42} color="#D7DAE3" />
        </View>
      </ScrollView>
    </View>
  );
}

export function ResetPasswordScreen({ navigation }: ResetPasswordProps) {
  const m = useMobile();

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <ScrollView contentContainerStyle={[styles.secondaryScroll, { width: m.contentWidth, paddingTop: m.verticalScale(14), paddingBottom: m.verticalScale(20), paddingHorizontal: m.scale(20) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.lockBadgeOuter}>
          <View style={styles.lockBadgeInner}>
            <MaterialCommunityIcons name="lock-reset" size={24} color="#F0F6FF" />
          </View>
        </View>

        <Text style={styles.resetTitle}>Create New Password</Text>
        <Text style={styles.resetSubtitle}>Your new password must be different{`\n`}from previous used passwords.</Text>

        <View style={styles.secondaryFormGroup}>
          <AuthInputField
            label="New Password"
            placeholder="••••••••"
            leftIcon="lock"
            rightIcon="eye"
            secureTextEntry
            variant="outline"
          />
          <AuthInputField
            label="Confirm Password"
            placeholder="••••••••"
            leftIcon="lock"
            rightIcon="eye"
            secureTextEntry
            variant="outline"
          />
        </View>

        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsHeading}>Security Requirements</Text>
          <Text style={styles.reqDone}>◉  At least 8 characters</Text>
          <Text style={styles.reqTodo}>○  Include at least one number</Text>
          <Text style={styles.reqTodo}>○  Include one special character</Text>
        </View>

        <AuthButton label="Reset Password" onPress={() => navigation.navigate('Login')} />

        <View style={styles.footerLines}>
          <View style={styles.footerLine} />
          <View style={styles.footerLine} />
        </View>

        <Text style={styles.supportText}>Need help? <Text style={styles.supportAction}>Contact Support</Text></Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4F8',
  },
  authScroll: {
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  logoHeader: {
    alignItems: 'center',
  },
  logo: {
    width: 94,
    height: 94,
  },
  brandTitle: {
    marginTop: 8,
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 14,
    lineHeight: 22,
    color: '#111E4A',
    textAlign: 'center',
  },
  authTitle: {
    marginTop: 10,
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: '#20232B',
    textAlign: 'center',
  },
  authSubtitle: {
    marginTop: 6,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 22,
    color: '#8C909C',
    textAlign: 'center',
  },
  formGroup: {
    marginTop: 16,
    width: '100%',
    rowGap: 12,
  },
  rememberRow: {
    width: '100%',
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#D3D3DB',
    backgroundColor: '#F8F8FA',
  },
  rememberText: {
    marginLeft: 8,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#5A5F6C',
  },
  forgotLinkWrap: {
    marginTop: 14,
  },
  forgotLink: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: '#4C7DDD',
  },
  separatorRow: {
    width: '100%',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3E5ED',
  },
  separatorText: {
    marginHorizontal: 12,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#B1B5C2',
  },
  bottomLinkRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomLinkRowCreate: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomLinkHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#858A97',
  },
  bottomLinkAction: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#4C7DDD',
  },
  secondaryScroll: {
    paddingTop: 14,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  topBar: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 17,
    lineHeight: 24,
    color: '#1F2E57',
  },
  resetIconOuter: {
    marginTop: 18,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#E6E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetIconInner: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4C7DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryTitle: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    lineHeight: 30,
    color: '#1E2028',
  },
  secondarySubtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 24,
    color: '#737888',
  },
  secondaryFormGroup: {
    marginTop: 16,
    rowGap: 12,
  },
  backSignInWrap: {
    marginTop: 16,
    alignSelf: 'center',
  },
  backSignInText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: '#222F58',
  },
  helpCard: {
    marginTop: 20,
    borderRadius: 18,
    backgroundColor: '#EFEFF3',
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#2B3558',
  },
  helpSubtitle: {
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#666D7D',
  },
  lockBadgeOuter: {
    alignSelf: 'center',
    marginTop: 10,
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#E5E7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadgeInner: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#4C7DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetTitle: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 20,
    lineHeight: 28,
    color: '#0F1E4A',
  },
  resetSubtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 24,
    color: '#7A7F8D',
  },
  requirementsCard: {
    marginTop: 8,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: '#F0F0F4',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  requirementsHeading: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    lineHeight: 16,
    textTransform: 'uppercase',
    color: '#9B9FAA',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  reqDone: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#2B3451',
    marginBottom: 6,
  },
  reqTodo: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#666D7C',
    marginBottom: 4,
  },
  footerLines: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLine: {
    width: '44%',
    height: 1,
    backgroundColor: '#E1E3EC',
  },
  supportText: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#9A9EAA',
  },
  supportAction: {
    color: '#2A3558',
    fontFamily: 'Poppins-SemiBold',
  },
});
