import { ImageSourcePropType } from 'react-native';

export type ReferenceScreenKey =
  | 'splash'
  | 'languageSelection'
  | 'login'
  | 'createAccount'
  | 'forgotPassword'
  | 'resetPassword'
  | 'home'
  | 'exam'
  | 'startExam'
  | 'practiceNoSelected'
  | 'practiceSelected'
  | 'testFailed'
  | 'testPassed'
  | 'profile'
  | 'payment'
  | 'paymentConfirmation'
  | 'subscription'
  | 'performance'
  | 'performanceDetail'
  | 'performanceReview'
  | 'readingDocument'
  | 'roadSignsCategories'
  | 'roadSignsList'
  | 'roadSignsDetails'
  | 'videoCourseList'
  | 'videoCoursePlayer'
  | 'helpCenter';

export type ReferenceScreenMeta = {
  key: ReferenceScreenKey;
  title: string;
  source: ImageSourcePropType;
};

export const REFERENCE_SCREENS: ReferenceScreenMeta[] = [
  { key: 'splash', title: 'Splash Screen', source: require('./screenRefs/Splash Screen.png') },
  {
    key: 'languageSelection',
    title: 'Language Selection',
    source: require('./screenRefs/language selection.png'),
  },
  { key: 'login', title: 'Login Screen', source: require('./screenRefs/login.png') },
  {
    key: 'createAccount',
    title: 'Create Account',
    source: require('./screenRefs/create account.png'),
  },
  {
    key: 'forgotPassword',
    title: 'Forgot Password',
    source: require('./screenRefs/Forgot Password.png'),
  },
  {
    key: 'resetPassword',
    title: 'Reset Password',
    source: require('./screenRefs/Reset Password.png'),
  },
  { key: 'home', title: 'Home Screen', source: require('./screenRefs/Home Screen.png') },
  { key: 'exam', title: 'Exam Screen', source: require('./screenRefs/Exam screen.png') },
  { key: 'startExam', title: 'Start Exam Screen', source: require('./screenRefs/start exam screen.png') },
  {
    key: 'practiceNoSelected',
    title: 'Practice Questions - No Selected',
    source: require('./screenRefs/Practice Questions -  No Selected.png'),
  },
  {
    key: 'practiceSelected',
    title: 'Practice Questions - Selected',
    source: require('./screenRefs/Practice Questions - Selected.png'),
  },
  {
    key: 'testFailed',
    title: 'Test Result - Failed',
    source: require('./screenRefs/Test Result Screen - Failed.png'),
  },
  {
    key: 'testPassed',
    title: 'Test Result - Passed',
    source: require('./screenRefs/Test Result Screen - Passed.png'),
  },
  { key: 'profile', title: 'Profile Screen', source: require('./screenRefs/profile screen.jpg') },
  { key: 'payment', title: 'Payment Screen', source: require('./screenRefs/Payment screen.png') },
  {
    key: 'paymentConfirmation',
    title: 'Payment Confirmation Screen',
    source: require('./screenRefs/Payment confirmation screen.png'),
  },
  {
    key: 'subscription',
    title: 'Subscription Screen',
    source: require('./screenRefs/seunscription screen.png'),
  },
  { key: 'performance', title: 'Performance Screen', source: require('./screenRefs/performance screen.png') },
  {
    key: 'performanceDetail',
    title: 'Performance Detail Screen',
    source: require('./screenRefs/Performance detail screen.png'),
  },
  {
    key: 'performanceReview',
    title: 'Performance Review Screen',
    source: require('./screenRefs/performance review.jpg'),
  },
  {
    key: 'readingDocument',
    title: 'Reading Document Screen',
    source: require('./screenRefs/Reading Document screen.png'),
  },
  {
    key: 'roadSignsCategories',
    title: 'Road Signs Categories',
    source: require('./screenRefs/Road Signs - Categories.png'),
  },
  {
    key: 'roadSignsList',
    title: 'Road Signs List',
    source: require('./screenRefs/Road Signs - List.png'),
  },
  {
    key: 'roadSignsDetails',
    title: 'Road Signs Details',
    source: require('./screenRefs/Road Signs - Details.png'),
  },
  {
    key: 'videoCourseList',
    title: 'Video Course List',
    source: require('./screenRefs/video course list screen.png'),
  },
  {
    key: 'videoCoursePlayer',
    title: 'Video Course Player',
    source: require('./screenRefs/Video course screen.png'),
  },
  { key: 'helpCenter', title: 'Help Center', source: require('./screenRefs/Help center.png') },
];

export const REFERENCE_BY_KEY: Record<ReferenceScreenKey, ReferenceScreenMeta> = REFERENCE_SCREENS.reduce(
  (acc, screen) => {
    acc[screen.key] = screen;
    return acc;
  },
  {} as Record<ReferenceScreenKey, ReferenceScreenMeta>,
);
