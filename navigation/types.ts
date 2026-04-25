import { ReferenceScreenKey } from '../assets/referenceScreens';

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelection: { changeOnly?: boolean } | undefined;
  LanguageSettings: undefined;
  Login: { prefill?: { phone?: string; password?: string; name?: string }; showSignupSuccess?: boolean } | undefined;
  CreateAccount: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  HomeNative: undefined;
  ExamNative: { mode?: 'traffic' | 'signs' } | undefined;
  ExamInstructionsNative: undefined;
  ExamTypeSelectNative: undefined;
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
        answeredCount?: number;
        startedAt?: string;
        finishedAt?: string;
        elapsedSec?: number;
        answerDetails?: Array<{
          questionId: string;
          questionText: string;
          selectedOptionText: string | null;
          correctOptionText: string | null;
          isCorrect: boolean;
        }>;
      }
    | undefined;
  PerformanceReviewNative:
    | {
        title?: string;
        dateLabel?: string;
        correct?: number;
        total?: number;
        percent?: number;
        timeLabel?: string;
        passed?: boolean;
        answeredCount?: number;
        startedAt?: string;
        finishedAt?: string;
        elapsedSec?: number;
        answerDetails?: Array<{
          questionId: string;
          questionText: string;
          selectedOptionText: string | null;
          correctOptionText: string | null;
          isCorrect: boolean;
        }>;
      }
    | undefined;
  ReadingNative: undefined;
  RoadSignsNative: undefined;
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
  VideoCoursePlayer:
    | {
        title?: string;
        videoUrl?: string;
        videoId?: string;
        currentIndex?: number;
        allVideos?: Array<{
          _id?: string;
          title?: string;
          videoUrl?: string;
          thumbUri?: string;
          duration?: string;
        }>;
      }
    | undefined;
  HelpCenter: undefined;
  PdfViewer: { title: string; url: string };
};
