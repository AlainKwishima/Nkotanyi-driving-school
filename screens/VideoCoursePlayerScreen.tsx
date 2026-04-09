import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { BottomNavBar } from '../components/BottomNavBar';
import { HeaderMenu } from '../components/HeaderMenu';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCoursePlayer'>;

const LESSONS = [
  { title: 'Learner Drivers First Ever Driving Lesson - #1', thumb: require('../assets/ui/video_thumb_1.png'), active: true },
  { title: 'Driving On Busy Main Roads For The First Time - Driving Lesson #2', thumb: require('../assets/ui/video_thumb_2.png'), active: false },
  { title: 'How To Turn Right At A T Junction - Driving Lesson #3', thumb: require('../assets/ui/video_thumb_3.png'), active: false },
  { title: 'Learner Driver FAILS TO STOP - Driving Lesson #4', thumb: require('../assets/ui/video_thumb_4.png'), active: false },
];

function BottomTabs({ navigation }: { navigation: Props['navigation'] }) {
  return <BottomNavBar navigation={navigation} />;
}

export function VideoCoursePlayerScreen({ navigation }: Props) {
  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#F6F8FE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Course</Text>
        <HeaderMenu navigation={navigation} iconColor="#F6F8FE" topOffset={72} rightOffset={14} />
      </View>

      <View style={styles.body}>
        <Image source={require('../assets/ui/video_thumb_2.png')} style={styles.hero} resizeMode="cover" />

        <View style={styles.playerOverlay}>
          <Ionicons name="play-circle-outline" size={72} color="rgba(255,255,255,0.85)" />
          <View style={styles.rewindLeft}><Text style={styles.seekText}>10s</Text></View>
          <View style={styles.rewindRight}><Text style={styles.seekText}>10s</Text></View>
        </View>

        <View style={styles.timelineRow}>
          <Text style={styles.timeText}>04:10</Text>
          <View style={styles.track}><View style={styles.progress} /></View>
          <Text style={styles.timeText}>24:10</Text>
        </View>

        <Text style={styles.sectionTitle}>Speed limit signs</Text>

        <ScrollView contentContainerStyle={styles.listPad} showsVerticalScrollIndicator={false}>
          {LESSONS.map((lesson, idx) => (
            <TouchableOpacity key={`${lesson.title}-${idx}`} style={[styles.card, lesson.active && styles.cardActive]} onPress={() => navigation.navigate('VideoCoursePlayer')}>
              <Image source={lesson.thumb} style={styles.thumb} resizeMode="cover" />
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{lesson.title}</Text>
                <Text style={[styles.duration, lesson.active && styles.playing]}>{lesson.active ? 'Playing now___' : '20 min'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <BottomTabs navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: '#4A78D0' },
  header: {
    height: 78,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 17, lineHeight: 24, color: '#F7F9FE' },
  body: {
    flex: 1,
    backgroundColor: '#CAD2DF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  hero: { width: '100%', height: 168 },
  playerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 18,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewindLeft: { position: 'absolute', left: 72, top: 48, width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: '#F0F3FA', alignItems: 'center', justifyContent: 'center' },
  rewindRight: { position: 'absolute', right: 72, top: 48, width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: '#F0F3FA', alignItems: 'center', justifyContent: 'center' },
  seekText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 10, lineHeight: 14, color: '#F5F8FF' },
  timelineRow: { marginTop: -22, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  timeText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, lineHeight: 16, color: '#F5F8FF' },
  track: { flex: 1, height: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 10 },
  progress: { width: '28%', height: 3, borderRadius: 999, backgroundColor: '#FFFFFF' },
  sectionTitle: { marginTop: 8, marginHorizontal: 14, fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, lineHeight: 20, color: '#2F3545' },
  listPad: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 90 },
  card: {
    height: 82,
    borderRadius: 10,
    backgroundColor: '#F2F3F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  cardActive: { backgroundColor: '#CBE0F3' },
  thumb: { width: 84, height: 54, borderRadius: 8 },
  cardTextWrap: { marginLeft: 12, flex: 1 },
  cardTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, lineHeight: 22, color: '#3A3E49' },
  duration: { marginTop: 3, fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, lineHeight: 16, color: '#757985' },
  playing: { color: '#FF6B4D' },
  tabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#EFF0F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: { alignItems: 'center' },
  tabBubble: { width: 46, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabBubbleActive: { backgroundColor: '#4A78D0' },
  tabText: { marginTop: 2, fontFamily: 'PlusJakartaSans-Medium', fontSize: 12, lineHeight: 14, color: '#8A98B2' },
  tabTextActive: { color: '#4A78D0' },
});

