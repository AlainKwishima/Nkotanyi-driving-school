import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';

import { HelpCenterScreen } from './screens/HelpCenterScreen';
import { CreateAccountScreen, ForgotPasswordScreen, LoginScreen, ResetPasswordScreen } from './screens/AuthScreens';
import { ExamNativeScreen } from './screens/ExamNativeScreen';
import { HomeNativeScreen } from './screens/HomeNativeScreen';
import { LanguageSelectionScreen } from './screens/LanguageSelectionScreen';
import { PracticeNoSelectedNativeScreen, PracticeSelectedNativeScreen } from './screens/PracticeNativeScreen';
import { PerformanceDetailNativeScreen, PerformanceNativeScreen, PerformanceReviewNativeScreen } from './screens/PerformanceNativeScreens';
import { HelpCenterNativeScreen, ReadingNativeScreen, RoadSignsDetailNativeScreen, RoadSignsListNativeScreen } from './screens/LearningNativeScreens';
import { PaymentConfirmationNativeScreen, PaymentNativeScreen, SubscriptionNativeScreen } from './screens/PaymentNativeScreens';
import { ProfileNativeScreen } from './screens/ProfileNativeScreen';
import { RootStackParamList } from './navigation/types';
import { ReferenceImageScreen } from './screens/ReferenceImageScreen';
import { RoadSignsCategoriesScreen } from './screens/RoadSignsCategoriesScreen';
import { ScreensHubScreen } from './screens/ScreensHubScreen';
import { StartExamNativeScreen } from './screens/StartExamNativeScreen';
import { ExamInstructionsNativeScreen } from './screens/ExamInstructionsNativeScreen';
import { TestFailedNativeScreen, TestPassedNativeScreen } from './screens/TestResultNativeScreen';
import { VideoCourseListScreen } from './screens/VideoCourseListScreen';
import { VideoCoursePlayerScreen } from './screens/VideoCoursePlayerScreen';
import { SplashScreen } from './screens/SplashScreen';
import { AppFlowProvider } from './context/AppFlowContext';
import { GateModalProvider } from './context/GateModalContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FBF8FD',
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-ExtraBold': Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4378DB" />
      </View>
    );
  }

  return (
    <AppFlowProvider>
      <GateModalProvider>
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="HomeNative" component={HomeNativeScreen} />
            <Stack.Screen name="ExamNative" component={ExamNativeScreen} />
            <Stack.Screen name="ExamInstructionsNative" component={ExamInstructionsNativeScreen} />
            <Stack.Screen name="StartExamNative" component={StartExamNativeScreen} />
            <Stack.Screen name="PracticeNoSelectedNative" component={PracticeNoSelectedNativeScreen} />
            <Stack.Screen name="PracticeSelectedNative" component={PracticeSelectedNativeScreen} />
            <Stack.Screen name="TestFailedNative" component={TestFailedNativeScreen} />
            <Stack.Screen name="TestPassedNative" component={TestPassedNativeScreen} />
            <Stack.Screen name="PerformanceNative" component={PerformanceNativeScreen} />
            <Stack.Screen name="PerformanceDetailNative" component={PerformanceDetailNativeScreen} />
            <Stack.Screen name="PerformanceReviewNative" component={PerformanceReviewNativeScreen} />
            <Stack.Screen name="ReadingNative" component={ReadingNativeScreen} />
            <Stack.Screen name="RoadSignsListNative" component={RoadSignsListNativeScreen} />
            <Stack.Screen name="RoadSignsDetailNative" component={RoadSignsDetailNativeScreen} />
            <Stack.Screen name="HelpCenterNative" component={HelpCenterNativeScreen} />
            <Stack.Screen name="SubscriptionNative" component={SubscriptionNativeScreen} />
            <Stack.Screen name="PaymentNative" component={PaymentNativeScreen} />
            <Stack.Screen name="PaymentConfirmationNative" component={PaymentConfirmationNativeScreen} />
            <Stack.Screen name="ProfileNative" component={ProfileNativeScreen} />
            <Stack.Screen name="ScreensHub" component={ScreensHubScreen} />
            <Stack.Screen name="ReferenceImage" component={ReferenceImageScreen} />
            <Stack.Screen name="VideoCourseList" component={VideoCourseListScreen} />
            <Stack.Screen name="VideoCoursePlayer" component={VideoCoursePlayerScreen} />
            <Stack.Screen name="RoadSignsCategories" component={RoadSignsCategoriesScreen} />
            <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </GateModalProvider>
    </AppFlowProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF8FD',
  },
});

