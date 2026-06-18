import React from 'react';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { HelpCenterScreen } from './screens/HelpCenterScreen';
import { CreateAccountScreen, ForgotPasswordScreen, LoginScreen, ResetPasswordScreen } from './screens/AuthScreens';
import { ExamNativeScreen } from './screens/ExamNativeScreen';
import { HomeNativeScreen } from './screens/HomeNativeScreen';
import { LanguageSelectionScreen } from './screens/LanguageSelectionScreen';
import { LanguageSettingsScreen } from './screens/LanguageSettingsScreen';
import { PracticeNoSelectedNativeScreen, PracticeSelectedNativeScreen } from './screens/PracticeNativeScreen';
import { PerformanceDetailNativeScreen, PerformanceNativeScreen, PerformanceReviewNativeScreen } from './screens/PerformanceNativeScreens';
import { HelpCenterNativeScreen } from './screens/LearningNativeScreens';
import { PaymentConfirmationNativeScreen, PaymentNativeScreen, SubscriptionNativeScreen } from './screens/PaymentNativeScreens';
import { ProfileNativeScreen } from './screens/ProfileNativeScreen';
import { RootStackParamList } from './navigation/types';
import { ReferenceImageScreen } from './screens/ReferenceImageScreen';
import { ScreensHubScreen } from './screens/ScreensHubScreen';
import { StartExamNativeScreen } from './screens/StartExamNativeScreen';
import { ExamInstructionsNativeScreen } from './screens/ExamInstructionsNativeScreen';
import { ExamTypeSelectNativeScreen } from './screens/ExamTypeSelectNativeScreen';
import { TestFailedNativeScreen, TestPassedNativeScreen } from './screens/TestResultNativeScreen';
import { VideoCourseListScreen } from './screens/VideoCourseListScreen';
import { VideoCoursePlayerScreen } from './screens/VideoCoursePlayerScreen';
import { PdfViewerScreen } from './screens/PdfViewerScreen';
import { SplashScreen } from './screens/SplashScreen';
import { ReadingNativeScreen } from './screens/LearningNativeScreens';
import { AppFlowProvider } from './context/AppFlowContext';
import { AuthProvider } from './context/AuthContext';
import { GateModalProvider } from './context/GateModalContext';
import { NetworkStatusProvider } from './context/NetworkStatusContext';
import { OfflineBanner } from './components/OfflineBanner';
import { FullScreenErrorBoundary } from './components/FullScreenErrorBoundary';
import { colors } from './constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.canvas,
  },
};

const stackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
  animationTypeForReplace: 'push',
  animationMatchesGesture: true,
  fullScreenGestureEnabled: true,
  gestureEnabled: true,
  freezeOnBlur: true,
  contentStyle: {
    backgroundColor: colors.canvas,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
      <AppFlowProvider>
        <NetworkStatusProvider>
          <AuthProvider>
            <GateModalProvider>
              <FullScreenErrorBoundary>
                <View style={styles.app}>
                  <OfflineBanner />
                  <NavigationContainer theme={navTheme} ref={navigationRef}>
                    <Stack.Navigator screenOptions={stackScreenOptions} initialRouteName="Splash">
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
            <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="HomeNative" component={HomeNativeScreen} />
            <Stack.Screen name="ExamNative" component={ExamNativeScreen} />
            <Stack.Screen name="ExamInstructionsNative" component={ExamInstructionsNativeScreen} />
            <Stack.Screen name="ExamTypeSelectNative" component={ExamTypeSelectNativeScreen} />
            <Stack.Screen name="StartExamNative" component={StartExamNativeScreen} />
            <Stack.Screen name="PracticeNoSelectedNative" component={PracticeNoSelectedNativeScreen} />
            <Stack.Screen name="PracticeSelectedNative" component={PracticeSelectedNativeScreen} />
            <Stack.Screen name="TestFailedNative" component={TestFailedNativeScreen} />
            <Stack.Screen name="TestPassedNative" component={TestPassedNativeScreen} />
            <Stack.Screen name="PerformanceNative" component={PerformanceNativeScreen} />
            <Stack.Screen name="PerformanceDetailNative" component={PerformanceDetailNativeScreen} />
            <Stack.Screen name="PerformanceReviewNative" component={PerformanceReviewNativeScreen} />
            <Stack.Screen name="ReadingNative" component={ReadingNativeScreen} />
            <Stack.Screen name="HelpCenterNative" component={HelpCenterNativeScreen} />
            <Stack.Screen name="SubscriptionNative" component={SubscriptionNativeScreen} />
            <Stack.Screen name="PaymentNative" component={PaymentNativeScreen} />
            <Stack.Screen name="PaymentConfirmationNative" component={PaymentConfirmationNativeScreen} />
            <Stack.Screen name="ProfileNative" component={ProfileNativeScreen} />
            <Stack.Screen name="ScreensHub" component={ScreensHubScreen} />
            <Stack.Screen name="ReferenceImage" component={ReferenceImageScreen} />
            <Stack.Screen name="VideoCourseList" component={VideoCourseListScreen} />
            <Stack.Screen name="VideoCoursePlayer" component={VideoCoursePlayerScreen} />
            <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
            <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
                    </Stack.Navigator>
                  </NavigationContainer>
                </View>
              </FullScreenErrorBoundary>
            </GateModalProvider>
          </AuthProvider>
        </NetworkStatusProvider>
      </AppFlowProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
});
