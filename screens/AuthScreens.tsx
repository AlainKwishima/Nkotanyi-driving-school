import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { RootStackParamList } from '../navigation/types';
import { AuthButton } from '../components/AuthButton';
import { AuthInputField } from '../components/AuthInputField';
import { useMobile } from '../hooks/useMobile';
import { useAppFlow } from '../context/AppFlowContext';
import { useAuth, getMessageFromUnknownError } from '../context/AuthContext';
import { useI18n } from '../i18n/useI18n';
import {
  isValidRwandaAccountPhone,
  validateName,
  validatePasswordMin,
  validatePasswordStrong,
  validatePasswordsMatch,
} from '../utils/validation';

type LoginProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
type CreateAccountProps = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;
type ForgotPasswordProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
type ResetPasswordProps = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

function LogoHeader({ showTitle }: { showTitle: boolean }) {
  const m = useMobile();
  const { t } = useI18n();

  return (
    <View style={styles.logoHeader}>
      <Image source={FIGMA_ASSETS.brandingLogo} style={[styles.logo, { width: m.scale(94), height: m.scale(94) }]} resizeMode="contain" />
      {showTitle ? <Text style={[styles.brandTitle, { marginTop: m.verticalScale(8), fontSize: m.fontScale(14), lineHeight: m.fontScale(22) }]}>{t('language.brand')}</Text> : null}
    </View>
  );
}

export function LoginScreen({ navigation }: LoginProps) {
  const m = useMobile();
  const { t } = useI18n();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <ScrollView contentContainerStyle={[styles.authScroll, { width: m.contentWidth, paddingTop: m.verticalScale(18), paddingBottom: m.verticalScale(20), paddingHorizontal: m.scale(22) }]} showsVerticalScrollIndicator={false}>
        <LogoHeader showTitle={false} />

        <Text style={[styles.authTitle, { marginTop: m.verticalScale(10), fontSize: m.fontScale(24), lineHeight: m.fontScale(32) }]}>{t('auth.welcomeBack')}</Text>
        <Text style={[styles.authSubtitle, { marginTop: m.verticalScale(6), fontSize: m.fontScale(13), lineHeight: m.fontScale(22) }]}>{t('auth.signInSubtitle')}</Text>

        <View style={styles.formGroup}>
          <AuthInputField
            label={t('auth.phone')}
            placeholder={t('auth.phonePh')}
            leftIcon="phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              setPhoneError(null);
            }}
            error={phoneError}
          />
          <AuthInputField
            label={t('auth.password')}
            placeholder={t('auth.passwordPh')}
            leftIcon="lock"
            rightIcon="eye"
            secureTextEntry
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setPasswordError(null);
            }}
            error={passwordError}
          />
        </View>

        <Pressable style={styles.rememberRow}>
          <View style={styles.checkbox} />
          <Text style={styles.rememberText}>{t('auth.rememberMe')}</Text>
        </Pressable>

        <AuthButton
          label={t('auth.signIn')}
          withArrow
          onPress={async () => {
            let pe: string | null = null;
            let pw: string | null = null;
            if (!phone.trim()) pe = t('validate.phoneRequired');
            else if (!isValidRwandaAccountPhone(phone)) pe = t('validate.phoneInvalid');
            const pwr = validatePasswordMin(password);
            if (!pwr.ok) pw = t(pwr.key);
            setPhoneError(pe);
            setPasswordError(pw);
            if (pe || pw) return;
            setBusy(true);
            try {
              await login(phone.trim(), password);
              navigation.replace('HomeNative');
            } catch (e) {
              Alert.alert(t('auth.signInFailed'), getMessageFromUnknownError(e));
            } finally {
              setBusy(false);
            }
          }}
        />
        {busy ? <ActivityIndicator style={{ marginTop: 12 }} color="#4C7DDD" /> : null}

        <Pressable style={styles.forgotLinkWrap} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotLink}>{t('auth.forgot')}</Text>
        </Pressable>

        <View style={styles.separatorRow}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>{t('auth.or')}</Text>
          <View style={styles.separatorLine} />
        </View>

        <Pressable style={styles.bottomLinkRow} onPress={() => navigation.navigate('CreateAccount')}>
          <Text style={styles.bottomLinkHint}>{t('auth.newUser')} </Text>
          <Text style={styles.bottomLinkAction}>{t('auth.createAccountLink')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export function CreateAccountScreen({ navigation }: CreateAccountProps) {
  const m = useMobile();
  const { t } = useI18n();
  const { setHasUsedFreeTrial, setHasSubscription } = useAppFlow();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <ScrollView contentContainerStyle={[styles.authScroll, { width: m.contentWidth, paddingTop: m.verticalScale(18), paddingBottom: m.verticalScale(20), paddingHorizontal: m.scale(22) }]} showsVerticalScrollIndicator={false}>
        <LogoHeader showTitle />

        <Text style={[styles.authTitle, { marginTop: m.verticalScale(10), fontSize: m.fontScale(24), lineHeight: m.fontScale(32) }]}>{t('auth.createTitle')}</Text>
        <Text style={[styles.authSubtitle, { marginTop: m.verticalScale(6), fontSize: m.fontScale(13), lineHeight: m.fontScale(22) }]}>{t('auth.createSubtitle')}</Text>

        <View style={styles.formGroup}>
          <AuthInputField
            label={t('auth.name')}
            placeholder={t('auth.namePh')}
            leftIcon="user"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setNameError(null);
            }}
            error={nameError}
          />
          <AuthInputField
            label={t('auth.phone')}
            placeholder={t('auth.phonePh')}
            leftIcon="phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              setPhoneError(null);
            }}
            error={phoneError}
          />
          <AuthInputField
            label={t('auth.password')}
            placeholder={t('auth.passwordCreatePh')}
            leftIcon="lock"
            rightIcon="eye"
            secureTextEntry
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setPasswordError(null);
            }}
            error={passwordError}
          />
        </View>

        <AuthButton
          label={t('auth.create')}
          onPress={async () => {
            const ne = validateName(name);
            let pe: string | null = null;
            if (!phone.trim()) pe = t('validate.phoneRequired');
            else if (!isValidRwandaAccountPhone(phone)) pe = t('validate.phoneInvalid');
            const pwr = validatePasswordMin(password);
            const pwErr = pwr.ok ? null : t(pwr.key);
            setNameError(ne.ok ? null : t(ne.key));
            setPhoneError(pe);
            setPasswordError(pwErr);
            if (!ne.ok || pe || pwErr) return;
            setBusy(true);
            try {
              await signup(name.trim(), phone.trim(), password);
              await setHasUsedFreeTrial(false);
              await setHasSubscription(false);
              navigation.replace('HomeNative');
            } catch (e) {
              Alert.alert(t('auth.createFailed'), getMessageFromUnknownError(e));
            } finally {
              setBusy(false);
            }
          }}
        />
        {busy ? <ActivityIndicator style={{ marginTop: 12 }} color="#4C7DDD" /> : null}

        <Pressable style={styles.bottomLinkRowCreate} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.bottomLinkHint}>{t('auth.haveAccount')} </Text>
          <Text style={styles.bottomLinkAction}>{t('auth.signInLink')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export function ForgotPasswordScreen({ navigation }: ForgotPasswordProps) {
  const m = useMobile();
  const { t } = useI18n();
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <ScrollView contentContainerStyle={[styles.secondaryScroll, { width: m.contentWidth, paddingTop: m.verticalScale(14), paddingBottom: m.verticalScale(20), paddingHorizontal: m.scale(20) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#23335F" />
          </Pressable>
          <Text style={styles.topBarTitle}>{t('auth.resetTitle')}</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.resetIconBadge}>
          <MaterialCommunityIcons name="lock-reset" size={28} color="#F5F9FF" />
        </View>

        <Text style={styles.secondaryTitle}>{t('auth.forgotTitle')}</Text>
        <Text style={styles.secondarySubtitle}>{t('auth.forgotBody')}</Text>

        <View style={styles.secondaryFormGroup}>
          <AuthInputField
            label={t('auth.phone')}
            placeholder={t('auth.phonePh')}
            leftIcon="phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              setPhoneError(null);
            }}
            error={phoneError}
          />
        </View>

        <AuthButton
          label={t('auth.sendReset')}
          withArrow
          onPress={() => {
            if (!phone.trim()) {
              setPhoneError(t('validate.phoneRequired'));
              return;
            }
            if (!isValidRwandaAccountPhone(phone)) {
              setPhoneError(t('validate.phoneInvalid'));
              return;
            }
            Alert.alert(t('auth.resetSelfServiceTitle'), t('auth.resetSelfServiceBody'), [{ text: t('common.ok') }]);
          }}
        />

        <Pressable style={styles.backSignInWrap} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backSignInText}>{t('auth.backSignIn')}</Text>
        </Pressable>

        <View style={styles.helpCard}>
          <View>
            <Text style={styles.helpTitle}>{t('auth.helpTitle')}</Text>
            <Text style={styles.helpSubtitle}>{t('auth.helpSubtitle')}</Text>
          </View>
          <MaterialCommunityIcons name="face-agent" size={42} color="#D7DAE3" />
        </View>
      </ScrollView>
    </View>
  );
}

export function ResetPasswordScreen({ navigation }: ResetPasswordProps) {
  const m = useMobile();
  const { t } = useI18n();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <ScrollView contentContainerStyle={[styles.secondaryScroll, { width: m.contentWidth, paddingTop: m.verticalScale(14), paddingBottom: m.verticalScale(20), paddingHorizontal: m.scale(20) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.lockBadge}>
          <MaterialCommunityIcons name="lock-reset" size={24} color="#F0F6FF" />
        </View>

        <Text style={styles.resetTitle}>{t('auth.newPasswordTitle')}</Text>
        <Text style={styles.resetSubtitle}>{t('auth.newPasswordSubtitle')}</Text>

        <View style={styles.secondaryFormGroup}>
          <AuthInputField
            label={t('auth.newPasswordField')}
            placeholder="••••••••"
            leftIcon="lock"
            rightIcon="eye"
            secureTextEntry
            variant="outline"
            value={newPassword}
            onChangeText={(v) => {
              setNewPassword(v);
              setNewPasswordError(null);
            }}
            error={newPasswordError}
          />
          <AuthInputField
            label={t('auth.confirmPasswordField')}
            placeholder="••••••••"
            leftIcon="lock"
            rightIcon="eye"
            secureTextEntry
            variant="outline"
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              setConfirmPasswordError(null);
            }}
            error={confirmPasswordError}
          />
        </View>

        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsHeading}>{t('auth.securityRequirements')}</Text>
          <Text style={styles.reqDone}>{'\u2713 '} {t('auth.req8chars')}</Text>
          <Text style={styles.reqTodo}>{'\u2013 '} {t('auth.reqNumber')}</Text>
          <Text style={styles.reqTodo}>{'\u2013 '} {t('auth.reqSpecial')}</Text>
        </View>

        <AuthButton
          label={t('auth.resetPassword')}
          onPress={() => {
            const strong = validatePasswordStrong(newPassword);
            if (!strong.ok) {
              setNewPasswordError(t(strong.key));
              setConfirmPasswordError(null);
              return;
            }
            const match = validatePasswordsMatch(newPassword, confirmPassword);
            if (!match.ok) {
              setNewPasswordError(null);
              setConfirmPasswordError(t(match.key));
              return;
            }
            setNewPasswordError(null);
            setConfirmPasswordError(null);
            navigation.navigate('Login');
          }}
        />

        <View style={styles.footerLines}>
          <View style={styles.footerLine} />
          <View style={styles.footerLine} />
        </View>

        <Text style={styles.supportText}>
          {t('auth.supportNeed')} <Text style={styles.supportAction}>{t('auth.supportContact')}</Text>
        </Text>
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
  resetIconBadge: {
    marginTop: 18,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 8,
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
  lockBadge: {
    alignSelf: 'center',
    marginTop: 10,
    width: 56,
    height: 56,
    borderRadius: 8,
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
