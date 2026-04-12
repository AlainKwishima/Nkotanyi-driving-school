import { ReferenceScreenKey } from '../assets/referenceScreens';

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelection: { changeOnly?: boolean } | undefined;
  Login: undefined;
  CreateAccount: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  HomeNative: undefined;
  ExamNative: { mode?: 'traffic' | 'signs' } | undefined;
  ExamInstructionsNative: undefined;
  StartExamNative: { gateFor?: 'exam' | 'read' | 'watch' } | undefined;
  PracticeNoSelectedNative: undefined;
  PracticeSelectedNative: undefined;
  TestFailedNative: { correct?: number; total?: number; timeLabel?: string; percent?: number } | undefined;
  TestPassedNative: { correct?: number; total?: number; timeLabel?: string; percent?: number } | undefined;
  PerformanceNative: undefined;
  PerformanceDetailNative:
    | {
        correct?: number;
        total?: number;
        percent?: number;
        timeLabel?: string;
        passed?: boolean;
        dateLabel?: string;
        title?: string;
      }
    | undefined;
  PerformanceReviewNative: undefined;
  ReadingNative: undefined;
  RoadSignsListNative: undefined;
  RoadSignsDetailNative: undefined;
  HelpCenterNative: undefined;
  SubscriptionNative: undefined;
  PaymentNative:
    | {
        planTitle?: string;
        amountRwf?: number;
        subscriptionType?: string;
      }
    | undefined;
  PaymentConfirmationNative:
    | {
        planTitle?: string;
        amountRwf?: number;
        /** Display reference from API when available; otherwise client-generated */
        orderId?: string;
        /** Localized date/time string for receipt */
        paidAtLabel?: string;
      }
    | undefined;
  ProfileNative: undefined;
  ScreensHub: undefined;
  ReferenceImage: { key: ReferenceScreenKey };
  VideoCourseList: undefined;
  VideoCoursePlayer: { title?: string; videoUrl?: string } | undefined;
  RoadSignsCategories: undefined;
  HelpCenter: undefined;
};
