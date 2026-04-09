import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { HeaderMenu } from '../components/HeaderMenu';
import { BottomNavBar } from '../components/BottomNavBar';
import { useAppFlow } from '../context/AppFlowContext';
import { useGateModal } from '../context/GateModalContext';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeNative'>;

type QuickAction = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  route: 'StartExamNative' | 'RoadSignsListNative' | 'ReadingNative' | 'VideoCourseList' | 'PerformanceNative';
};

const QUICK_ACTIONS: QuickAction[] = [
  { title: 'Examinations', subtitle: 'Test your\nknowledge', icon: 'file-question-outline', route: 'StartExamNative' },
  { title: 'Road Signs', subtitle: 'Visual library', icon: 'traffic-light-outline', route: 'RoadSignsListNative' },
  { title: 'Reading\nMaterials', subtitle: 'Manuals & guides', icon: 'book-open-page-variant-outline', route: 'ReadingNative' },
  { title: 'Performance\nHistory', subtitle: 'Review your scores', icon: 'history', route: 'PerformanceNative' },
];

function QuickActionCard({ action, onPress }: { action: QuickAction; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardIconWrap}>
        <MaterialCommunityIcons name={action.icon} size={20} color="#F6F7FA" />
      </View>
      <Text style={styles.cardTitle}>{action.title}</Text>
      <Text style={styles.cardSubtitle}>{action.subtitle}</Text>
    </TouchableOpacity>
  );
}

function BottomNav({ navigation }: { navigation: Props['navigation'] }) {
  return <BottomNavBar navigation={navigation} />;
}

export function HomeNativeScreen({ navigation }: Props) {
  const { hasUsedFreeTrial, hasSubscription } = useAppFlow();
  const { openGateModal } = useGateModal();
  const showTrial = !hasUsedFreeTrial && !hasSubscription;
  const handleQuickAction = (route: QuickAction['route']) => {
    if (route === 'StartExamNative') {
      navigation.navigate('StartExamNative', { gateFor: 'exam' });
      return;
    }

    const needsReadGate = route === 'ReadingNative' || route === 'RoadSignsListNative';
    const needsWatchGate = route === 'VideoCourseList';

    if (!hasSubscription && (needsReadGate || needsWatchGate)) {
      openGateModal(needsReadGate ? 'subscription_read' : 'subscription_watch', () => navigation.navigate('SubscriptionNative'));
      return;
    }

    navigation.navigate(route);
  };

  return (
    <View style={styles.safe}>
      <View style={styles.headerBlue}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backTap}>
            <Ionicons name="chevron-back" size={24} color="#4B79D0" />
          </TouchableOpacity>
          <Text style={styles.homeTitle}>Home</Text>
          <HeaderMenu navigation={navigation} iconColor="#F2F3F8" topOffset={72} rightOffset={16} />
        </View>
      </View>

      <View style={styles.bodyWrap}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.welcome}>Welcome back, Alain!</Text>
          <Text style={styles.subwelcome}>You're on the fast track to getting your{'\n'}license.</Text>
          {showTrial ? (
            <View style={styles.trialCard}>
              <Text style={styles.trialTitle}>Free Trial Available</Text>
              <Text style={styles.trialText}>You have 1 free exam trial. Use it before subscribing.</Text>
            </View>
          ) : null}

          <View style={styles.quickHeader}>
            <Text style={styles.quickTitle}>Quick Actions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ScreensHub')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {QUICK_ACTIONS.map((action, index) => (
              <View key={action.title} style={[styles.gridItem, index % 2 === 1 && styles.gridItemRight]}>
                <QuickActionCard action={action} onPress={() => handleQuickAction(action.route)} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <BottomNav navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: '#4A78D0',
  },
  headerBlue: {
    backgroundColor: '#4A78D0',
    height: 78,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  titleRow: {
    marginTop: 0,
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backTap: {
    width: 26,
    height: 26,
  },
  homeTitle: {
    color: '#F3F5FA',
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  bodyWrap: {
    flex: 1,
    backgroundColor: '#CBD1DD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 98,
  },
  welcome: {
    fontSize: 20,
    lineHeight: 30,
    color: '#3D414A',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.8,
  },
  subwelcome: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 17,
    color: '#4A4E59',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  trialCard: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#E9F1FF',
    borderWidth: 1,
    borderColor: '#9DB7EA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  trialTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#26437D',
  },
  trialText: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#3D5484',
  },
  quickHeader: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickTitle: {
    fontSize: 15,
    lineHeight: 18,
    color: '#2B313C',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  viewAll: {
    fontSize: 13,
    lineHeight: 14,
    color: '#2B313C',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  grid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  gridItemRight: {
    marginLeft: '4%',
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#D8D7DC',
    minHeight: 158,
    padding: 14,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 15,
    color: '#4473CC',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    color: '#4C4F59',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
    backgroundColor: '#E3E6EC',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  activeTab: {
    width: 72,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A78D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
  activeTabText: {
    marginTop: -1,
    fontSize: 11,
    lineHeight: 14,
    color: '#F4F7FF',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
  },
  tabText: {
    marginTop: -2,
    fontSize: 10,
    lineHeight: 12,
    color: '#8898B0',
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
  },
});
