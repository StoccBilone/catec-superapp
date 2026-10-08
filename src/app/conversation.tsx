import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from "react-native";
import { Text, TouchableOpacity } from "../components/Typography";
import { ScreenSafeArea as SafeAreaView } from '../components/ScreenSafeArea';
import { router, useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '../screens/ChatScreen';
import { useCampus } from '../context/CampusContext';
import { ChatRoom, getChatRooms } from '../services/chatRooms';
import { useTheme } from '../theme/themeContext';

export default function ConversationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, openNotifications } = useCampus();
  const { colors } = useTheme();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    if (profile) void getChatRooms(profile.id).then(rooms => { if (active) setRoom(rooms.find(item => item.id === id) || null); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, profile]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
    {loading ? <ActivityIndicator color={colors.accent} /> : room && profile ? <ChatScreen profile={{ ...profile, group: room.storageKey }} groupName={room.collegeGroup} title={room.title} onBack={() => router.back()} onOpenNotifications={openNotifications} /> : <TouchableOpacity onPress={() => router.back()}><Text style={{ padding: 24, color: colors.accent }}>Беседа недоступна. Вернуться</Text></TouchableOpacity>}
  </SafeAreaView>;
}
