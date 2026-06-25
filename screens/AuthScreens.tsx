import React, { useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FIGMA_ASSETS } from '../assets/figmaAssets';
import { RootStackParamList } from '../navigation/types';
import { AuthButton } from '../components/AuthButton';
import { AuthInputField } from '../components/AuthInputField';
import { useMobile } from '../hooks/useMobile';
import { useAuth, getMessageFromUnknownError } from '../context/AuthContext';
import { useI18n } from '../i18n/useI18n';
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from '../services/rememberedCredentials';
import {
  isValidRwandaAccountPhone,
  validateName,
  validatePasswordMin,
  validatePasswordStrong,
  validatePasswordsMatch,
} from '../utils/validation';
import { colors, radii, shadows } from '../constants/theme';

type LoginProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
type CreateAccountProps = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;
type ForgotPasswordProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
type ResetPasswordProps = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;
type AuthNavigation = {
  navigate: (screen: 'LanguageSelection', params?: { changeOnly?: boolean }) => void;
};

function AuthBackButton({ navigation }: { navigation: AuthNavigation }) {
  const m = useMobile();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.authBackRow, { paddingTop: Math.max(insets.top, m.verticalScale(10)) }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to language selection"
        onPress={() => navigation.navigate('LanguageSelection', { changeOnly: true })}
        style={({ pressed }) => [styles.authBackBtn, pressed && styles.authBackBtnPressed]}
        hitSlop={10}
      >
        <Feather name="chevron-left" size={m.scale(22)} color={colors.ink} />
      </Pressable>
    </View>
  );
}

function LogoHeader({ showTitle, showTagline = false }: { showTitle: boolean; showTagline?: boolean }) {
  const m = useMobile();
  const { t } = useI18n();

  return (
    <View style={styles.logoHeader}>
      <Image source={FIGMA_ASSETS.brandingLogo} style={[styles.logo, { width: m.scale(64), height: m.scale(64) }]} resizeMode="contain" />
      {showTitle ? <Text style={[styles.brandTitle, { marginTop: m.verticalScale(4), fontSize: m.fontScale(12), lineHeight: m.fontScale(18) }]}>{t('language.brand')}</Text> : null}
      {showTagline ? <Text style={[styles.taglineText, { marginTop: m.verticalScale(2), fontSize: m.fontScale(11), lineHeight: m.fontScale(16) }]}>{t('auth.tagline')}</Text> : null}
    </View>
  );
}

function RememberMeRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Pressable style={styles.rememberRow} onPress={onToggle} hitSlop={8}>
      <MaterialCommunityIcons
        name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
        size={20}
        color={checked ? colors.brand : colors.inkSoft}
      />
      <Text style={styles.rememberText}>{label}</Text>
    </Pressable>
  );
}

export function LoginScreen({ navigation, route }: LoginProps) {
  const m = useMobile();
  const { t } = useI18n();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const signupBannerShown = useRef(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const remembered = await loadRememberedCredentials();
      if (!active) return;
      if (remembered) {
        setPhone(remembered.phone);
        setPassword(remembered.password);
        setRememberMe(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const prefill = route.params?.prefill;
    if (!prefill) return;

    if (typeof prefill.phone === 'string') setPhone(prefill.phone);
    if (typeof prefill.password === 'string') setPassword(prefill.password);

    if (!signupBannerShown.current && route.params?.showSignupSuccess && (prefill.name || prefill.phone)) {
      signupBannerShown.current = true;
      const displayName = prefill.name?.trim() || t('auth.welcomeBack');
      const displayPhone = prefill.phone?.trim() || '';
      Alert.alert(
        t('auth.signupSuccessTitle'),
        t('auth.signupSuccessMessage', { name: displayName, phone: displayPhone }),
      );
      navigation.setParams({ showSignupSuccess: false });
    }
  }, [navigation, route.params, t]);

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <ScrollView
        style={{ width: '100%', maxWidth: m.contentWidth, alignSelf: 'center' }}
        contentContainerStyle={[styles.authScroll, { width: '100%', paddingTop: m.verticalScale(8), paddingBottom: m.verticalScale(16), paddingHorizontal: m.scale(22) }]}
        showsVerticalScrollIndicator={false}
      >
        <AuthBackButton navigation={navigation} />
        <LogoHeader showTitle={false} />

        <Text style={[styles.authTitle, { marginTop: m.verticalScale(8), fontSize: m.fontScale(23), lineHeight: m.fontScale(31) }]}>{t('auth.welcomeBack')}</Text>
        <Text style={[styles.authSubtitle, { marginTop: m.verticalScale(4), fontSize: m.fontScale(13), lineHeight: m.fontScale(20) }]}>{t('auth.signInSubtitle')}</Text>

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

        <RememberMeRow checked={rememberMe} onToggle={() => setRememberMe((prev) => !prev)} label={t('auth.rememberMe')} />

        <AuthButton
          label={t('auth.signIn')}
          withArrow
          onPress={async () => {
            let pe: string | null = null;
            let pw: string | null = null;
            if (!phone.trim()) pe = t('validate.phoneRequired');
            else if (!isValidRwandaAccountPhone(phone)) pe = t('validate.phoneInvalid');
            if (!password) pw = t('validate.passwordRequired');
            setPhoneError(pe);
            setPasswordError(pw);
            if (pe || pw) return;
            setBusy(true);
            try {
              await login(phone.trim(), password);
              if (rememberMe) {
                await saveRememberedCredentials({ phone: phone.trim(), password });
              } else {
                await clearRememberedCredentials();
              }
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
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <ScrollView
        style={{ width: '100%', maxWidth: m.contentWidth, alignSelf: 'center' }}
        contentContainerStyle={[styles.authScroll, { width: '100%', paddingTop: m.verticalScale(8), paddingBottom: m.verticalScale(16), paddingHorizontal: m.scale(22) }]}
        showsVerticalScrollIndicator={false}
      >
        <AuthBackButton navigation={navigation} />
        <LogoHeader showTitle />

        <Text style={[styles.authTitle, { marginTop: m.verticalScale(8), fontSize: m.fontScale(23), lineHeight: m.fontScale(31) }]}>{t('auth.createTitle')}</Text>
        <Text style={[styles.authSubtitle, { marginTop: m.verticalScale(4), fontSize: m.fontScale(13), lineHeight: m.fontScale(20) }]}>{t('auth.createSubtitle')}</Text>

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

        <RememberMeRow checked={rememberMe} onToggle={() => setRememberMe((prev) => !prev)} label={t('auth.rememberMe')} />

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
              if (rememberMe) {
                await saveRememberedCredentials({ phone: phone.trim(), password, name: name.trim() });
              } else {
                await clearRememberedCredentials();
              }
              navigation.replace('Login', {
                prefill: { name: name.trim(), phone: phone.trim(), password },
                showSignupSuccess: true,
              });
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

  const handleEmail = () => {
    Linking.openURL(`mailto:${t('auth.schoolEmail')}`).catch(() => {
      Alert.alert(t('common.error'), 'Could not open your email app.');
    });
  };

  const handlePhone = () => {
    Linking.openURL(`tel:${t('auth.schoolPhone')}`).catch(() => {
      Alert.alert(t('common.error'), 'Could not open the phone app.');
    });
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/0780211466').catch(() => {
      Alert.alert(t('common.error'), 'Could not open WhatsApp. Please make sure it is installed.');
    });
  };

  return (
    <View style={[styles.root, { paddingHorizontal: m.sideGutter, alignItems: 'center' }]}>
      <ScrollView
        style={{ width: '100%', maxWidth: m.contentWidth, alignSelf: 'center' }}
        contentContainerStyle={[styles.secondaryScroll, { width: '100%', paddingTop: m.verticalScale(8), paddingBottom: m.verticalScale(16), paddingHorizontal: m.scale(20) }]}
        showsVerticalScrollIndicator={false}
      >
        <AuthBackButton navigation={navigation} />
        <LogoHeader showTitle={false} />

        <View style={styles.recoveryIntro}>
          <View style={styles.recoveryBadge}>
            <MaterialCommunityIcons name="shield-key-outline" size={22} color={colors.brandStrong} />
          </View>
          <Text style={[styles.secondaryTitle, { marginTop: m.verticalScale(12), fontSize: m.fontScale(22), lineHeight: m.fontScale(30) }]}>
            {t('auth.contactAdminTitle')}
          </Text>
          <Text style={[styles.secondarySubtitle, { marginTop: m.verticalScale(6), fontSize: m.fontScale(13), lineHeight: m.fontScale(20), paddingHorizontal: m.scale(6) }]}>
            {t('auth.contactAdminMessage')}
          </Text>
        </View>

        <View style={[styles.contactInfoCard, { marginTop: m.verticalScale(18), padding: m.scale(6) }]}>
          <Pressable style={({ pressed }) => [styles.contactActionRow, pressed && styles.contactActionPressed]} onPress={handleEmail}>
            <View style={[styles.contactIconBox, { width: m.scale(42), height: m.scale(42), borderRadius: m.scale(12) }]}>
              <Feather name="mail" size={m.scale(19)} color={colors.brand} />
            </View>
            <View style={styles.contactTextContent}>
              <Text style={[styles.contactLabel, { fontSize: m.fontScale(10) }]}>EMAIL ADDRESS</Text>
              <Text style={[styles.contactValue, { fontSize: m.fontScale(14) }]}>{t('auth.schoolEmail')}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.inkSoft} />
          </Pressable>

          <View style={styles.contactDivider} />

          <Pressable style={({ pressed }) => [styles.contactActionRow, pressed && styles.contactActionPressed]} onPress={handlePhone}>
            <View style={[styles.contactIconBox, { width: m.scale(42), height: m.scale(42), borderRadius: m.scale(12) }]}>
              <Feather name="phone" size={m.scale(19)} color={colors.brand} />
            </View>
            <View style={styles.contactTextContent}>
              <Text style={[styles.contactLabel, { fontSize: m.fontScale(10) }]}>PHONE NUMBER</Text>
              <Text style={[styles.contactValue, { fontSize: m.fontScale(14) }]}>{t('auth.schoolPhone')}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.inkSoft} />
          </Pressable>

          <Pressable
            onPress={handleWhatsApp}
            style={({ pressed }) => [
              styles.whatsappBtn,
              { marginTop: m.verticalScale(18), height: m.verticalScale(48), borderRadius: m.scale(12) },
              pressed && { opacity: 0.85 }
            ]}
          >
            <MaterialCommunityIcons name="whatsapp" size={m.scale(20)} color="#FFFFFF" />
            <Text style={[styles.whatsappBtnText, { marginLeft: m.scale(8), fontSize: m.fontScale(14) }]}>
              {t('auth.whatsappUs')}
            </Text>
          </Pressable>
        </View>

        <Pressable style={({ pressed }) => [styles.backSignInWrap, pressed && { opacity: 0.78 }]} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backSignInText}>{t('auth.backSignIn')}</Text>
        </Pressable>
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
      <ScrollView
        style={{ width: '100%', maxWidth: m.contentWidth, alignSelf: 'center' }}
        contentContainerStyle={[styles.secondaryScroll, { width: '100%', paddingTop: m.verticalScale(8), paddingBottom: m.verticalScale(16), paddingHorizontal: m.scale(20) }]}
        showsVerticalScrollIndicator={false}
      >
        <AuthBackButton navigation={navigation} />
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
    backgroundColor: colors.canvas,
    overflow: 'hidden',
  },
  authScroll: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  authBackRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  authBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  authBackBtnPressed: {
    opacity: 0.88,
  },
  logoHeader: {
    alignItems: 'center',
  },
  logo: {
    width: 64,
    height: 64,
  },
  brandTitle: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    lineHeight: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  taglineText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  authTitle: {
    marginTop: 8,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 23,
    lineHeight: 31,
    color: colors.ink,
    textAlign: 'center',
  },
  authSubtitle: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  formGroup: {
    marginTop: 20,
    width: '100%',
    rowGap: 14,
  },
  rememberRow: {
    width: '100%',
    marginTop: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  rememberText: {
    marginLeft: 10,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  forgotLinkWrap: {
    marginTop: 16,
  },
  forgotLink: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: colors.brand,
  },
  separatorRow: {
    width: '100%',
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  separatorText: {
    marginHorizontal: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
  },
  bottomLinkRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomLinkRowCreate: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomLinkHint: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  bottomLinkAction: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.brand,
  },
  secondaryScroll: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  topBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
  },
  resetIconBadge: {
    marginTop: 20,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryTitle: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 22,
    lineHeight: 32,
    color: '#1E293B',
  },
  secondarySubtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  secondaryFormGroup: {
    marginTop: 18,
    rowGap: 14,
  },
  backSignInWrap: {
    marginTop: 16,
    alignSelf: 'center',
  },
  backSignInText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.brand,
  },
  contactInfoCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  recoveryIntro: {
    width: '100%',
    alignItems: 'center',
  },
  recoveryBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: '#D7E4F7',
  },
  contactActionRow: {
    minHeight: 70,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactActionPressed: {
    backgroundColor: colors.brandSoft,
  },
  contactDivider: {
    height: 1,
    marginHorizontal: 12,
    backgroundColor: colors.line,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIconBox: {
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextContent: {
    marginLeft: 16,
  },
  contactLabel: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  contactValue: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    color: colors.ink,
  },
  whatsappBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  whatsappBtnText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  helpCard: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    minHeight: 88,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  helpTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#1E293B',
  },
  helpSubtitle: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  lockBadge: {
    alignSelf: 'center',
    marginTop: 8,
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetTitle: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 22,
    lineHeight: 30,
    color: colors.ink,
  },
  resetSubtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  requirementsCard: {
    marginTop: 10,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  requirementsHeading: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    lineHeight: 18,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  reqDone: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: colors.green,
    marginBottom: 6,
  },
  reqTodo: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  footerLines: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLine: {
    width: '45%',
    height: 1,
    backgroundColor: colors.line,
  },
  supportText: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  supportAction: {
    color: colors.brand,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
});
